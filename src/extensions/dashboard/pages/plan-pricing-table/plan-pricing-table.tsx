import React, { type FC, useCallback, useEffect, useMemo, useState } from 'react';
import {
  Accordion,
  Badge,
  Box,
  Button,
  Card,
  Cell,
  Checkbox,
  Dropdown,
  FormField,
  Heading,
  Input,
  Layout,
  Loader,
  NumberInput,
  Page,
  SegmentedToggle,
  Tabs,
  Text,
  TextButton,
  ToggleSwitch,
  Tooltip,
  WixDesignSystemProvider,
} from '@wix/design-system';
import * as Icons from '@wix/wix-ui-icons-common';
import { httpClient } from '@wix/essentials';
import { useIntl } from 'react-intl';
import {
  APP_ID,
  APP_NAME,
  DASHBOARD_PAGE_ID,
  FREE_PLAN_LIMIT,
  LS_ONBOARDING,
  LS_REVIEW,
  REVIEW_URL,
  SUPPORT_EMAIL,
} from '../../../_shared/app-config';
import { ErrorBoundary } from '../../../_shared/error-boundary';
import {
  applyPremiumGating,
  DEFAULT_SETTINGS,
  migrateSettings,
  type AppSettingsRecord,
  type StoredAppSettings,
} from '../../../_shared/app-settings-types';
import {
  createEmptyPlan,
  parseFeatures,
  PREMIUM_BADGES,
  serializeFeatures,
  type PlanBadge,
  type PricingPlanRecord,
  type WixPricingPlanOption,
} from '../../../_shared/pricing-plan-types';
import type { AppPlan } from '../../../../pages/api/app/plans';
import type { PremiumInfo } from '../../../../pages/api/app/check-premium';
import { WithIntlProvider } from '../../../../intl/withIntlProvider';
import { ensureRatePopupRegistered, openRatePopup } from '../../_shared/rate-popup';
import { LivePreview } from './components/LivePreview';
import { MoreAppsCard } from './components/MoreAppsCard';
import { Skeleton, SkeletonStyleTag } from './components/Skeleton';
import { StatCard } from './components/StatCard';

type DashboardTab = 'manage' | 'planSettings' | 'howToUse';

const TABS = [
  { id: 'manage', title: 'Manage' },
  { id: 'planSettings', title: 'Plan & Settings' },
  { id: 'howToUse', title: 'How to Use' },
];

function extractMonthlyPriceNumber(plan: AppPlan): number {
  const monthly = plan.prices.find((p) => p.cycleType === 'MONTHLY');
  const yearly = plan.prices.find((p) => p.cycleType === 'YEARLY');
  if (monthly) return parseFloat(monthly.price) || 0;
  if (yearly) return (parseFloat(yearly.price) || 0) * 12;
  return parseFloat(plan.prices[0]?.price ?? '0') || 0;
}

function formatMonthlyPrice(plan: AppPlan, currencySymbol: string): string {
  const monthly = plan.prices.find((p) => p.cycleType === 'MONTHLY');
  const yearly = plan.prices.find((p) => p.cycleType === 'YEARLY');
  if (monthly) return `${currencySymbol}${monthly.price}/mo`;
  if (yearly) return `${currencySymbol}${(parseFloat(yearly.price) * 12).toFixed(2)}/yr`;
  const p = plan.prices[0];
  return p ? `${currencySymbol}${p.price}` : `${currencySymbol}0`;
}

const DashboardInner: FC = () => {
  const intl = useIntl();
  const t = (id: string, values?: Record<string, string | number>) =>
    intl.formatMessage({ id }, values);

  const [activeTab, setActiveTab] = useState<DashboardTab>('manage');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [premium, setPremium] = useState<PremiumInfo>({ isPremium: false, planStatus: 'free' });
  const [marketPlans, setMarketPlans] = useState<AppPlan[]>([]);
  const [currencySymbol, setCurrencySymbol] = useState('$');
  const [plans, setPlans] = useState<PricingPlanRecord[]>([]);
  const [settings, setSettings] = useState<StoredAppSettings>(migrateSettings({}));
  const [selectedPlanIndex, setSelectedPlanIndex] = useState(0);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [wixPlans, setWixPlans] = useState<WixPricingPlanOption[]>([]);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [onboardingSlide, setOnboardingSlide] = useState(0);
  const [onboardingDismissed, setOnboardingDismissed] = useState(
    () => typeof localStorage !== 'undefined' && !!localStorage.getItem(LS_ONBOARDING),
  );

  const isPremium = premium.isPremium;
  const instanceId = premium.instanceId;
  const upgradeUrl = useMemo(
    () =>
      instanceId
        ? `https://www.wix.com/apps/upgrade/${APP_ID}?appInstanceId=${instanceId}`
        : `https://www.wix.com/apps/upgrade/${APP_ID}`,
    [instanceId],
  );

  const selectedPlan = plans[selectedPlanIndex] ?? createEmptyPlan(0);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [premiumRes, plansRes, settingsRes, marketRes, wixRes] = await Promise.all([
        httpClient.fetchWithAuth('/api/app/check-premium'),
        httpClient.fetchWithAuth('/api/pricing-plans'),
        httpClient.fetchWithAuth('/api/settings'),
        httpClient.fetchWithAuth('/api/app/plans'),
        httpClient.fetchWithAuth('/api/wix-pricing-plans'),
      ]);
      const premiumData: PremiumInfo = await premiumRes.json();
      const plansData = await plansRes.json();
      const settingsData = await settingsRes.json();
      const marketData = await marketRes.json();
      const wixData = await wixRes.json();

      setPremium(premiumData);
      setPlans(plansData.plans?.length ? plansData.plans : [createEmptyPlan(0)]);
      setSettings(migrateSettings(settingsData.settings ?? DEFAULT_SETTINGS));
      setMarketPlans(marketData.plans ?? []);
      setCurrencySymbol(marketData.currencySymbol ?? '$');
      setWixPlans(wixData.plans ?? []);
    } catch (err) {
      console.error('[dashboard] load failed', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    ensureRatePopupRegistered();
    loadAll();
  }, [loadAll]);

  const triggerReviewOnce = useCallback(() => {
    try {
      if (localStorage.getItem(LS_REVIEW)) return;
      localStorage.setItem(LS_REVIEW, '1');
      setTimeout(() => openRatePopup(REVIEW_URL), 2000);
    } catch {
      /* ignore */
    }
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const [plansRes, settingsRes] = await Promise.all([
        httpClient.fetchWithAuth('/api/pricing-plans', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ plans }),
        }),
        httpClient.fetchWithAuth('/api/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ settings }),
        }),
      ]);
      const plansData = await plansRes.json();
      const settingsData = await settingsRes.json();
      if (!plansData.ok || !settingsData.ok) throw new Error('save failed');
      setPlans(plansData.plans ?? plans);
      setSettings(migrateSettings(settingsData.settings ?? settings));
      setLastSavedAt(new Date().toLocaleTimeString());
      await httpClient.fetchWithAuth('/api/app/track-setup-completed', { method: 'POST' });
      triggerReviewOnce();
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 8000);
    } catch (err) {
      console.error('[dashboard] save failed', err);
    } finally {
      setSaving(false);
    }
  };

  const updatePlan = (index: number, patch: Partial<PricingPlanRecord>) => {
    setPlans((prev) => prev.map((p, i) => (i === index ? { ...p, ...patch } : p)));
  };

  const addPlan = () => {
    if (!isPremium && plans.length >= FREE_PLAN_LIMIT) return;
    setPlans((prev) => [...prev, createEmptyPlan(prev.length)]);
    setSelectedPlanIndex(plans.length);
  };

  const removePlan = (index: number) => {
    setPlans((prev) => prev.filter((_, i) => i !== index).map((p, i) => ({ ...p, sortOrder: i })));
    setSelectedPlanIndex(0);
  };

  const movePlan = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= plans.length) return;
    setPlans((prev) => {
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next.map((p, i) => ({ ...p, sortOrder: i }));
    });
    setSelectedPlanIndex(target);
  };

  const updateFeature = (
    planIndex: number,
    featureIndex: number,
    field: 'text' | 'description',
    value: string,
  ) => {
    const plan = plans[planIndex];
    const features = parseFeatures(plan.featuresJson);
    features[featureIndex] = { ...features[featureIndex], [field]: value };
    updatePlan(planIndex, { featuresJson: serializeFeatures(features) });
  };

  const addFeature = (planIndex: number) => {
    const plan = plans[planIndex];
    const features = parseFeatures(plan.featuresJson);
    features.push({ text: '', description: '' });
    updatePlan(planIndex, { featuresJson: serializeFeatures(features) });
  };

  const highlightedPlanName =
    plans.find((p) => p.isHighlighted)?.name || t('stats.notSet');

  const activePrice = (() => {
    const current = marketPlans.find(
      (p) => p.name.toLowerCase() === (premium.packageName ?? '').toLowerCase(),
    );
    return current ? extractMonthlyPriceNumber(current) : 0;
  })();

  const onboardingSlides = [
    { title: t('onboarding.slide1.title'), body: t('onboarding.slide1.body') },
    { title: t('onboarding.slide2.title'), body: t('onboarding.slide2.body') },
    { title: t('onboarding.slide3.title'), body: t('onboarding.slide3.body') },
    { title: t('onboarding.slide4.title'), body: t('onboarding.slide4.body') },
  ];

  if (!onboardingDismissed && !loading) {
    const slide = onboardingSlides[onboardingSlide];
    return (
      <WixDesignSystemProvider features={{ newColorsBranding: true }}>
        <SkeletonStyleTag />
        <Page>
          <Page.Content>
            <Box align="center" padding="SP10">
              <Card>
                <Card.Content>
                  <Box direction="vertical" gap="SP4" align="center">
                    <Heading size="large">{slide.title}</Heading>
                    <Text>{slide.body}</Text>
                    <Box direction="horizontal" gap="SP2">
                      {onboardingSlides.map((_, idx) => (
                        <div
                          key={idx}
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            background: idx === onboardingSlide ? '#6B21A8' : '#D1D5DB',
                          }}
                        />
                      ))}
                    </Box>
                    <Box direction="horizontal" gap="SP2">
                      {onboardingSlide > 0 && (
                        <Button priority="secondary" onClick={() => setOnboardingSlide((s) => s - 1)}>
                          {t('onboarding.back')}
                        </Button>
                      )}
                      <Button
                        priority="secondary"
                        onClick={() => {
                          localStorage.setItem(LS_ONBOARDING, '1');
                          setOnboardingDismissed(true);
                        }}
                      >
                        {t('onboarding.skip')}
                      </Button>
                      <Button
                        onClick={() => {
                          if (onboardingSlide >= onboardingSlides.length - 1) {
                            localStorage.setItem(LS_ONBOARDING, '1');
                            setOnboardingDismissed(true);
                          } else {
                            setOnboardingSlide((s) => s + 1);
                          }
                        }}
                      >
                        {onboardingSlide >= onboardingSlides.length - 1
                          ? t('onboarding.getStarted')
                          : t('onboarding.next')}
                      </Button>
                    </Box>
                  </Box>
                </Card.Content>
              </Card>
            </Box>
          </Page.Content>
        </Page>
      </WixDesignSystemProvider>
    );
  }

  const gatedSettings = applyPremiumGating(settings, isPremium);
  const features = parseFeatures(selectedPlan.featuresJson);

  return (
    <WixDesignSystemProvider features={{ newColorsBranding: true }}>
      <SkeletonStyleTag />
      <Page height="100vh">
        <Page.Header
          subtitle={t('page.subtitle')}
          actionsBar={
            <Box gap="SP2" verticalAlign="middle">
              {loading ? (
                <Loader size="tiny" />
              ) : (
                <>
                  <Badge skin={isPremium ? 'premium' : 'standard'}>
                    {isPremium ? premium.packageName ?? t('badge.premium') : t('stats.free')}
                  </Badge>
                  {!isPremium && (
                    <Button as="a" href={upgradeUrl} target="_blank">
                      {t('button.upgrade')}
                    </Button>
                  )}
                </>
              )}
            </Box>
          }
        />
        <Page.Content>
          {showCelebration && (
            <Box marginBottom="SP3">
              <Card>
                <Card.Content>
                  <Box direction="vertical" gap="SP1">
                    <Text weight="bold">{t('celebration.title')}</Text>
                    <Text size="small" secondary>
                      {t('celebration.subtitle')}
                    </Text>
                  </Box>
                </Card.Content>
              </Card>
            </Box>
          )}

          <Box marginBottom="24px">
            <Tabs
              items={TABS.map((tab) => ({
                ...tab,
                title: t(`tabs.${tab.id}` as 'tabs.manage'),
              }))}
              activeId={activeTab}
              onClick={(item) => setActiveTab(item.id as DashboardTab)}
              type="compact"
            />
          </Box>

          {activeTab === 'manage' && (
            <Layout>
              <Cell span={12}>
                <Layout gap="18px">
                  {[0, 1, 2, ...(isPremium ? [] : [3])].map((slot) => (
                    <Cell key={slot} span={3}>
                      {slot === 0 && (
                        <StatCard
                          loading={loading}
                          iconBg="linear-gradient(135deg, #EDF3FF 0%, #DBEAFE 100%)"
                          icon={<Icons.Catalog />}
                          label={t('stats.plansConfigured')}
                          value={plans.length}
                        />
                      )}
                      {slot === 1 && (
                        <StatCard
                          loading={loading}
                          highlight={isPremium}
                          iconBg="linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)"
                          icon={<Icons.PremiumFilled />}
                          label={t('stats.currentPlan')}
                          value={isPremium ? premium.packageName ?? t('badge.premium') : t('stats.free')}
                        />
                      )}
                      {slot === 2 && (
                        <StatCard
                          loading={loading}
                          iconBg="linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%)"
                          icon={<Icons.Statistics />}
                          label={t('stats.highlightedPlan')}
                          value={highlightedPlanName}
                        />
                      )}
                      {slot === 3 && !isPremium && (
                        <StatCard
                          loading={loading}
                          iconBg="linear-gradient(135deg, #FEF3C7 0%, #FBBF24 100%)"
                          icon={<Icons.PremiumFilled style={{ color: '#B45309' }} />}
                          label={t('stats.upgradeTitle')}
                          value={
                            <Button as="a" href={upgradeUrl} target="_blank" size="tiny">
                              {t('stats.upgradeValue')}
                            </Button>
                          }
                        />
                      )}
                    </Cell>
                  ))}
                </Layout>
              </Cell>

              <Cell span={7}>
                <Box direction="vertical" gap="SP4">
                  <Card>
                    <Card.Header
                      title={t('manage.plansTitle')}
                      subtitle={t('manage.plansSubtitle')}
                      suffix={
                        <Button
                          size="small"
                          prefixIcon={<Icons.Add />}
                          onClick={addPlan}
                          disabled={!isPremium && plans.length >= FREE_PLAN_LIMIT}
                        >
                          {t('button.addPlan')}
                        </Button>
                      }
                    />
                    <Card.Divider />
                    <Card.Content>
                      {!isPremium && plans.length >= FREE_PLAN_LIMIT && (
                        <Box marginBottom="SP3">
                          <Text size="small">{t('manage.freeLimit')}</Text>
                          <TextButton as="a" href={upgradeUrl} target="_blank">
                            {t('button.goPremium')}
                          </TextButton>
                        </Box>
                      )}
                      <Box direction="vertical" gap="SP2">
                        {plans.map((plan, index) => (
                          <Box
                            key={index}
                            direction="horizontal"
                            verticalAlign="middle"
                            gap="SP2"
                            padding="SP2"
                            style={{
                              border:
                                selectedPlanIndex === index
                                  ? '1px solid #6B21A8'
                                  : '1px solid #E4E6EB',
                              borderRadius: 8,
                              cursor: 'pointer',
                            }}
                          >
                            <Box
                              direction="vertical"
                              gap="SP1"
                              style={{ flex: 1, cursor: 'pointer' }}
                            >
                              <div onClick={() => setSelectedPlanIndex(index)} role="button" tabIndex={0}>
                                <Text weight="bold">{plan.name || `Plan ${index + 1}`}</Text>
                                <Text size="tiny" secondary>
                                  {plan.price} {plan.currency} · {plan.period}
                                </Text>
                              </div>
                            </Box>
                            <Button size="tiny" priority="secondary" onClick={() => movePlan(index, -1)}>
                              {t('manage.moveUp')}
                            </Button>
                            <Button size="tiny" priority="secondary" onClick={() => movePlan(index, 1)}>
                              {t('manage.moveDown')}
                            </Button>
                            <Button
                              size="tiny"
                              skin="destructive"
                              onClick={() => removePlan(index)}
                              disabled={plans.length <= 1}
                            >
                              {t('manage.deletePlan')}
                            </Button>
                          </Box>
                        ))}
                      </Box>
                    </Card.Content>
                  </Card>

                  <Card>
                    <Card.Header title={selectedPlan.name || t('manage.planName')} />
                    <Card.Divider />
                    <Card.Content>
                      <Layout gap="SP3">
                        <Cell span={6}>
                          <FormField label={t('manage.planName')}>
                            <Input
                              value={selectedPlan.name}
                              onChange={(e) => updatePlan(selectedPlanIndex, { name: e.target.value })}
                            />
                          </FormField>
                        </Cell>
                        <Cell span={3}>
                          <FormField label={t('manage.price')}>
                            <NumberInput
                              value={selectedPlan.price}
                              onChange={(val) => updatePlan(selectedPlanIndex, { price: Number(val) || 0 })}
                            />
                          </FormField>
                        </Cell>
                        <Cell span={3}>
                          <FormField label={t('manage.currency')}>
                            <Input
                              value={selectedPlan.currency}
                              onChange={(e) => updatePlan(selectedPlanIndex, { currency: e.target.value })}
                            />
                          </FormField>
                        </Cell>
                        <Cell span={6}>
                          <FormField label={t('manage.period')}>
                            <Dropdown
                              options={[
                                { id: 'monthly', value: t('manage.period.monthly') },
                                { id: 'annual', value: t('manage.period.annual') },
                                { id: 'one-time', value: t('manage.period.oneTime') },
                              ]}
                              selectedId={selectedPlan.period}
                              onSelect={(opt) =>
                                updatePlan(selectedPlanIndex, {
                                  period: opt.id as PricingPlanRecord['period'],
                                })
                              }
                            />
                          </FormField>
                        </Cell>
                        <Cell span={6}>
                          <FormField label={t('manage.tagline')}>
                            <Input
                              value={selectedPlan.tagline}
                              onChange={(e) => updatePlan(selectedPlanIndex, { tagline: e.target.value })}
                            />
                          </FormField>
                        </Cell>
                        <Cell span={12}>
                          <FormField label={t('manage.features')}>
                            <Box direction="vertical" gap="SP2">
                              {features.map((feature, fIdx) => (
                                <Box key={fIdx} direction="vertical" gap="SP1">
                                  <Input
                                    placeholder={t('manage.featureText')}
                                    value={feature.text}
                                    onChange={(e) =>
                                      updateFeature(selectedPlanIndex, fIdx, 'text', e.target.value)
                                    }
                                  />
                                  <Input
                                    placeholder={t('manage.featureDescription')}
                                    value={feature.description ?? ''}
                                    onChange={(e) =>
                                      updateFeature(selectedPlanIndex, fIdx, 'description', e.target.value)
                                    }
                                  />
                                </Box>
                              ))}
                              <Button size="tiny" priority="secondary" onClick={() => addFeature(selectedPlanIndex)}>
                                {t('manage.addFeature')}
                              </Button>
                            </Box>
                          </FormField>
                        </Cell>
                        <Cell span={6}>
                          <FormField label={t('manage.badge')}>
                            <Dropdown
                              disabled={!isPremium}
                              options={[
                                { id: '', value: t('manage.badge.none') },
                                { id: 'mostPopular', value: t('manage.badge.mostPopular') },
                                { id: 'new', value: t('manage.badge.new') },
                                { id: 'crown', value: t('manage.badge.crown') },
                              ]}
                              selectedId={selectedPlan.badge}
                              onSelect={(opt) =>
                                updatePlan(selectedPlanIndex, { badge: opt.id as PlanBadge })
                              }
                            />
                            {!isPremium && (
                              <Text size="tiny" secondary>
                                {t('manage.premiumBadgesLocked')}{' '}
                                <TextButton as="a" href={upgradeUrl} target="_blank">
                                  {t('button.upgrade')}
                                </TextButton>
                              </Text>
                            )}
                          </FormField>
                        </Cell>
                        <Cell span={6}>
                          <Checkbox
                            checked={selectedPlan.isHighlighted}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setPlans((prev) =>
                                prev.map((p, i) => ({
                                  ...p,
                                  isHighlighted:
                                    i === selectedPlanIndex
                                      ? checked
                                      : checked
                                        ? false
                                        : p.isHighlighted,
                                })),
                              );
                            }}
                          >
                            {t('manage.highlighted')}
                          </Checkbox>
                        </Cell>
                        <Cell span={6}>
                          <FormField label={t('manage.ctaMode')}>
                            <Dropdown
                              options={[
                                { id: 'wixCheckout', value: t('manage.ctaMode.wixCheckout') },
                                { id: 'customUrl', value: t('manage.ctaMode.customUrl') },
                                { id: 'contact', value: t('manage.ctaMode.contact') },
                              ]}
                              selectedId={selectedPlan.ctaMode}
                              onSelect={(opt) =>
                                updatePlan(selectedPlanIndex, {
                                  ctaMode: opt.id as PricingPlanRecord['ctaMode'],
                                })
                              }
                            />
                          </FormField>
                        </Cell>
                        <Cell span={6}>
                          <FormField label={t('manage.ctaLabel')}>
                            <Input
                              value={selectedPlan.ctaLabel}
                              onChange={(e) => updatePlan(selectedPlanIndex, { ctaLabel: e.target.value })}
                            />
                          </FormField>
                        </Cell>
                        {selectedPlan.ctaMode === 'wixCheckout' && (
                          <Cell span={12}>
                            <FormField label={t('manage.wixPlan')}>
                              <Dropdown
                                placeholder={t('manage.selectWixPlan')}
                                options={wixPlans.map((p) => ({ id: p._id, value: p.name }))}
                                selectedId={selectedPlan.wixPlanId || selectedPlan.ctaTarget}
                                onSelect={(opt) =>
                                  updatePlan(selectedPlanIndex, {
                                    wixPlanId: opt.id as string,
                                    ctaTarget: opt.id as string,
                                  })
                                }
                              />
                            </FormField>
                          </Cell>
                        )}
                        {selectedPlan.ctaMode !== 'wixCheckout' && (
                          <Cell span={12}>
                            <FormField label={t('manage.ctaTarget')}>
                              <Input
                                value={selectedPlan.ctaTarget}
                                onChange={(e) =>
                                  updatePlan(selectedPlanIndex, { ctaTarget: e.target.value })
                                }
                              />
                            </FormField>
                          </Cell>
                        )}
                      </Layout>
                    </Card.Content>
                  </Card>

                  <Card>
                    <Card.Header title={t('manage.themeTitle')} subtitle={t('manage.themeSubtitle')} />
                    <Card.Divider />
                    <Card.Content>
                      <Layout gap="SP3">
                        <Cell span={6}>
                          <FormField label={t('manage.theme')}>
                            <Dropdown
                              options={[
                                { id: 'light', value: t('manage.theme.light') },
                                { id: 'dark', value: t('manage.theme.dark') },
                                { id: 'minimal', value: t('manage.theme.minimal') },
                                { id: 'brand', value: t('manage.theme.brand') },
                              ]}
                              selectedId={settings.theme}
                              onSelect={(opt) =>
                                setSettings((s) =>
                                  migrateSettings({ ...s, theme: opt.id as AppSettingsRecord['theme'] }),
                                )
                              }
                            />
                          </FormField>
                        </Cell>
                        <Cell span={6}>
                          <FormField label={t('manage.highlightColor')}>
                            <Input
                              value={settings.highlightColor}
                              onChange={(e) =>
                                setSettings((s) => migrateSettings({ ...s, highlightColor: e.target.value }))
                              }
                            />
                          </FormField>
                        </Cell>
                        <Cell span={6}>
                          <FormField label={t('manage.fontFamily')}>
                            <Input
                              value={settings.fontFamily}
                              onChange={(e) =>
                                setSettings((s) => migrateSettings({ ...s, fontFamily: e.target.value }))
                              }
                            />
                          </FormField>
                        </Cell>
                        <Cell span={6}>
                          <FormField label={t('manage.cardStyle')}>
                            <Dropdown
                              options={[
                                { id: 'modern', value: t('manage.cardStyle.modern') },
                                { id: 'classic', value: t('manage.cardStyle.classic') },
                                { id: 'compact', value: t('manage.cardStyle.compact') },
                              ]}
                              selectedId={settings.cardStyle}
                              onSelect={(opt) =>
                                setSettings((s) =>
                                  migrateSettings({ ...s, cardStyle: opt.id as AppSettingsRecord['cardStyle'] }),
                                )
                              }
                            />
                          </FormField>
                        </Cell>
                        <Cell span={12}>
                          <Checkbox
                            checked={settings.showBilledAs}
                            onChange={(e) =>
                              setSettings((s) => migrateSettings({ ...s, showBilledAs: e.target.checked }))
                            }
                          >
                            {t('manage.showBilledAs')}
                          </Checkbox>
                        </Cell>
                        <Cell span={12}>
                          <Text weight="bold">{t('manage.advancedDesign')}</Text>
                          {!isPremium && (
                            <Text size="small" secondary>
                              {t('manage.advancedLocked')}{' '}
                              <TextButton as="a" href={upgradeUrl} target="_blank">
                                {t('button.upgrade')}
                              </TextButton>
                            </Text>
                          )}
                        </Cell>
                        <Cell span={4}>
                          <FormField label={t('manage.borderRadius')}>
                            <NumberInput
                              disabled={!isPremium}
                              value={settings.advancedDesign.borderRadius}
                              onChange={(val) =>
                                setSettings((s) =>
                                  migrateSettings({
                                    ...s,
                                    advancedDesign: {
                                      ...s.advancedDesign,
                                      borderRadius: Number(val) || 0,
                                    },
                                  }),
                                )
                              }
                            />
                          </FormField>
                        </Cell>
                        <Cell span={4}>
                          <FormField label={t('manage.buttonShape')}>
                            <Dropdown
                              disabled={!isPremium}
                              options={[
                                { id: 'rounded', value: t('manage.buttonShape.rounded') },
                                { id: 'pill', value: t('manage.buttonShape.pill') },
                                { id: 'square', value: t('manage.buttonShape.square') },
                              ]}
                              selectedId={settings.advancedDesign.buttonShape}
                              onSelect={(opt) =>
                                setSettings((s) =>
                                  migrateSettings({
                                    ...s,
                                    advancedDesign: {
                                      ...s.advancedDesign,
                                      buttonShape: opt.id as AppSettingsRecord['advancedDesign']['buttonShape'],
                                    },
                                  }),
                                )
                              }
                            />
                          </FormField>
                        </Cell>
                        <Cell span={4}>
                          <FormField label={t('manage.shadowEnabled')}>
                            <ToggleSwitch
                              disabled={!isPremium}
                              checked={settings.advancedDesign.shadowEnabled}
                              onChange={() =>
                                setSettings((s) =>
                                  migrateSettings({
                                    ...s,
                                    advancedDesign: {
                                      ...s.advancedDesign,
                                      shadowEnabled: !s.advancedDesign.shadowEnabled,
                                    },
                                  }),
                                )
                              }
                            />
                          </FormField>
                        </Cell>
                      </Layout>
                    </Card.Content>
                  </Card>

                  <Card>
                    <Card.Content>
                      <Box direction="horizontal" verticalAlign="middle" gap="SP3">
                        <Button onClick={handleSave} disabled={saving}>
                          {saving ? t('button.saving') : t('button.save')}
                        </Button>
                        {lastSavedAt && (
                          <Text size="tiny" secondary>
                            {t('manage.lastSaved', { time: lastSavedAt })}
                          </Text>
                        )}
                      </Box>
                    </Card.Content>
                  </Card>
                </Box>
              </Cell>

              <Cell span={5}>
                <div style={{ position: 'sticky', top: 64 }}>
                  <Card>
                    <Card.Header
                      title={t('manage.previewTitle')}
                      subtitle={t('manage.previewSubtitle')}
                      suffix={
                        <SegmentedToggle
                          size="small"
                          selected={previewDevice}
                          onClick={(_e, val) => setPreviewDevice(val as 'desktop' | 'mobile')}
                        >
                          <SegmentedToggle.Button value="desktop" prefixIcon={<Icons.Desktop />} />
                          <SegmentedToggle.Button value="mobile" prefixIcon={<Icons.Mobile />} />
                        </SegmentedToggle>
                      }
                    />
                    <Card.Divider />
                    <Card.Content>
                      {loading ? (
                        <Skeleton width="100%" height={340} radius={12} />
                      ) : (
                        <LivePreview
                          plans={plans.map((p) =>
                            PREMIUM_BADGES.includes(p.badge) && !isPremium ? { ...p, badge: '' } : p,
                          )}
                          settings={gatedSettings}
                          isPremium={isPremium}
                          device={previewDevice}
                        />
                      )}
                    </Card.Content>
                  </Card>
                </div>
              </Cell>

              <Cell span={12}>
                <MoreAppsCard />
              </Cell>
            </Layout>
          )}

          {activeTab === 'planSettings' && (
            <Layout>
              <Cell span={12}>
                <Card>
                  <Card.Header title={t('pricing.title')} subtitle={t('pricing.subtitle')} />
                  <Card.Divider />
                  <Card.Content>
                    <Layout gap="SP3">
                      {marketPlans.map((plan, index) => {
                        const isCurrent =
                          plan.name.toLowerCase() === (premium.packageName ?? 'free').toLowerCase();
                        const planPrice = extractMonthlyPriceNumber(plan);
                        const isDowngrade = isPremium && !isCurrent && planPrice < activePrice && planPrice > 0;
                        const isPopular = index === 1;
                        return (
                          <Cell key={plan.vendorId} span={3}>
                            <div
                              style={{
                                opacity: isDowngrade ? 0.55 : 1,
                                background: isDowngrade ? '#F7F8FA' : '#fff',
                                border: '1px solid #E4E6EB',
                                borderRadius: 12,
                                padding: 20,
                                height: '100%',
                              }}
                            >
                              <Box direction="vertical" gap="SP2">
                                {isPopular && (
                                  <Badge size="tiny" skin="premium">
                                    {t('badge.mostPopular')}
                                  </Badge>
                                )}
                                {isCurrent && (
                                  <Badge size="tiny" skin="success">
                                    {t('badge.currentPlan')}
                                  </Badge>
                                )}
                                <Text weight="bold">{plan.name}</Text>
                                <Text size="medium" weight="bold">
                                  {formatMonthlyPrice(plan, currencySymbol)}
                                </Text>
                                <Box direction="vertical" gap="SP1">
                                  {plan.benefits.slice(0, 4).map((b) => (
                                    <Text key={b} size="tiny">
                                      {'\u2713'} {b}
                                    </Text>
                                  ))}
                                </Box>
                                {isCurrent ? (
                                  <Button disabled>{t('button.currentPlan')}</Button>
                                ) : isDowngrade ? (
                                  <Tooltip content={t('pricing.downgradeTooltip')}>
                                    <Button disabled>{t('button.includedInPlan')}</Button>
                                  </Tooltip>
                                ) : (
                                  <Button as="a" href={upgradeUrl} target="_blank">
                                    {t('button.getPlan', { planName: plan.name })}
                                  </Button>
                                )}
                              </Box>
                            </div>
                          </Cell>
                        );
                      })}
                    </Layout>
                  </Card.Content>
                </Card>
              </Cell>
              <Cell span={12}>
                <MoreAppsCard />
              </Cell>
            </Layout>
          )}

          {activeTab === 'howToUse' && (
            <Layout>
              <Cell span={12}>
                <Card>
                  <Card.Header title={t('howTo.stepsTitle')} />
                  <Card.Divider />
                  <Card.Content>
                    <Box direction="vertical" gap="SP4">
                      {[1, 2, 3, 4].map((step) => (
                        <Box key={step} direction="horizontal" gap="SP3">
                          <Badge>{step}</Badge>
                          <Box direction="vertical" gap="SP1">
                            <Text weight="bold">{t(`howTo.step${step}.title`)}</Text>
                            <Text size="small" secondary>
                              {t(`howTo.step${step}.body`)}
                            </Text>
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  </Card.Content>
                </Card>
              </Cell>
              <Cell span={12}>
                <Card>
                  <Card.Header title={t('faq.title')} />
                  <Card.Divider />
                  <Card.Content>
                    <Accordion
                      items={[1, 2, 3, 4, 5].map((n) => ({
                        title: t(`faq.q${n}`),
                        children: <Text size="small">{t(`faq.a${n}`)}</Text>,
                      }))}
                      multiple
                    />
                  </Card.Content>
                </Card>
              </Cell>
              <Cell span={12}>
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
              </Cell>
              <Cell span={12}>
                <MoreAppsCard />
              </Cell>
            </Layout>
          )}
        </Page.Content>
      </Page>
    </WixDesignSystemProvider>
  );
};

const DashboardPage: FC = () => (
  <WithIntlProvider>
    <ErrorBoundary>
      <DashboardInner />
    </ErrorBoundary>
  </WithIntlProvider>
);

export default DashboardPage;
