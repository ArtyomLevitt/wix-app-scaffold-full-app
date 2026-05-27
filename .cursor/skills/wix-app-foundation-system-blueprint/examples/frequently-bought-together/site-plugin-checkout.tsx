// @ts-nocheck — reference skeleton, not real source. Imports point at placeholder paths or modules that aren't installed in this skills repo. See examples/INDEX.md.
// SKELETON — distilled from frequently-bought-together/src/site/plugins/custom-elements/fbt-checkout/plugin.tsx (404 lines).
// Goes at: src/site/plugins/custom-elements/<slug>/plugin.tsx
//
// Demonstrates the canonical PRPL site-plugin patterns:
//   1. reactToWebComponent — wrap a React FC into a custom element
//   2. IntlProvider + loadMessages — translation lookup at the site, not dashboard
//   3. Settings polling — site plugin reads dashboard-edited settings from Wix Data every 3s
//   4. Smart fallback — try a backend method, fall back to DOM scraping if checkoutId not yet ready
//   5. currentCart.addToCurrentCart — adding items from the storefront
//   6. Inline styles ONLY — site plugins cannot use @wix/design-system (WDS is dashboard-only)

import React, { type FC, useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import reactToWebComponent from 'react-to-webcomponent';
import { items } from '@wix/data';
import { currentCart } from '@wix/ecom';
import { ecom } from '@wix/site-ecom';
import { IntlProvider, useIntl } from 'react-intl';
import { i18n } from '@wix/essentials';

import { getCheckoutRecommendations, getSmartRecommendations } from '../../../../backend/recommendations.web';
import { loadMessages } from '../../../../intl/load-messages';

const SETTINGS_COLLECTION = '@<APP_NS>/<app>/<settings-collection>'; // e.g. @s21797/frequently-bought-together/fbt-settings
const SETTINGS_KEY = 'displaySettings';
const STORES_APP_DEF_ID = '1380b703-ce81-ff05-f115-39571d94dfcd';     // Wix Stores' fixed app definition ID

type Props = {
  displayName: string;
  maxItems: string;
  checkoutId: string;
};

interface Recommendation {
  productId: string;
  productName: string;
  imageUrl: string;
  slug: string;
  formattedPrice: string;
}

/** Detect Wix site URL prefix (e.g. /mysite for Wix-hosted sites) for product page links. */
function getSitePrefix(): string {
  try {
    const existingLink = document.querySelector('a[href*="/product-page/"]') as HTMLAnchorElement | null;
    if (existingLink) {
      const href = existingLink.getAttribute('href') || '';
      const idx = href.indexOf('/product-page/');
      if (idx > 0) return href.substring(0, idx);
    }
    if (window.location.hostname.includes('wixsite.com')) {
      const parts = window.location.pathname.split('/').filter(Boolean);
      if (parts.length > 0) return '/' + parts[0];
    }
  } catch {}
  return '';
}

function getLocaleSafe(): string {
  try { return i18n.getLocale(); } catch { return 'en'; }
}

/** Fallback: scrape product names from the checkout DOM when checkoutId isn't available. */
function extractCheckoutProductNames(): string[] {
  const names: string[] = [];
  try {
    const hookSelectors = [
      '[data-hook="LineItemName"]',
      '[data-hook="item-name"]',
      '[data-hook="product-name"]',
      '[data-hook="checkout-item-name"]',
    ];
    for (const sel of hookSelectors) {
      document.querySelectorAll(sel).forEach((el) => {
        const text = (el.textContent || '').trim();
        if (text && !names.includes(text)) names.push(text);
      });
      if (names.length > 0) return names;
    }
    document.querySelectorAll('a[href*="/product-page/"]').forEach((link) => {
      const text = (link.textContent || '').trim();
      if (text && text.length >= 2 && text.length <= 80 && !names.includes(text)) names.push(text);
    });
  } catch {}
  return names;
}

const Inner: FC<Props> = (props) => {
  const intl = useIntl();
  const t = (id: string, values?: Record<string, string | number>) => intl.formatMessage({ id }, values);

  const [displayName, setDisplayName] = useState(props.displayName || 'Frequently Bought Together');
  const [maxItems, setMaxItems] = useState(Math.min(3, Math.max(1, parseInt(props.maxItems || '3', 10) || 3)));
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);

  /* (1) Settings poll — refresh from Wix Data every 3s so dashboard edits appear live in editor preview */
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    const loadSettings = () => {
      items.query(SETTINGS_COLLECTION).eq('key', SETTINGS_KEY).limit(1).find()
        .then((result) => {
          if (result.items && result.items.length > 0) {
            const settings = result.items[0] as any;
            setDisplayName(settings.sectionTitle || displayName);
            if (settings.maxItems != null) setMaxItems(Math.min(3, Math.max(1, Number(settings.maxItems) || 3)));
          }
        })
        .catch(() => {});
    };
    loadSettings();
    pollRef.current = setInterval(loadSettings, 3000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  /* (2) Recommendations fetch — try checkoutId-based, fall back to DOM scrape, then hide widget if nothing matches */
  useEffect(() => {
    let didSet = false;
    async function fetchRecs() {
      try {
        const cid = props.checkoutId
          || (document.querySelector('[data-checkout-id]') as HTMLElement)?.dataset?.checkoutId
          || '';

        if (cid) {
          const result = await getCheckoutRecommendations(cid);
          if (result.recommendations?.length > 0) {
            didSet = true;
            setRecommendations(result.recommendations.slice(0, maxItems));
            return;
          }
        }
        const productNames = extractCheckoutProductNames();
        if (productNames.length > 0) {
          const result = await getSmartRecommendations(productNames, 'checkout');
          if (result.recommendations?.length > 0) {
            didSet = true;
            setRecommendations(result.recommendations.slice(0, maxItems));
            return;
          }
        }
      } catch (err) {
        console.error('[fbt-checkout] fetchRecs failed', err);
      } finally {
        if (!didSet) setLoading(false);
      }
    }
    fetchRecs();
  }, [maxItems, props.checkoutId]);

  /* Avoid layout flash — clear loading only after recs paint */
  useEffect(() => {
    if (recommendations.length === 0) return;
    const id = requestAnimationFrame(() => setLoading(false));
    return () => cancelAnimationFrame(id);
  }, [recommendations]);

  /* (3) Add-to-cart with currentCart API — pass appId of the source app (Wix Stores here) */
  const [addedToCart, setAddedToCart] = useState<Set<string>>(new Set());
  const handleAddToCart = async (e: React.MouseEvent, rec: Recommendation) => {
    e.stopPropagation();
    if (addedToCart.has(rec.productId)) return;
    try {
      await currentCart.addToCurrentCart({
        lineItems: [{
          catalogReference: { catalogItemId: rec.productId, appId: STORES_APP_DEF_ID },
          quantity: 1,
        }],
      });
      setAddedToCart((prev) => new Set(prev).add(rec.productId));
      try { await ecom.refreshCart(); } catch {}
    } catch (err) {
      console.error('[fbt-checkout] addToCart failed', err);
    }
  };

  /* CRITICAL — never show a placeholder to shoppers when there's nothing to recommend */
  if (!loading && recommendations.length === 0) return null;
  if (loading) return null;

  return (
    <div style={{ fontFamily: 'Helvetica Neue, sans-serif', padding: '10px 0' }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: '#666', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {displayName}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {recommendations.map((rec) => (
          <div
            key={rec.productId}
            onClick={() => rec.slug && window.open(`${getSitePrefix()}/product-page/${rec.slug}`, '_blank')}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 6, background: '#fff', border: '1px solid #e8e8e8', cursor: rec.slug ? 'pointer' : 'default' }}
          >
            {rec.imageUrl
              ? <img src={rec.imageUrl} alt={rec.productName} style={{ width: 32, height: 32, borderRadius: 4, objectFit: 'cover', flexShrink: 0 }} />
              : <div style={{ width: 32, height: 32, borderRadius: 4, background: '#f0f4f7', flexShrink: 0 }} />}
            <span style={{ fontSize: 13, color: '#333', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
              {rec.productName}
            </span>
            {rec.formattedPrice && (
              <span style={{ fontSize: 12, color: '#666', fontWeight: 600, flexShrink: 0 }}>{rec.formattedPrice}</span>
            )}
            <button
              onClick={(e) => handleAddToCart(e, rec)}
              disabled={addedToCart.has(rec.productId)}
              style={{ flexShrink: 0, width: 26, height: 26, borderRadius: 4, border: 'none', background: addedToCart.has(rec.productId) ? '#4CAF50' : '#333', color: '#fff', cursor: addedToCart.has(rec.productId) ? 'default' : 'pointer' }}
              title={addedToCart.has(rec.productId) ? t('plugin.added') : t('plugin.addToCart')}
            >
              {addedToCart.has(rec.productId) ? '✓' : '+'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

/* (4) IntlProvider — load translation messages from intl/messages/<locale>.json,
 *     fall back to en.json. Site plugins MUST do their own intl setup; the dashboard's
 *     withIntlProvider wrapper does NOT extend to plugins. */
const Plugin: FC<Props> = (props) => {
  const [messages, setMessages] = useState<Record<string, string> | null>(null);
  useEffect(() => {
    loadMessages()
      .then(setMessages)
      .catch(() => {
        import('../../../../intl/messages/en.json').then((m) => setMessages(m.default));
      });
  }, []);
  if (!messages) return null;
  return (
    <IntlProvider messages={messages} locale={getLocaleSafe()} defaultLocale="en">
      <Inner {...props} />
    </IntlProvider>
  );
};

/* (5) reactToWebComponent — props are typed as 'string' here because Wix passes
 *     all props as DOM attributes (= strings). Convert to numbers/booleans inside the component. */
const customElement = reactToWebComponent(Plugin, React, ReactDOM as any, {
  props: {
    displayName: 'string',
    maxItems: 'string',
    checkoutId: 'string',
  },
});

export default customElement;
