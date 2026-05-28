import React, { type FC, useCallback, useEffect, useMemo, useState } from 'react';
import {
  Accordion,
  Badge,
  Box,
  Button,
  Card,
  Divider,
  Dropdown,
  FormField,
  Heading,
  Input,
  Loader,
  Page,
  SectionHelper,
  SegmentedToggle,
  Tabs,
  Text,
  TextButton,
  ToggleSwitch,
  Tooltip,
  WixDesignSystemProvider,
} from '@wix/design-system';
import * as Icons from '@wix/wix-ui-icons-common';
import '@wix/design-system/styles.global.css';
import { useIntl } from 'react-intl';
import { httpClient } from '@wix/essentials';
import { withIntlProvider } from '../../../../intl/withIntlProvider';
import {
  APP_ID,
  FREE_PLAN_LIMIT,
  LS_LAST_SAVED,
  LS_ONBOARDING,
  LS_REVIEW,
  REVIEW_URL,
  SUPPORT_EMAIL,
} from '../../../_shared/app-config';
import ErrorBoundary from '../../../_shared/error-boundary';
import PricingCards from '../../../_shared/PricingCards';
import {
  createEmptyPlan,
  migrateSettings,
  normalizePlan,
  type AppSettings,
  type PricingPlan,
} from '../../../_shared/pricing-types';
import type { AppPlan } from '../../../../pages/api/app/plans';
import { StatCard } from './components/StatCard';
import { MoreAppsCard } from './components/MoreAppsCard';
import {
  ensureRatePopupRegistered,
  openRatePopup,
} from '../../_shared/rate-popup';

type PremiumInfo = {
  isPremium: boolean;
  planStatus: string;
  packageName?: string;
  instanceId?: string;
  metaSiteId?: string;
  siteUrl?: string;
};

type WixSitePlan = { id: string; name: string };

const ONBOARDING_SLIDES = 4;

function extractMonthlyPriceNumber(plan: AppPlan): number {
  const monthly = plan.prices.find((p) => p.cycleType === 'MONTHLY');
  const yearly = plan.prices.find((p) => p.cycleType === 'YEARLY');
  if (monthly) return parseFloat(monthly.price) || 0;
  if (yearly) return (parseFloat(yearly.price) || 0) * 12;
  return parseFloat(plan.prices[0]?.price ?? '0') || 0;
}

function formatMonthlyPrice(plan: AppPlan, symbol: string): string {
  const monthly = plan.prices.find((p) => p.cycleType === 'MONTHLY');
  const yearly = plan.prices.find((p) => p.cycleType === 'YEARLY');
  if (monthly) return `${symbol}${monthly.price}/mo`;
  if (yearly) return `${symbol}${(parseFloat(yearly.price) * 12).toFixed(2)}/yr`;
  return `${symbol}${plan.prices[0]?.price ?? '0'}`;
}

const DashboardPage: FC = () => {
  const intl = useIntl();
  const t = (id: string, values?: Record<string, string | number>) =>
    intl.formatMessage({ id }, values);

  const [activeTab, setActiveTab] = useState(0);
  const [onboardingSlide, setOnboardingSlide] = useState(0);
  const [onboardingDismissed, setOnboardingDismissed] = useState(
    () => typeof localStorage !== 'undefined' && !!localStorage.getItem(LS_ONBOARDING),
  );
  const [premium, setPremium] = useState<PremiumInfo>({ isPremium: false, planStatus: 'free' });
  const [premiumLoading, setPremiumLoading] = useState(true);
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [settings, setSettings] = useState<AppSettings>(migrateSettings(null));
  const [appPlans, setAppPlans] = useState<AppPlan[]>([]);
  const [currencySymbol, setCurrencySymbol] = useState('$');
  const [wixSitePlans, setWixSitePlans] = useState<WixSitePlan[]>([]);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [selectedPlanIndex, setSelectedPlanIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(() => {
    try {
      const raw = localStorage.getItem(LS_LAST_SAVED);
      const n = raw ? parseInt(raw, 10) : NaN;
      return Number.isFinite(n) && n > 0 ? n : null;
    } catch {
      return null;
    }
  });
  const [, setNowTick] = useState(0);
  const [siteId, setSiteId] = useState<string>('');
  const [siteUrl, setSiteUrl] = useState<string>('');
  const [celebration, setCelebration] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const upgradeUrl = useMemo(
    () =>
      premium.instanceId
        ? `https://www.wix.com/apps/upgrade/${APP_ID}?appInstanceId=${premium.instanceId}`
        : `https://www.wix.com/apps/upgrade/${APP_ID}`,
    [premium.instanceId],
  );

  const canAddPlan = premium.isPremium || plans.length < FREE_PLAN_LIMIT;
  const highlightedPlan = plans.find((p) => p.isHighlighted);
  const hasSaved = lastSavedAt !== null;

  useEffect(() => {
    if (lastSavedAt === null) return;
    const id = setInterval(() => setNowTick((n) => n + 1), 30_000);
    return () => clearInterval(id);
  }, [lastSavedAt]);

  const formatLastSaved = useCallback((ts: number): string => {
    const d = Math.floor((Date.now() - ts) / 1000);
    if (d < 10) return 'just now';
    if (d < 60) return `${d}s ago`;
    const m = Math.floor(d / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  }, []);

  useEffect(() => {
    ensureRatePopupRegistered();
  }, []);

  const triggerReviewOnce = useCallback(() => {
    try {
      if (localStorage.getItem(LS_REVIEW)) return;
      localStorage.setItem(LS_REVIEW, '1');
      setTimeout(() => openRatePopup(REVIEW_URL), 2000);
    } catch {
      /* ignore */
    }
  }, []);

  const loadAll = useCallback(async () => {
    setLoadError(null);
    try {
      const [premRes, plansRes, settingsRes, marketPlansRes, wixPlansRes] =
        await Promise.all([
          httpClient.fetchWithAuth('/api/app/check-premium'),
          httpClient.fetchWithAuth('/api/pricing-plans'),
          httpClient.fetchWithAuth('/api/app-settings'),
          httpClient.fetchWithAuth('/api/app/plans'),
          httpClient.fetchWithAuth('/api/wix-pricing-plans/list'),
        ]);
      const prem = (await premRes.json()) as PremiumInfo;
      const plansData = (await plansRes.json()) as { plans: PricingPlan[] };
      const settingsData = (await settingsRes.json()) as { settings: AppSettings };
      const market = (await marketPlansRes.json()) as {
        plans: AppPlan[];
        currencySymbol: string;
      };
      const wixList = (await wixPlansRes.json()) as { plans: WixSitePlan[] };
      setPremium(prem);
      if (prem.metaSiteId) setSiteId(prem.metaSiteId);
      if (prem.siteUrl) setSiteUrl(prem.siteUrl);
      setPlans((plansData.plans ?? []).map(normalizePlan));
      setSettings(migrateSettings(settingsData.settings));
      setAppPlans(market.plans ?? []);
      setCurrencySymbol(market.currencySymbol ?? '$');
      setWixSitePlans(wixList.plans ?? []);
    } catch (e) {
      console.error(e);
      setLoadError(t('manage.saveFailed'));
    } finally {
      setPremiumLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleSave = async () => {
    setSaving(true);
    setLoadError(null);
    try {
      const [plansRes, settingsRes] = await Promise.all([
        httpClient.fetchWithAuth('/api/pricing-plans', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ plans }),
        }),
        httpClient.fetchWithAuth('/api/app-settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ settings }),
        }),
      ]);
      const plansBody = await plansRes.json();
      const settingsBody = await settingsRes.json();
      if (!plansBody.ok || !settingsBody.ok) {
        throw new Error(plansBody.error || settingsBody.error || 'save_failed');
      }
      setPlans((plansBody.plans ?? plans).map(normalizePlan));
      setSettings(migrateSettings(settingsBody.settings ?? settings));
      const now = Date.now();
      setLastSavedAt(now);
      try {
        localStorage.setItem(LS_LAST_SAVED, String(now));
      } catch {
        /* ignore */
      }
      setCelebration(true);
      httpClient.fetchWithAuth('/api/app/track-setup-completed', { method: 'POST' }).catch(() => {});
      triggerReviewOnce();
    } catch (e) {
      console.error(e);
      setLoadError(t('manage.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const dismissOnboarding = () => {
    try {
      localStorage.setItem(LS_ONBOARDING, '1');
    } catch {
      /* ignore */
    }
    setOnboardingDismissed(true);
  };

  const updatePlan = (index: number, patch: Partial<PricingPlan>) => {
    setPlans((prev) =>
      prev.map((p, i) => (i === index ? normalizePlan({ ...p, ...patch }) : p)),
    );
  };

  const addPlan = () => {
    if (!canAddPlan) return;
    setPlans((prev) => [...prev, createEmptyPlan(prev.length)]);
    setSelectedPlanIndex(plans.length);
  };

  const removePlan = (index: number) => {
    setPlans((prev) => prev.filter((_, i) => i !== index));
    setSelectedPlanIndex(0);
  };

  const movePlan = (index: number, direction: -1 | 1) => {
    const next = index + direction;
    if (next < 0 || next >= plans.length) return;
    setPlans((prev) => {
      const copy = [...prev];
      const [item] = copy.splice(index, 1);
      copy.splice(next, 0, item);
      return copy.map((p, i) => ({ ...p, sortOrder: i }));
    });
    setSelectedPlanIndex(next);
  };

  const selectedPlan = plans[selectedPlanIndex] ?? plans[0];

  const setHighlighted = (index: number, value: boolean) => {
    setPlans((prev) =>
      prev.map((p, i) => ({
        ...p,
        isHighlighted: i === index ? value : value ? false : p.isHighlighted,
      })),
    );
  };

  if (!onboardingDismissed && !premiumLoading) {
    return (
      <WixDesignSystemProvider features={{ newColorsBranding: true }}>
        <Page>
          <Page.Content>
            <Box direction="vertical" gap="SP4" align="center" padding="SP6">
              <Heading size="large">
                {onboardingSlide === 0 && t('onboarding.welcome')}
                {onboardingSlide === 1 && t('onboarding.howItWorks')}
                {onboardingSlide === 2 && t('onboarding.whatYouGet')}
                {onboardingSlide === 3 && t('onboarding.allSet')}
              </Heading>
              <Text>{t('onboarding.welcomeDesc')}</Text>
              <Box direction="horizontal" gap="SP2">
                {Array.from({ length: ONBOARDING_SLIDES }).map((_, i) => (
                  <div
                    key={i}
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: i === onboardingSlide ? '#6B21A8' : '#D1D5DB',
                    }}
                  />
                ))}
              </Box>
              <Box direction="horizontal" gap="SP3">
                {onboardingSlide > 0 ? (
                  <Button
                    priority="secondary"
                    onClick={() => setOnboardingSlide((s) => s - 1)}
                  >
                    {t('button.back')}
                  </Button>
                ) : null}
                {onboardingSlide < ONBOARDING_SLIDES - 1 ? (
                  <Button onClick={() => setOnboardingSlide((s) => s + 1)}>
                    {t('button.next')}
                  </Button>
                ) : (
                  <Button onClick={dismissOnboarding}>{t('button.getStarted')}</Button>
                )}
                <TextButton onClick={dismissOnboarding}>
                  {t('button.skipToDashboard')}
                </TextButton>
              </Box>
            </Box>
          </Page.Content>
        </Page>
      </WixDesignSystemProvider>
    );
  }

  const renderPricingTiers = () => {
    const activePrice = (() => {
      const current = appPlans.find(
        (p) => p.name.toLowerCase() === (premium.packageName ?? '').toLowerCase(),
      );
      return current ? extractMonthlyPriceNumber(current) : 0;
    })();

    return (
      <Card>
        <Card.Header title={t('plan.yourPlan')} subtitle={t('plan.manageSubscription')} />
        <Card.Divider />
        <Card.Content>
          <Box direction="vertical" gap="SP4">
            {appPlans.map((plan, idx) => {
              const priceNum = extractMonthlyPriceNumber(plan);
              const isCurrent =
                plan.name.toLowerCase() === (premium.packageName ?? '').toLowerCase();
              const isDowngrade = !isCurrent && activePrice > 0 && priceNum < activePrice;
              const isMostPopular = idx === 1;
              return (
                <div
                  key={plan.vendorId || plan.name}
                  style={{
                    opacity: isDowngrade ? 0.55 : 1,
                    background: isDowngrade ? '#F7F8FA' : undefined,
                    borderRadius: 8,
                    padding: isDowngrade ? 12 : 0,
                  }}
                >
                  <Box direction="horizontal" verticalAlign="middle" gap="SP3">
                    <Box direction="vertical" gap="SP1" flex="1">
                      <Box direction="horizontal" gap="SP2" verticalAlign="middle">
                        <Text weight="bold">{plan.name}</Text>
                        {isMostPopular ? (
                          <Badge size="tiny" skin="premium">
                            {t('badge.mostPopular')}
                          </Badge>
                        ) : null}
                        {isCurrent ? (
                          <Badge size="tiny" skin="success">
                            {t('badge.currentPlan')}
                          </Badge>
                        ) : null}
                      </Box>
                      <Text size="small" secondary>
                        {formatMonthlyPrice(plan, currencySymbol)}
                      </Text>
                      {plan.benefits.slice(0, 3).map((b) => (
                        <Text key={b} size="tiny" secondary>
                          • {b}
                        </Text>
                      ))}
                    </Box>
                    {isCurrent ? (
                      <Button disabled>{t('button.currentPlan')}</Button>
                    ) : isDowngrade ? (
                      <Tooltip content={t('plan.includedTooltip')}>
                        <Button disabled>{t('button.includedInPlan')}</Button>
                      </Tooltip>
                    ) : (
                      <Button as="a" href={upgradeUrl} target="_blank">
                        {t('button.upgrade')} {plan.name}
                      </Button>
                    )}
                  </Box>
                  {idx < appPlans.length - 1 ? <Divider /> : null}
                </div>
              );
            })}
          </Box>
        </Card.Content>
      </Card>
    );
  };

  const renderManage = () => (
    <Box direction="vertical" gap="SP4">
      {celebration ? (
        <SectionHelper appearance="success" onClose={() => setCelebration(false)}>
          {t('celebration.message')}
        </SectionHelper>
      ) : null}
      {loadError ? (
        <SectionHelper appearance="danger">{loadError}</SectionHelper>
      ) : null}
      {!premium.isPremium ? (
        <SectionHelper
          title={t('manage.plans.upgradeHint')}
          actionText={t('button.upgrade')}
          onAction={() => window.open(upgradeUrl, '_blank')}
        >
          {t('manage.plans.limit', { count: FREE_PLAN_LIMIT })}
        </SectionHelper>
      ) : null}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <Box direction="vertical" gap="SP4">
          <Box direction="horizontal" verticalAlign="middle" gap="SP3">
            <Heading size="small">{t('manage.plans.title')}</Heading>
            <Button size="small" onClick={addPlan} disabled={!canAddPlan}>
              {t('button.addPlan')}
            </Button>
          </Box>
          <Box direction="vertical" gap="SP2">
            {plans.map((plan, index) => (
              <Card key={plan._id ?? index}>
                <Card.Content>
                  <Box direction="horizontal" verticalAlign="middle" gap="SP2">
                    <Box direction="vertical" gap="SP1" flex="1">
                      <Text weight="bold">{plan.name || t('manage.plan.name')}</Text>
                      <Text size="tiny" secondary>
                        {plan.price} {plan.currency} · {plan.period}
                      </Text>
                    </Box>
                    <Button
                      size="tiny"
                      priority="secondary"
                      onClick={() => movePlan(index, -1)}
                    >
                      ↑
                    </Button>
                    <Button
                      size="tiny"
                      priority="secondary"
                      onClick={() => movePlan(index, 1)}
                    >
                      ↓
                    </Button>
                    <Button
                      size="tiny"
                      priority={selectedPlanIndex === index ? 'primary' : 'secondary'}
                      onClick={() => setSelectedPlanIndex(index)}
                    >
                      Edit
                    </Button>
                  </Box>
                </Card.Content>
              </Card>
            ))}
          </Box>

          {selectedPlan ? (
            <Card>
              <Card.Header title={selectedPlan.name || t('manage.plan.name')} />
              <Card.Divider />
              <Card.Content>
                <Box direction="vertical" gap="SP3">
                  <FormField label={t('manage.plan.name')}>
                    <Input
                      value={selectedPlan.name}
                      onChange={(e) =>
                        updatePlan(selectedPlanIndex, { name: e.target.value })
                      }
                    />
                  </FormField>
                  <Box direction="horizontal" gap="SP3">
                    <FormField label={t('manage.plan.price')}>
                      <Input
                        value={String(selectedPlan.price)}
                        onChange={(e) =>
                          updatePlan(selectedPlanIndex, {
                            price: parseFloat(e.target.value) || 0,
                          })
                        }
                      />
                    </FormField>
                    <FormField label={t('manage.plan.currency')}>
                      <Input
                        value={selectedPlan.currency}
                        onChange={(e) =>
                          updatePlan(selectedPlanIndex, { currency: e.target.value })
                        }
                      />
                    </FormField>
                  </Box>
                  <FormField label={t('manage.plan.period')}>
                    <Dropdown
                      options={[
                        { id: 'monthly', value: t('manage.plan.period.monthly') },
                        { id: 'annual', value: t('manage.plan.period.annual') },
                        { id: 'one-time', value: t('manage.plan.period.oneTime') },
                      ]}
                      selectedId={selectedPlan.period}
                      onSelect={(opt) =>
                        updatePlan(selectedPlanIndex, {
                          period: String(opt.id) as PricingPlan['period'],
                        })
                      }
                    />
                  </FormField>
                  <FormField label={t('manage.plan.tagline')}>
                    <Input
                      value={selectedPlan.tagline}
                      onChange={(e) =>
                        updatePlan(selectedPlanIndex, { tagline: e.target.value })
                      }
                    />
                  </FormField>
                  <FormField label={t('manage.plan.features')}>
                    <Box direction="vertical" gap="SP2">
                      {selectedPlan.featuresJson.map((feature, fIdx) => (
                        <Box key={fIdx} direction="horizontal" gap="SP2" verticalAlign="middle">
                          <Input
                            value={feature.label}
                            onChange={(e) => {
                              const next = [...selectedPlan.featuresJson];
                              next[fIdx] = { ...next[fIdx], label: e.target.value };
                              updatePlan(selectedPlanIndex, { featuresJson: next });
                            }}
                          />
                          <ToggleSwitch
                            checked={feature.included}
                            onChange={() => {
                              const next = [...selectedPlan.featuresJson];
                              next[fIdx] = {
                                ...next[fIdx],
                                included: !next[fIdx].included,
                              };
                              updatePlan(selectedPlanIndex, { featuresJson: next });
                            }}
                          />
                        </Box>
                      ))}
                      <Button
                        size="tiny"
                        priority="secondary"
                        onClick={() =>
                          updatePlan(selectedPlanIndex, {
                            featuresJson: [
                              ...selectedPlan.featuresJson,
                              { label: '', included: true },
                            ],
                          })
                        }
                      >
                        {t('manage.plan.addFeature')}
                      </Button>
                    </Box>
                  </FormField>
                  <FormField label={t('manage.plan.badge')}>
                    <Dropdown
                      disabled={!premium.isPremium}
                      options={[
                        { id: '', value: t('manage.plan.badge.none') },
                        {
                          id: 'most-popular',
                          value: t('manage.plan.badge.mostPopular'),
                          disabled: !premium.isPremium,
                        },
                        {
                          id: 'new',
                          value: t('manage.plan.badge.new'),
                          disabled: !premium.isPremium,
                        },
                        {
                          id: 'crown',
                          value: t('manage.plan.badge.crown'),
                          disabled: !premium.isPremium,
                        },
                      ]}
                      selectedId={selectedPlan.badge}
                      onSelect={(opt) =>
                        updatePlan(selectedPlanIndex, {
                          badge: String(opt.id) as PricingPlan['badge'],
                        })
                      }
                    />
                    {!premium.isPremium ? (
                      <Text size="tiny" secondary>
                        {t('manage.plan.badge.premiumHint')}{' '}
                        <TextButton as="a" href={upgradeUrl} target="_blank" size="tiny">
                          {t('button.upgrade')}
                        </TextButton>
                      </Text>
                    ) : null}
                  </FormField>
                  <ToggleSwitch
                    checked={selectedPlan.isHighlighted}
                    onChange={(e) =>
                      setHighlighted(selectedPlanIndex, e.target.checked)
                    }
                    label={t('manage.plan.highlighted')}
                  />
                  <FormField label={t('manage.plan.ctaMode')}>
                    <Dropdown
                      options={[
                        { id: 'wix_plan', value: t('manage.plan.ctaMode.wixPlan') },
                        { id: 'custom_url', value: t('manage.plan.ctaMode.customUrl') },
                        { id: 'contact', value: t('manage.plan.ctaMode.contact') },
                      ]}
                      selectedId={selectedPlan.ctaMode}
                      onSelect={(opt) =>
                        updatePlan(selectedPlanIndex, {
                          ctaMode: String(opt.id) as PricingPlan['ctaMode'],
                        })
                      }
                    />
                  </FormField>
                  {selectedPlan.ctaMode === 'wix_plan' ? (
                    <FormField label={t('manage.plan.wixPlanSelect')}>
                      <Dropdown
                        options={wixSitePlans.map((p) => ({
                          id: p.id,
                          value: p.name,
                        }))}
                        selectedId={selectedPlan.ctaTarget || undefined}
                        onSelect={(opt) =>
                          updatePlan(selectedPlanIndex, { ctaTarget: String(opt.id) })
                        }
                        placeholder="Select a Wix Pricing Plan"
                      />
                    </FormField>
                  ) : (
                    <FormField label={t('manage.plan.ctaTarget')}>
                      <Input
                        value={selectedPlan.ctaTarget}
                        onChange={(e) =>
                          updatePlan(selectedPlanIndex, { ctaTarget: e.target.value })
                        }
                      />
                    </FormField>
                  )}
                  <FormField label={t('manage.plan.ctaLabel')}>
                    <Input
                      value={selectedPlan.ctaLabel}
                      onChange={(e) =>
                        updatePlan(selectedPlanIndex, { ctaLabel: e.target.value })
                      }
                    />
                  </FormField>
                  <Button
                    priority="secondary"
                    skin="destructive"
                    onClick={() => removePlan(selectedPlanIndex)}
                  >
                    {t('manage.plan.remove')}
                  </Button>
                </Box>
              </Card.Content>
            </Card>
          ) : null}
        </Box>

        <Box direction="vertical" gap="SP3" style={{ position: 'sticky', top: 16 }}>
          <Box direction="horizontal" verticalAlign="middle" gap="SP3">
            <Heading size="small">{t('manage.preview.title')}</Heading>
            <SegmentedToggle
              selected={previewMode}
              onClick={(_, value) => setPreviewMode(value as 'desktop' | 'mobile')}
            >
              <SegmentedToggle.Button value="desktop">
                {t('manage.preview.desktop')}
              </SegmentedToggle.Button>
              <SegmentedToggle.Button value="mobile">
                {t('manage.preview.mobile')}
              </SegmentedToggle.Button>
            </SegmentedToggle>
          </Box>
          <div
            style={{
              border: '1px solid #E4E6EB',
              borderRadius: 12,
              overflow: 'hidden',
              maxWidth: previewMode === 'mobile' ? 390 : '100%',
            }}
          >
            <PricingCards
              plans={plans}
              settings={settings}
              isPremium={premium.isPremium}
              isMobile={previewMode === 'mobile'}
              emptyLabel={t('widget.empty')}
              showWatermark={!premium.isPremium}
              watermarkLabel={t('widget.watermark')}
            />
          </div>
        </Box>
      </div>

      <Box direction="horizontal" align="right" gap="0px" verticalAlign="middle" marginTop="12px">
        <Box direction="horizontal" marginRight="12px" verticalAlign="middle" gap="6px">
          {saving ? (
            <>
              <Loader size="tiny" />
              <Text size="tiny" secondary>{'Saving\u2026'}</Text>
            </>
          ) : lastSavedAt ? (
            <>
              <Icons.StatusComplete style={{ width: 14, height: 14, color: '#27AE60' }} />
              <Text size="tiny" secondary>
                Last saved {formatLastSaved(lastSavedAt)}
              </Text>
            </>
          ) : null}
        </Box>
        <Button
          onClick={handleSave}
          disabled={saving}
          prefixIcon={<Icons.Confirm />}
          style={{ borderTopRightRadius: 0, borderBottomRightRadius: 0 }}
        >
          {saving ? 'Saving…' : hasSaved ? 'Update' : 'Save'}
        </Button>
        <Button
          priority="secondary"
          prefixIcon={<Icons.ExternalLinkSmall />}
          as="a"
          href={siteId ? `https://manage.wix.com/editor/${siteId}` : undefined}
          target="_blank"
          disabled={!siteId}
          style={{ borderRadius: 0, borderRight: '1px solid #dfe1e5' }}
        >
          View Editor
        </Button>
        <Tooltip
          content={
            <span>
              {siteUrl
                ? 'Open your published site in a new tab.'
                : 'Publish your site to see the widget live.'}
            </span>
          }
        >
          <div>
            <Button
              priority="secondary"
              prefixIcon={<Icons.Globe />}
              as="a"
              href={siteUrl || undefined}
              target="_blank"
              disabled={!siteUrl}
              style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
            >
              View Live Site
            </Button>
          </div>
        </Tooltip>
      </Box>
    </Box>
  );

  const renderPlanSettings = () => (
    <Box direction="vertical" gap="SP4">
      <Card>
        <Card.Header title={t('settings.design.title')} />
        <Card.Divider />
        <Card.Content>
          <Box direction="vertical" gap="SP4">
            <FormField label={t('settings.theme')}>
              <Dropdown
                options={[
                  { id: 'light', value: t('settings.theme.light') },
                  { id: 'dark', value: t('settings.theme.dark') },
                  { id: 'minimal', value: t('settings.theme.minimal') },
                  { id: 'brand', value: t('settings.theme.brand') },
                ]}
                selectedId={settings.theme}
                onSelect={(opt) =>
                  setSettings((s) => ({
                    ...s,
                    theme: String(opt.id) as AppSettings['theme'],
                  }))
                }
              />
            </FormField>
            <FormField label={t('settings.font')}>
              <Dropdown
                options={[
                  { id: 'system', value: t('settings.font.system') },
                  { id: 'inter', value: t('settings.font.inter') },
                  { id: 'georgia', value: t('settings.font.georgia') },
                  { id: 'mono', value: t('settings.font.mono') },
                ]}
                selectedId={settings.fontFamily}
                onSelect={(opt) =>
                  setSettings((s) => ({
                    ...s,
                    fontFamily: String(opt.id) as AppSettings['fontFamily'],
                  }))
                }
              />
            </FormField>
            <FormField label={t('settings.highlightColor')}>
              <Input
                value={settings.highlightColor}
                onChange={(e) =>
                  setSettings((s) => ({ ...s, highlightColor: e.target.value }))
                }
              />
            </FormField>
            <FormField label={t('settings.cardStyle')}>
              <Dropdown
                options={[
                  { id: 'modern', value: t('settings.cardStyle.modern') },
                  { id: 'classic', value: t('settings.cardStyle.classic') },
                  { id: 'compact', value: t('settings.cardStyle.compact') },
                ]}
                selectedId={settings.cardStyle}
                onSelect={(opt) =>
                  setSettings((s) => ({
                    ...s,
                    cardStyle: String(opt.id) as AppSettings['cardStyle'],
                  }))
                }
              />
            </FormField>
            <ToggleSwitch
              checked={settings.showBilledAs}
              onChange={(e) =>
                setSettings((s) => ({ ...s, showBilledAs: e.target.checked }))
              }
              label={t('settings.showBilledAs')}
            />
            <Divider />
            <Heading size="tiny">{t('settings.advanced.title')}</Heading>
            {!premium.isPremium ? (
              <SectionHelper
                appearance="premium"
                actionText={t('button.upgrade')}
                onAction={() => window.open(upgradeUrl, '_blank')}
              >
                {t('settings.advanced.premiumHint')}
              </SectionHelper>
            ) : (
              <Box direction="vertical" gap="SP3">
                <FormField label={t('settings.advanced.borderRadius')}>
                  <Input
                    value={String(settings.advancedDesign.borderRadius)}
                    onChange={(e) =>
                      setSettings((s) => ({
                        ...s,
                        advancedDesign: {
                          ...s.advancedDesign,
                          borderRadius: parseInt(e.target.value, 10) || 12,
                        },
                      }))
                    }
                  />
                </FormField>
                <ToggleSwitch
                  checked={settings.advancedDesign.shadowEnabled}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      advancedDesign: {
                        ...s.advancedDesign,
                        shadowEnabled: e.target.checked,
                      },
                    }))
                  }
                  label={t('settings.advanced.shadows')}
                />
                <FormField label={t('settings.advanced.buttonShape')}>
                  <Dropdown
                    options={[
                      {
                        id: 'rounded',
                        value: t('settings.advanced.buttonShape.rounded'),
                      },
                      { id: 'pill', value: t('settings.advanced.buttonShape.pill') },
                      {
                        id: 'square',
                        value: t('settings.advanced.buttonShape.square'),
                      },
                    ]}
                    selectedId={settings.advancedDesign.buttonShape}
                    onSelect={(opt) =>
                      setSettings((s) => ({
                        ...s,
                        advancedDesign: {
                          ...s.advancedDesign,
                          buttonShape: String(opt.id) as
                            | 'rounded'
                            | 'pill'
                            | 'square',
                        },
                      }))
                    }
                  />
                </FormField>
              </Box>
            )}
          </Box>
        </Card.Content>
      </Card>
      {renderPricingTiers()}
    </Box>
  );

  const renderHowToUse = () => (
    <Box direction="vertical" gap="SP4">
      <Card>
        <Card.Content>
          <Box direction="vertical" gap="SP3">
            {[1, 2, 3, 4].map((step) => (
              <Box key={step} direction="horizontal" gap="SP3">
                <Badge skin="general">{step}</Badge>
                <Box direction="vertical" gap="SP1">
                  <Text weight="bold">{t(`howTo.step${step}.title`)}</Text>
                  <Text size="small" secondary>
                    {t(`howTo.step${step}.desc`)}
                  </Text>
                </Box>
              </Box>
            ))}
          </Box>
        </Card.Content>
      </Card>
      <Card>
        <Card.Header title={t('faq.title')} />
        <Card.Divider />
        <Card.Content>
          <Accordion
            items={[1, 2, 3, 4].map((n) => ({
              title: t(`faq.q${n}`),
              children: <Text size="small">{t(`faq.a${n}`)}</Text>,
            }))}
          />
        </Card.Content>
      </Card>
      <Card>
        <Card.Content>
          <Box direction="vertical" gap="SP1" flex="1">
            <Text weight="bold">{t('help.title')}</Text>
            <Text size="small" secondary>
              {t('help.subtitle')}
            </Text>
            <TextButton as="a" href={`mailto:${SUPPORT_EMAIL}`}>
              {SUPPORT_EMAIL}
            </TextButton>
          </Box>
        </Card.Content>
      </Card>
      <MoreAppsCard />
    </Box>
  );

  return (
    <WixDesignSystemProvider features={{ newColorsBranding: true }}>
      <ErrorBoundary surface="dashboard">
        <Page height="100vh">
          <Page.Header
            subtitle={t('page.subtitle')}
            actionsBar={
              <Box direction="horizontal" gap="SP2" verticalAlign="middle">
                {premiumLoading ? (
                  <Loader size="tiny" />
                ) : premium.isPremium ? (
                  <Badge skin="premium" prefixIcon={<Icons.PremiumFilled />}>
                    {premium.packageName ?? t('badge.premium')}
                  </Badge>
                ) : (
                  <Badge skin="neutral">{t('badge.free')}</Badge>
                )}
                {!premium.isPremium ? (
                  <Button as="a" href={upgradeUrl} target="_blank" prefixIcon={<Icons.Premium />}>
                    {t('button.upgrade')}
                  </Button>
                ) : null}
              </Box>
            }
          />
          <Page.Content>
            <Tabs
              activeId={activeTab}
              onClick={(item) => setActiveTab(Number(item.id))}
              items={[
                { id: 0, title: t('tab.manage') },
                { id: 1, title: t('tab.planSettings') },
                { id: 2, title: t('tab.howToUse') },
              ]}
            />
            <Box padding="SP4 0">
              {activeTab === 0 ? (
                <>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(4, 1fr)',
                      gap: 16,
                      marginBottom: 24,
                    }}
                  >
                    <StatCard
                      icon={<Icons.List />}
                      iconBg="#EDF3FF"
                      iconColor="#3B6AEA"
                      label={t('stats.plans.label')}
                      value={t('stats.plans.value', { count: plans.length })}
                      loading={premiumLoading}
                    />
                    <StatCard
                      icon={<Icons.CreditCard />}
                      iconBg="#ECFDF5"
                      iconColor="#059669"
                      label={t('stats.plan.label')}
                      value={
                        premium.isPremium
                          ? premium.packageName ?? t('badge.premium')
                          : t('badge.free')
                      }
                      loading={premiumLoading}
                      highlight={premium.isPremium}
                    />
                    <StatCard
                      icon={<Icons.StarFilled />}
                      iconBg="#FEF3C7"
                      iconColor="#D97706"
                      label={t('stats.highlight.label')}
                      value={
                        highlightedPlan?.name
                          ? t('stats.highlight.value', { name: highlightedPlan.name })
                          : t('stats.highlight.none')
                      }
                      loading={premiumLoading}
                    />
                    {!premium.isPremium ? (
                      <StatCard
                        icon={<Icons.PremiumFilled />}
                        iconBg="#F3E8FF"
                        iconColor="#6B21A8"
                        label={t('stats.premium.label')}
                        value={t('stats.premium.locked')}
                        badge={{ text: t('button.upgrade'), skin: 'premium' }}
                        loading={premiumLoading}
                      />
                    ) : null}
                  </div>
                  {renderManage()}
                </>
              ) : null}
              {activeTab === 1 ? renderPlanSettings() : null}
              {activeTab === 2 ? renderHowToUse() : null}
            </Box>
          </Page.Content>
        </Page>
      </ErrorBoundary>
    </WixDesignSystemProvider>
  );
};

export default withIntlProvider(DashboardPage);
