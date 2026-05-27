// @ts-nocheck — reference skeleton, not real source. Imports point at placeholder paths or modules that aren't installed in this skills repo. See examples/INDEX.md.
// SKELETON — distilled from frequently-bought-together/src/dashboard/pages/page.tsx (2403 lines).
// Shows the canonical PRPL dashboard structure: 3 tabs, premium check, dynamic plans,
// onboarding inside Manage tab, first-action celebration → review popup chain.
//
// To use:  copy this file to src/dashboard/pages/page.tsx and rewrite the manage-tab
// content for your app. Keep the tabs, premium check, plans loading, onboarding,
// celebration, and review-popup chain VERBATIM.

import React, { type FC, useState, useEffect, useRef, useCallback } from 'react';
import {
  Box, Button, Card, Cell, Layout, Loader, Page, Tabs, Text,
  WixDesignSystemProvider,
} from '@wix/design-system';
import '@wix/design-system/styles.global.css';
import * as Icons from '@wix/wix-ui-icons-common';
import { dashboard } from '@wix/dashboard';
import { items } from '@wix/data';
import { useIntl } from 'react-intl';

import { checkPremium } from '../../backend/check-premium.web';
import { getAppPlans, type AppPlan } from '../../backend/app-plans.web';
import { trackSetupCompleted } from '../../backend/_shared/tracking.web';
import { ensureRatePopupRegistered, openRatePopup } from '../_shared/rate-popup';
import { withIntlProvider } from '../../intl/withIntlProvider';

/* ─── Identity (replace per app) ─── */
const APP_ID            = '<APP_ID>';
const APP_SLUG          = 'fbt';                              // short namespace prefix for localStorage keys
const COLLECTION_ID     = '@<APP_NS>/<app>/<collection>';     // e.g. '@s21797/frequently-bought-together/fbt-rules'
const REVIEW_URL        = `https://www.wix.com/app-market/add-review/${APP_ID}`;
const REVIEW_SHOWN_KEY    = `${APP_SLUG}_review_shown_v1`;
const CELEBRATION_SHOWN_KEY = `${APP_SLUG}_celebration_v1`;
const ONBOARDING_KEY      = `${APP_SLUG}_onboarding_done`;

/* ─── Tabs ─── */
type DashboardTab = 'manage' | 'planSettings' | 'howToUse';

/* ─── Per-plan limits (rules / configs / etc.) ─── */
const PLAN_LIMITS: Record<string, number> = {
  free: 1, basic: 1, starter: 5, standard: 25, advanced: Infinity, premium: Infinity,
};

const DashboardPage: FC = () => {
  const intl = useIntl();
  const t = useCallback(
    (id: string, values?: Record<string, string | number>) => intl.formatMessage({ id }, values),
    [intl]
  );

  /* ─── Premium state ─── */
  const [planLoading, setPlanLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [planStatus, setPlanStatus] = useState<'premium' | 'cancelled' | 'free'>('free');
  const [currentPlanName, setCurrentPlanName] = useState('free');
  const [instanceId, setInstanceId] = useState<string | undefined>(undefined);

  const upgradeUrl = instanceId
    ? `https://www.wix.com/apps/upgrade/${APP_ID}?appInstanceId=${instanceId}`
    : `https://www.wix.com/apps/upgrade/${APP_ID}`;

  const maxItems = PLAN_LIMITS[currentPlanName.toLowerCase()] ?? 1;

  /* ─── Dynamic plans ─── */
  const [plans, setPlans] = useState<AppPlan[]>([]);
  const [currencySymbol, setCurrencySymbol] = useState('$');
  const [plansLoading, setPlansLoading] = useState(true);

  /* ─── Tabs state ─── */
  const [dashboardTab, setDashboardTab] = useState<DashboardTab>('manage');

  /* ─── Onboarding ─── */
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [onboardingDismissed, setOnboardingDismissedRaw] = useState(() => {
    try { return localStorage.getItem(ONBOARDING_KEY) === '1'; } catch { return false; }
  });
  const setOnboardingDismissed = useCallback((val: boolean) => {
    try { if (val) localStorage.setItem(ONBOARDING_KEY, '1'); } catch {}
    setOnboardingDismissedRaw(val);
  }, []);

  /* ─── Domain data (rules, products, etc.) ─── */
  const [items_, setItems] = useState<any[]>([]);
  const [itemsLoading, setItemsLoading] = useState(true);

  const isFirstTime = !itemsLoading && items_.length === 0;
  const showOnboarding = isFirstTime && !onboardingDismissed;

  /* ─── Celebration + review popup chain ─── */
  const [showCelebration, setShowCelebration] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);
  const celebrationRef = useRef<HTMLDivElement>(null);

  const triggerReviewPopupOnce = useCallback(() => {
    try {
      if (localStorage.getItem(REVIEW_SHOWN_KEY)) return;
      localStorage.setItem(REVIEW_SHOWN_KEY, '1');
      openRatePopup(REVIEW_URL);
    } catch (e) {
      console.warn('[review] failed to open rate popup', e);
      try { window.open(REVIEW_URL, '_blank', 'noopener,noreferrer'); } catch {}
    }
  }, []);

  const triggerCelebrationOnce = useCallback(() => {
    try {
      if (localStorage.getItem(CELEBRATION_SHOWN_KEY)) return;
      localStorage.setItem(CELEBRATION_SHOWN_KEY, '1');
      setShowCelebration(true);
      setTimeout(() => {
        setShowCelebration(false);
        triggerReviewPopupOnce();
      }, 2000);
    } catch { /* ignore */ }
  }, [triggerReviewPopupOnce]);

  /* ─── Effects ─── */

  useEffect(() => { ensureRatePopupRegistered(); }, []);

  useEffect(() => {
    checkPremium()
      .then((r) => {
        setIsPremium(r.isPremium);
        setPlanStatus(r.planStatus);
        if (r.packageName) setCurrentPlanName(r.packageName);
        if (r.instanceId) setInstanceId(r.instanceId);
      })
      .catch(() => { setIsPremium(false); setPlanStatus('free'); })
      .finally(() => setPlanLoading(false));
  }, []);

  useEffect(() => {
    getAppPlans()
      .then((r) => {
        setPlans(r.plans);
        setCurrencySymbol(r.currencySymbol || '$');
      })
      .catch((err) => console.error('[plans]', err))
      .finally(() => setPlansLoading(false));
  }, []);

  useEffect(() => {
    items.query(COLLECTION_ID).limit(100).find()
      .then((res) => setItems(res.items || []))
      .catch((err) => console.error('[items]', err))
      .finally(() => setItemsLoading(false));
  }, []);

  /* ─── Domain handlers ─── */

  const handleSave = useCallback(async (data: any) => {
    try {
      const isFirstItem = items_.length === 0;
      const created = await items.insert(COLLECTION_ID, data);
      setItems((prev) => [...prev, created]);
      dashboard.showToast({ message: t('toast.saved'), type: 'success' });

      // Track setup completion (idempotent — only the first call wins server-side)
      try { await trackSetupCompleted(); } catch {}

      // First-action chain: celebration → review
      if (isFirstItem) triggerCelebrationOnce();
    } catch (err) {
      console.error('[save]', err);
      dashboard.showToast({ message: t('toast.saveFailed'), type: 'error' });
    }
  }, [items_.length, triggerCelebrationOnce, t]);

  /* ─── Render ─── */

  if (planLoading) {
    return (
      <Page>
        <Page.Content>
          <Box align="center" padding="60px"><Loader /></Box>
        </Page.Content>
      </Page>
    );
  }

  return (
    <WixDesignSystemProvider features={{ newColorsBranding: true }}>
      <Page>
        <Page.Header
          title={t('page.title')}
          subtitle={t('page.subtitle')}
          actionsBar={
            !isPremium && (
              <Button skin="premium" prefixIcon={<Icons.PremiumFilled />} as="a" href={upgradeUrl} target="_blank">
                {t('button.upgrade')}
              </Button>
            )
          }
        />
        <Page.Content>
          <div ref={topRef} />

          <Box marginBottom="24px">
            <Tabs
              activeId={dashboardTab}
              onClick={(tab) => setDashboardTab(tab.id as DashboardTab)}
              items={[
                { id: 'manage',       title: t('tab.manage') },
                { id: 'planSettings', title: t('tab.planSettings') },
                { id: 'howToUse',     title: t('tab.howToUse') },
              ]}
            />
          </Box>

          <Layout>
            {/* MANAGE TAB */}
            {dashboardTab === 'manage' && showOnboarding && (
              <Cell span={12}>
                {/* … 4-step onboarding slideshow lives here, gated by ONBOARDING_KEY … */}
                {/* See examples/_shared (or references/ONBOARDING.md) for the canonical slideshow */}
              </Cell>
            )}

            {dashboardTab === 'manage' && !showOnboarding && (
              <>
                {showCelebration && (
                  <Cell span={12}>
                    <div ref={celebrationRef} />
                    <Card>{/* green celebration banner */}</Card>
                  </Cell>
                )}
                <Cell span={12}>
                  {/* … main domain UI: rules table / settings form / etc … */}
                </Cell>
              </>
            )}

            {/* PLAN & SETTINGS TAB */}
            {dashboardTab === 'planSettings' && (
              <Cell span={12}>
                {/* PlansCard reading from `plans` + `currencySymbol`,
                    highlighting `currentPlanName`. See examples/_shared/plans-card.tsx */}
              </Cell>
            )}

            {/* HOW TO USE TAB */}
            {dashboardTab === 'howToUse' && (
              <Cell span={12}>
                {/* Static content: 4-step "how it works" + screenshots + support email */}
                {/* Plus the "More Apps by Us" section — see references/MORE_APPS.md */}
              </Cell>
            )}
          </Layout>
        </Page.Content>
      </Page>
    </WixDesignSystemProvider>
  );
};

export default withIntlProvider(DashboardPage);
