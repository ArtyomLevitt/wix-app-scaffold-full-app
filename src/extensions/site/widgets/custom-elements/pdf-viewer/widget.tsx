import React, { type FC, useEffect, useMemo, useState } from 'react';
import ReactDOM from 'react-dom';
import reactToWebComponent from 'react-to-webcomponent';
import { IntlProvider, useIntl } from 'react-intl';
import { httpClient } from '@wix/essentials';
import { ErrorBoundary } from '../../../../_shared/error-boundary';
import { PdfViewerCore, detectSandboxedFrame } from '../../../../_shared/pdf-viewer-core';
import type { PublicWidgetSettings } from '../../../../_shared/widget-settings-types';
import { loadMessages, getLocaleSafe } from '../../../../../intl/load-messages';

const getApiBase = (): string => {
  try {
    return new URL(import.meta.url).origin;
  } catch {
    return '';
  }
};

async function fetchWithTimeout(url: string, ms = 6000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await httpClient.fetchWithAuth(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

const WidgetInner: FC = () => {
  const intl = useIntl();
  const t = (id: string) => intl.formatMessage({ id });

  const [settings, setSettings] = useState<PublicWidgetSettings | null>(null);
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const base = getApiBase();
        const res = await fetchWithTimeout(`${base}/api/widget/settings`);
        if (!res.ok) throw new Error('settings fetch failed');
        const data = (await res.json()) as PublicWidgetSettings;
        if (!cancelled) {
          setSettings(data);
          setLoadState('ready');
        }
      } catch (err) {
        console.error('[pdf-viewer widget] load failed:', err);
        if (!cancelled) setLoadState('error');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const labels = useMemo(
    () => ({
      placeholderTitle: t('widget.placeholderTitle'),
      placeholderSubtitle: t('widget.placeholderSubtitle'),
      invalidUrl: t('widget.invalidUrl'),
      loadError: t('widget.loadError'),
      editorPreviewTitle: t('widget.editorPreviewTitle'),
      editorPreviewSubtitle: t('widget.editorPreviewSubtitle'),
      prevPage: t('widget.prevPage'),
      nextPage: t('widget.nextPage'),
      zoomIn: t('widget.zoomIn'),
      zoomOut: t('widget.zoomOut'),
      download: t('widget.download'),
      pageOf: t('widget.pageOf'),
      poweredBy: t('widget.poweredBy'),
      pageLimitNotice: t('widget.pageLimitNotice'),
    }),
    [intl],
  );

  if (loadState === 'loading') {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          minHeight: 320,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Roboto, sans-serif',
        }}
      >
        …
      </div>
    );
  }

  if (loadState === 'error' || !settings) {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          minHeight: 320,
          padding: 24,
          textAlign: 'center',
          color: '#666',
        }}
      >
        {t('widget.loadError')}
      </div>
    );
  }

  return (
    <PdfViewerCore
      pdfUrl={settings.pdfUrl}
      defaultZoom={settings.defaultZoom}
      fitMode={settings.fitMode}
      showToolbar={settings.showToolbar}
      allowDownload={settings.allowDownload}
      theme={settings.theme}
      accentColor={settings.accentColor}
      viewerHeight={settings.viewerHeight}
      pageLayout={settings.pageLayout}
      isPremium={settings.isPremium}
      maxPages={settings.maxPages}
      labels={labels}
      isEditorPreview={detectSandboxedFrame()}
    />
  );
};

const LocalizedWidget: FC = () => {
  const [messages, setMessages] = useState<Record<string, string> | null>(null);
  const [locale, setLocale] = useState('en');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const loc = await getLocaleSafe();
        const msgs = await loadMessages(loc);
        if (!cancelled) {
          setLocale(loc);
          setMessages(msgs);
        }
      } catch {
        if (!cancelled) {
          const mod = await import('../../../../../intl/messages/en.json');
          setMessages((mod.default ?? mod) as Record<string, string>);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!messages) return null;

  return (
    <IntlProvider messages={messages} locale={locale} defaultLocale="en">
      <WidgetInner />
    </IntlProvider>
  );
};

const BoundedWidget: FC = () => (
  <ErrorBoundary surface="widget">
    <LocalizedWidget />
  </ErrorBoundary>
);

const PdfViewerElement = reactToWebComponent(BoundedWidget, React, ReactDOM as typeof ReactDOM);

export default PdfViewerElement;
