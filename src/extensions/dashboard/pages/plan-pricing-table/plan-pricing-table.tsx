import React, { type FC, useCallback, useEffect, useMemo, useState } from 'react';
import {
  Accordion,
  Badge,
  Box,
  Button,
  Card,
  Cell,
  Dropdown,
  FormField,
  Heading,
  Input,
  Layout,
  NumberInput,
  Page,
  SectionHelper,
  SegmentedToggle,
  Tabs,
  Text,
  ToggleSwitch,
  Tooltip,
  WixDesignSystemProvider,
} from '@wix/design-system';
import '@wix/design-system/styles.global.css';
import * as Icons from '@wix/wix-ui-icons-common';
import { httpClient } from '@wix/essentials';
import { useIntl } from 'react-intl';

import {
  APP_ID,
  FREE_PLAN_LIMIT,
  LS_CELEBRATION,
  LS_ONBOARDING,
  LS_REVIEW,
  REVIEW_URL,
  SUPPORT_EMAIL,
} from '../../../_shared/app-config';
import { ErrorBoundary } from '../../../_shared/error-boundary';
import { PricingCardsView } from '../../../_shared/PricingCardsView';
import {
  defaultPlan,
  parseFeatures,
  type AppSettings,
  type BadgeId,
  type CtaMode,
  type PricingPlanRow,
} from '../../../_shared/pricing-types';
import type { AppPlan } from '../../../../pages/api/app/plans';
import { ensureRatePopupRegistered, openRatePopup } from '../../../../dashboard/_shared/rate-popup';
import { withIntlProvider } from '../../../../intl/withIntlProvider';
import { MoreAppsCard } from './components/MoreAppsCard';
import { Skeleton, SkeletonStyleTag } from './components/Skeleton';
import { StatCard } from './components/StatCard';

type DashboardTab = 'manage' | 'planSettings' | 'howToUse';

function extractMonthlyPriceNumber(plan: AppPlan): number {
  const monthly = plan.prices.find((p) => p.cycleType === 'MONTHLY') || plan.prices[0];
  if (!monthly) return 0;
  const n = parseFloat(monthly.price);
  if (isNaN(n)) return 0;
  if (monthly.cycleType === 'YEARLY') return n * 12;
  return n;
}

function formatMonthlyPrice(plan: AppPlan, symbol: string): string {
  const monthly = plan.prices.find((p) => p.cycleType === 'MONTHLY') || plan.prices[0];
  if (!monthly) return `${symbol}0`;
  const n = parseFloat(monthly.price);
  if (monthly.cycleType === 'YEARLY') {
    return `${symbol}${(n * 12).toFixed(2)}`;
  }
  return `${symbol}${n.toFixed(2)}`;
}

const DashboardPage: FC = () => {
  const intl = useIntl();
  const t = useCallback(
    (id: string, values?: Record<string, string | number>) =>
      intl.formatMessage({ id }, values),
    [intl],
  );

  const [dashboardTab, setDashboardTab] = useState<DashboardTab>('manage');
  const [planLoading, setPlanLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [planStatus, setPlanStatus] = useState<'premium' | 'cancelled' | 'free'>('free');
  const [currentPlanName, setCurrentPlanName] = useState('free');
  const [instanceId, setInstanceId] = useState<string | undefined>();

  const [marketPlans, setMarketPlans] = useState<AppPlan[]>([]);
  const [currencySymbol, setCurrencySymbol] = useState('$');
  const [plansLoading, setPlansLoading] = useState(true);

  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [plans, setPlans] = useState<PricingPlanRow[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [dataLoading, setDataLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');

  const [wixPlans, setWixPlans] = useState<Array<{ _id: string; name: string }>>([]);
  const [wixPlansInstalled, setWixPlansInstalled] = useState(true);

  const [onboardingStep, setOnboardingStep] = useState(0);
  const [onboardingDismissed, setOnboardingDismissed] = useState(() => {
    try {
      return localStorage.getItem(LS_ONBOARDING) === '1';
    } catch {
      return false;
    }
  });
  const [showCelebration, setShowCelebration] = useState(false);

  const upgradeUrl = useMemo(
    () =>
      instanceId
        ? `https://www.wix.com/apps/upgrade/${APP_ID}?appInstanceId=${instanceId}`
        : `https://www.wix.com/apps/upgrade/${APP_ID}`,
    [instanceId],
  );

  const maxPlans = isPremium ? Infinity : FREE_PLAN_LIMIT;
  const selectedPlan = plans[selectedIdx];

  const loadData = useCallback(async () => {
    setDataLoading(true);
    try {
      const res = await httpClient.fetchWithAuth('/api/widget/dashboard-settings');
      const data = await res.json();
      setSettings(data.settings);
      setPlans(data.plans?.length ? data.plans : [defaultPlan(0)]);
      setIsPremium(!!data.isPremium);
    } catch (e) {
      console.error('[dashboard] load failed', e);
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    ensureRatePopupRegistered();
    (async () => {
      try {
        const premRes = await httpClient.fetchWithAuth('/api/app/check-premium');
        const prem = await premRes.json();
        setIsPremium(!!prem.isPremium);
        setPlanStatus(prem.planStatus || 'free');
        setCurrentPlanName((prem.packageName || 'free').toLowerCase());
        setInstanceId(prem.instanceId);
      } finally {
        setPlanLoading(false);
      }
      try {
        const plansRes = await httpClient.fetchWithAuth('/api/app/plans');
        const pd = await plansRes.json();
        setMarketPlans(pd.plans || []);
        setCurrencySymbol(pd.currencySymbol || '$');
      } finally {
        setPlansLoading(false);
      }
      try {
        const wpRes = await httpClient.fetchWithAuth('/api/wix-pricing-plans/list');
        const wp = await wpRes.json();
        setWixPlans(wp.plans || []);
        setWixPlansInstalled(!!wp.installed);
      } catch {
        setWixPlansInstalled(false);
      }
      await loadData();
    })();
  }, [loadData]);

  const triggerReviewOnce = useCallback(() => {
    try {
      if (localStorage.getItem(LS_REVIEW)) return;
      localStorage.setItem(LS_REVIEW, '1');
      openRatePopup(REVIEW_URL);
    } catch {
      /* ignore */
    }
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      const res = await httpClient.fetchWithAuth('/api/widget/dashboard-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings, plans }),
      });
      const data = await res.json();
      if (data.error === 'plan_limit') {
        alert(t('manage.limitError', { count: FREE_PLAN_LIMIT }));
        return;
      }
      if (!res.ok || data.error) {
        alert(t('manage.saveFailed'));
        return;
      }
      setSettings(data.settings);
      setPlans(data.plans || plans);
      setLastSaved(new Date());
      httpClient.fetchWithAuth('/api/app/track-setup-completed', { method: 'POST' });
      try {
        if (!localStorage.getItem(LS_CELEBRATION)) {
          localStorage.setItem(LS_CELEBRATION, '1');
          setShowCelebration(true);
          setTimeout(() => setShowCelebration(false), 8000);
        }
      } catch {
        /* ignore */
      }
      triggerReviewOnce();
    } catch (e) {
      console.error('[dashboard] save failed', e);
      alert(t('manage.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const addPlan = () => {
    if (plans.length >= maxPlans) return;
    setPlans([...plans, defaultPlan(plans.length)]);
    setSelectedIdx(plans.length);
  };

  const removePlan = (idx: number) => {
    const next = plans.filter((_, i) => i !== idx);
    setPlans(next.length ? next : [defaultPlan(0)]);
    setSelectedIdx(Math.max(0, idx - 1));
  };

  const movePlan = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= plans.length) return;
    const next = [...plans];
    [next[idx], next[target]] = [next[target], next[idx]];
    setPlans(next.map((p, i) => ({ ...p, sortOrder: i })));
    setSelectedIdx(target);
  };

  const updateSelected = (patch: Partial<PricingPlanRow>) => {
    setPlans(plans.map((p, i) => (i === selectedIdx ? { ...p, ...patch } : p)));
  };

  const updateFeature = (fIdx: number, label: string, included: boolean) => {
    if (!selectedPlan) return;
    const features = parseFeatures(selectedPlan.featuresJson);
    features[fIdx] = { label, included };
    updateSelected({ featuresJson: JSON.stringify(features) });
  };

  const addFeature = () => {
    if (!selectedPlan) return;
    const features = parseFeatures(selectedPlan.featuresJson);
    features.push({ label: '', included: true });
    updateSelected({ featuresJson: JSON.stringify(features) });
  };

  const isFirstTime = !dataLoading && plans.every((p) => !p.name);
  const showOnboarding = isFirstTime && !onboardingDismissed;

  if (showOnboarding) {
    const slides = [
      { title: t('onboarding.welcome'), desc: t('onboarding.welcomeDesc') },
      { title: t('onboarding.step1'), desc: t('onboarding.step1Desc') },
      { title: t('onboarding.step2'), desc: t('onboarding.step2Desc') },
      { title: t('onboarding.allSet'), desc: t('onboarding.allSetDesc') },
    ];
    const slide = slides[onboardingStep];
    return (
      <WixDesignSystemProvider features={{ newColorsBranding: true }}>
        <Page>
          <Page.Content>
            <Box align="center" padding="SP10" direction="vertical" gap="SP4">
              <Heading size="large">{slide.title}</Heading>
              <Text>{slide.desc}</Text>
              <Box gap="SP2">
                {onboardingStep > 0 && (
                  <Button onClick={() => setOnboardingStep((s) => s - 1)}>{t('button.back')}</Button>
                )}
                {onboardingStep < slides.length - 1 ? (
                  <Button onClick={() => setOnboardingStep((s) => s + 1)}>{t('button.next')}</Button>
                ) : (
                  <Button
                    onClick={() => {
                      try {
                        localStorage.setItem(LS_ONBOARDING, '1');
                      } catch {
                        /* ignore */
                      }
                      setOnboardingDismissed(true);
                    }}
                  >
                    {t('button.getStarted')}
                  </Button>
                )}
              </Box>
            </Box>
          </Page.Content>
        </Page>
      </WixDesignSystemProvider>
    );
  }

  const activePrice = (() => {
    const match = marketPlans.find(
      (p) => p.name.toLowerCase() === currentPlanName.toLowerCase(),
    );
    return match ? extractMonthlyPriceNumber(match) : 0;
  })();

  return (
    <WixDesignSystemProvider features={{ newColorsBranding: true }}>
      <SkeletonStyleTag />
      <ErrorBoundary surface="dashboard">
        <Page height="100vh">
          <Page.Header
            subtitle={t('page.subtitle')}
            actionsBar={
              <Box gap="SP2" verticalAlign="middle">
                {planLoading ? (
                  <Text size="small" secondary>
                    {t('page.checkingPlan')}
                  </Text>
                ) : isPremium ? (
                  <Badge skin="premium">{t('badge.premium')}</Badge>
                ) : (
                  <>
                    <Badge skin="neutralStandard">{t('badge.free')}</Badge>
                    <Button as="a" href={upgradeUrl} target="_blank" prefixIcon={<Icons.Premium />}>
                      {t('button.upgrade')}
                    </Button>
                  </>
                )}
              </Box>
            }
          />
          <Page.Content>
            {showCelebration && (
              <Box marginBottom="SP3">
                <SectionHelper appearance="success" title={t('celebration.message')} />
              </Box>
            )}

            <Box marginBottom="24px">
              <Tabs
                type="compact"
                activeId={dashboardTab}
                onClick={(item) => setDashboardTab(item.id as DashboardTab)}
                items={[
                  { id: 'manage', title: t('tab.manage') },
                  { id: 'planSettings', title: t('tab.planSettings') },
                  { id: 'howToUse', title: t('tab.howToUse') },
                ]}
              />
            </Box>

            {dashboardTab === 'manage' && (
              <Layout>
                <Cell span={12}>
                  <Layout gap="24px">
                    <Cell span={3}>
                      <StatCard
                        icon={<Icons.List />}
                        iconBg="linear-gradient(135deg, #EDF3FF, #DBEAFE)"
                        iconColor="#3B6AEA"
                        label={t('stats.plans')}
                        loading={dataLoading}
                        value={plans.length}
                      />
                    </Cell>
                    <Cell span={3}>
                      <StatCard
                        icon={<Icons.PremiumFilled />}
                        iconBg="linear-gradient(135deg, #FEF3C7, #FDE68A)"
                        iconColor="#D97706"
                        label={t('stats.currentPlan')}
                        loading={planLoading}
                        highlight={isPremium}
                        value={isPremium ? t('badge.premium') : t('badge.free')}
                      />
                    </Cell>
                    <Cell span={3}>
                      <StatCard
                        icon={<Icons.Statistics />}
                        iconBg="linear-gradient(135deg, #D1FAE5, #A7F3D0)"
                        iconColor="#059669"
                        label={t('stats.slots')}
                        loading={dataLoading}
                        value={
                          isPremium
                            ? t('stats.unlimited')
                            : t('stats.slotsValue', { used: plans.length, max: FREE_PLAN_LIMIT })
                        }
                      />
                    </Cell>
                    {!isPremium && (
                      <Cell span={3}>
                        <StatCard
                          icon={<Icons.PremiumFilled />}
                          iconBg="linear-gradient(135deg, #FEF9C3, #FDE047)"
                          iconColor="#CA8A04"
                          label={t('stats.goPremium')}
                          value={
                            <Button as="a" href={upgradeUrl} target="_blank" size="tiny">
                              {t('button.upgrade')}
                            </Button>
                          }
                        />
                      </Cell>
                    )}
                  </Layout>
                </Cell>

                {!wixPlansInstalled && (
                  <Cell span={12}>
                    <SectionHelper appearance="warning" title={t('manage.wixPlansMissing')}>
                      {t('manage.wixPlansMissingDesc')}
                    </SectionHelper>
                  </Cell>
                )}

                <Cell span={7}>
                  <Box direction="vertical" gap="SP4">
                    <Card>
                      <Card.Header
                        title={t('manage.plansTitle')}
                        suffix={
                          <Button
                            size="small"
                            prefixIcon={<Icons.Add />}
                            onClick={addPlan}
                            disabled={plans.length >= maxPlans}
                          >
                            {t('manage.addPlan')}
                          </Button>
                        }
                      />
                      <Card.Divider />
                      <Card.Content>
                        {dataLoading ? (
                          <Skeleton height={120} />
                        ) : (
                          <Box direction="vertical" gap="SP2">
                            {plans.map((p, idx) => (
                              <div
                                key={idx}
                                role="button"
                                tabIndex={0}
                                onClick={() => setSelectedIdx(idx)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ' ') setSelectedIdx(idx);
                                }}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 8,
                                  padding: 8,
                                  border:
                                    idx === selectedIdx
                                      ? '2px solid #6B21A8'
                                      : '1px solid #E4E6EB',
                                  borderRadius: 8,
                                  cursor: 'pointer',
                                }}
                              >
                                <Icons.Order />
                                <Box flex="1">
                                  <Text weight="bold">{p.name || t('manage.untitledPlan')}</Text>
                                  <Text size="tiny" secondary>
                                    {p.price}
                                    {p.period}
                                  </Text>
                                </Box>
                                <Button size="tiny" onClick={(e) => { e.stopPropagation(); movePlan(idx, -1); }} disabled={idx === 0}>
                                  <Icons.ChevronUp />
                                </Button>
                                <Button
                                  size="tiny"
                                  onClick={(e) => { e.stopPropagation(); movePlan(idx, 1); }}
                                  disabled={idx === plans.length - 1}
                                >
                                  <Icons.ChevronDown />
                                </Button>
                                <Button
                                  size="tiny"
                                  skin="destructive"
                                  onClick={(e) => { e.stopPropagation(); removePlan(idx); }}
                                  disabled={plans.length <= 1}
                                >
                                  <Icons.Delete />
                                </Button>
                              </div>
                            ))}
                            {!isPremium && plans.length >= FREE_PLAN_LIMIT && (
                              <SectionHelper appearance="premium" title={t('manage.limitTitle')}>
                                {t('manage.limitDesc')}
                                <Box marginTop="SP2">
                                  <Button as="a" href={upgradeUrl} target="_blank" size="small">
                                    {t('button.upgrade')}
                                  </Button>
                                </Box>
                              </SectionHelper>
                            )}
                          </Box>
                        )}
                      </Card.Content>
                    </Card>

                    {selectedPlan && !dataLoading && (
                      <Card>
                        <Card.Header title={t('manage.editPlan')} />
                        <Card.Divider />
                        <Card.Content>
                          <Layout>
                            <Cell span={6}>
                              <FormField label={t('field.name')} required>
                                <Input
                                  value={selectedPlan.name}
                                  onChange={(e) => updateSelected({ name: e.target.value })}
                                />
                              </FormField>
                            </Cell>
                            <Cell span={3}>
                              <FormField label={t('field.price')}>
                                <Input
                                  value={selectedPlan.price}
                                  onChange={(e) => updateSelected({ price: e.target.value })}
                                  prefix={<Input.Affix>$</Input.Affix>}
                                />
                              </FormField>
                            </Cell>
                            <Cell span={3}>
                              <FormField label={t('field.period')}>
                                <Input
                                  value={selectedPlan.period}
                                  onChange={(e) => updateSelected({ period: e.target.value })}
                                />
                              </FormField>
                            </Cell>
                            <Cell span={12}>
                              <FormField label={t('field.tagline')}>
                                <Input
                                  value={selectedPlan.tagline}
                                  onChange={(e) => updateSelected({ tagline: e.target.value })}
                                />
                              </FormField>
                            </Cell>
                            <Cell span={6}>
                              <FormField label={t('field.ctaMode')}>
                                <Dropdown
                                  options={[
                                    { id: 'wixCheckout', value: t('cta.wixCheckout') },
                                    { id: 'customUrl', value: t('cta.customUrl') },
                                    { id: 'contactForm', value: t('cta.contactForm') },
                                  ]}
                                  selectedId={selectedPlan.ctaMode}
                                  onSelect={(opt) =>
                                    updateSelected({ ctaMode: opt.id as CtaMode })
                                  }
                                />
                              </FormField>
                            </Cell>
                            <Cell span={6}>
                              <FormField label={t('field.ctaLabel')}>
                                <Input
                                  value={selectedPlan.ctaLabel}
                                  onChange={(e) => updateSelected({ ctaLabel: e.target.value })}
                                />
                              </FormField>
                            </Cell>
                            {selectedPlan.ctaMode === 'wixCheckout' && (
                              <Cell span={12}>
                                <FormField label={t('field.wixPlanId')}>
                                  <Dropdown
                                    placeholder={t('field.wixPlanPlaceholder')}
                                    options={wixPlans.map((wp) => ({
                                      id: wp._id,
                                      value: wp.name,
                                    }))}
                                    selectedId={selectedPlan.wixPlanId || undefined}
                                    onSelect={(opt) => updateSelected({ wixPlanId: opt.id as string })}
                                  />
                                </FormField>
                              </Cell>
                            )}
                            {selectedPlan.ctaMode === 'customUrl' && (
                              <Cell span={12}>
                                <FormField label={t('field.customUrl')}>
                                  <Input
                                    value={selectedPlan.customUrl}
                                    onChange={(e) => updateSelected({ customUrl: e.target.value })}
                                  />
                                </FormField>
                              </Cell>
                            )}
                            {selectedPlan.ctaMode === 'contactForm' && (
                              <Cell span={12}>
                                <FormField label={t('field.contactEmail')}>
                                  <Input
                                    value={selectedPlan.contactEmail}
                                    onChange={(e) =>
                                      updateSelected({ contactEmail: e.target.value })
                                    }
                                  />
                                </FormField>
                              </Cell>
                            )}
                            <Cell span={6}>
                              <FormField label={t('field.highlighted')}>
                                <ToggleSwitch
                                  checked={selectedPlan.highlighted}
                                  onChange={() =>
                                    updateSelected({ highlighted: !selectedPlan.highlighted })
                                  }
                                />
                              </FormField>
                            </Cell>
                            <Cell span={6}>
                              <FormField
                                label={t('field.badge')}
                                infoContent={
                                  !isPremium ? t('field.badgePremium') : undefined
                                }
                              >
                                <Dropdown
                                  disabled={!isPremium}
                                  options={[
                                    { id: 'none', value: t('badge.none') },
                                    { id: 'mostPopular', value: t('badge.mostPopular') },
                                    { id: 'new', value: t('badge.new') },
                                    { id: 'crown', value: t('badge.crown') },
                                  ]}
                                  selectedId={selectedPlan.badge}
                                  onSelect={(opt) =>
                                    updateSelected({ badge: opt.id as BadgeId })
                                  }
                                />
                              </FormField>
                            </Cell>
                            {isPremium && (
                              <>
                                <Cell span={6}>
                                  <FormField label={t('field.cardColor')}>
                                    <Input
                                      value={selectedPlan.cardColor}
                                      onChange={(e) =>
                                        updateSelected({ cardColor: e.target.value })
                                      }
                                      placeholder="#ffffff"
                                    />
                                  </FormField>
                                </Cell>
                                <Cell span={6}>
                                  <FormField label={t('field.cardBorderColor')}>
                                    <Input
                                      value={selectedPlan.cardBorderColor}
                                      onChange={(e) =>
                                        updateSelected({ cardBorderColor: e.target.value })
                                      }
                                      placeholder="#e4e6eb"
                                    />
                                  </FormField>
                                </Cell>
                              </>
                            )}
                            <Cell span={12}>
                              <Text weight="bold">{t('field.features')}</Text>
                              <Box direction="vertical" gap="SP2" marginTop="SP2">
                                {parseFeatures(selectedPlan.featuresJson).map((f, fIdx) => (
                                  <Box key={fIdx} gap="SP2" verticalAlign="middle">
                                    <ToggleSwitch
                                      checked={f.included}
                                      onChange={() => updateFeature(fIdx, f.label, !f.included)}
                                    />
                                    <Input
                                      value={f.label}
                                      onChange={(e) =>
                                        updateFeature(fIdx, e.target.value, f.included)
                                      }
                                    />
                                  </Box>
                                ))}
                                <Button size="small" onClick={addFeature}>
                                  {t('manage.addFeature')}
                                </Button>
                              </Box>
                            </Cell>
                          </Layout>
                        </Card.Content>
                      </Card>
                    )}

                    {settings && (
                      <Card>
                        <Card.Header title={t('design.title')} />
                        <Card.Divider />
                        <Card.Content>
                          <Layout>
                            <Cell span={6}>
                              <FormField label={t('design.theme')}>
                                <Dropdown
                                  options={[
                                    { id: 'light', value: t('theme.light') },
                                    { id: 'minimal', value: t('theme.minimal') },
                                    ...(isPremium
                                      ? [
                                          { id: 'dark', value: t('theme.dark') },
                                          { id: 'brand', value: t('theme.brand') },
                                        ]
                                      : []),
                                  ]}
                                  selectedId={settings.theme}
                                  onSelect={(opt) =>
                                    setSettings({ ...settings, theme: opt.id as AppSettings['theme'] })
                                  }
                                />
                              </FormField>
                            </Cell>
                            <Cell span={6}>
                              <FormField label={t('design.font')}>
                                <Dropdown
                                  options={[
                                    { id: 'system', value: 'System' },
                                    { id: 'inter', value: 'Inter' },
                                    { id: 'poppins', value: 'Poppins' },
                                    { id: 'roboto', value: 'Roboto' },
                                  ]}
                                  selectedId={settings.font}
                                  onSelect={(opt) =>
                                    setSettings({ ...settings, font: opt.id as AppSettings['font'] })
                                  }
                                />
                              </FormField>
                            </Cell>
                            <Cell span={6}>
                              <FormField label={t('design.highlightColor')}>
                                <Input
                                  value={settings.highlightColor}
                                  onChange={(e) =>
                                    setSettings({ ...settings, highlightColor: e.target.value })
                                  }
                                />
                              </FormField>
                            </Cell>
                            <Cell span={6}>
                              <FormField label={t('design.cardStyle')}>
                                <Dropdown
                                  options={[
                                    { id: 'modern', value: t('cardStyle.modern') },
                                    { id: 'classic', value: t('cardStyle.classic') },
                                    { id: 'compact', value: t('cardStyle.compact') },
                                  ]}
                                  selectedId={settings.cardStyle}
                                  onSelect={(opt) =>
                                    setSettings({
                                      ...settings,
                                      cardStyle: opt.id as AppSettings['cardStyle'],
                                    })
                                  }
                                />
                              </FormField>
                            </Cell>
                            <Cell span={12}>
                              <FormField label={t('design.showBilledAs')}>
                                <ToggleSwitch
                                  checked={settings.showBilledAsNote}
                                  onChange={() =>
                                    setSettings({
                                      ...settings,
                                      showBilledAsNote: !settings.showBilledAsNote,
                                    })
                                  }
                                />
                              </FormField>
                            </Cell>
                            <Cell span={12}>
                              <Text weight="bold">{t('design.advancedTitle')}</Text>
                              {!isPremium && (
                                <Box marginTop="SP2">
                                  <SectionHelper appearance="premium" title={t('design.premiumOnly')}>
                                    <Button as="a" href={upgradeUrl} target="_blank" size="small">
                                      {t('button.upgrade')}
                                    </Button>
                                  </SectionHelper>
                                </Box>
                              )}
                            </Cell>
                            {isPremium && (
                              <>
                                <Cell span={4}>
                                  <FormField label={t('design.borderRadius')}>
                                    <NumberInput
                                      value={settings.borderRadius}
                                      onChange={(v) =>
                                        setSettings({ ...settings, borderRadius: Number(v) || 0 })
                                      }
                                      min={0}
                                      max={32}
                                    />
                                  </FormField>
                                </Cell>
                                <Cell span={4}>
                                  <FormField label={t('design.shadowDepth')}>
                                    <Dropdown
                                      options={[
                                        { id: 'none', value: t('shadow.none') },
                                        { id: 'soft', value: t('shadow.soft') },
                                        { id: 'medium', value: t('shadow.medium') },
                                        { id: 'strong', value: t('shadow.strong') },
                                      ]}
                                      selectedId={settings.shadowDepth}
                                      onSelect={(opt) =>
                                        setSettings({
                                          ...settings,
                                          shadowDepth: opt.id as AppSettings['shadowDepth'],
                                        })
                                      }
                                    />
                                  </FormField>
                                </Cell>
                                <Cell span={4}>
                                  <FormField label={t('design.buttonShape')}>
                                    <Dropdown
                                      options={[
                                        { id: 'rounded', value: t('buttonShape.rounded') },
                                        { id: 'pill', value: t('buttonShape.pill') },
                                        { id: 'square', value: t('buttonShape.square') },
                                      ]}
                                      selectedId={settings.buttonShape}
                                      onSelect={(opt) =>
                                        setSettings({
                                          ...settings,
                                          buttonShape: opt.id as AppSettings['buttonShape'],
                                        })
                                      }
                                    />
                                  </FormField>
                                </Cell>
                              </>
                            )}
                          </Layout>
                        </Card.Content>
                      </Card>
                    )}

                    <Box gap="SP2" verticalAlign="middle">
                      <Button onClick={handleSave} disabled={saving || dataLoading || !settings}>
                        {saving ? t('button.saving') : t('button.save')}
                      </Button>
                      {lastSaved && (
                        <Text size="tiny" secondary>
                          {t('manage.lastSaved', {
                            time: lastSaved.toLocaleTimeString(),
                          })}
                        </Text>
                      )}
                    </Box>
                  </Box>
                </Cell>

                <Cell span={5}>
                  <div style={{ position: 'sticky', top: 64 }}>
                    <Card>
                      <Card.Header
                        title={t('preview.title')}
                        subtitle={t('preview.subtitle')}
                        suffix={
                          <SegmentedToggle
                            size="small"
                            selected={previewDevice}
                            onClick={(_e, val) =>
                              setPreviewDevice(val as 'desktop' | 'mobile')
                            }
                          >
                            <SegmentedToggle.Button value="desktop" prefixIcon={<Icons.Desktop />} />
                            <SegmentedToggle.Button value="mobile" prefixIcon={<Icons.Mobile />} />
                          </SegmentedToggle>
                        }
                      />
                      <Card.Divider />
                      <Card.Content>
                        {dataLoading || !settings ? (
                          <Skeleton height={340} radius={12} />
                        ) : (
                          <div
                            style={{
                              maxWidth: previewDevice === 'mobile' ? 375 : '100%',
                              margin: '0 auto',
                              border: previewDevice === 'mobile' ? '1px solid #E4E6EB' : 'none',
                              borderRadius: previewDevice === 'mobile' ? 12 : 0,
                              overflow: 'hidden',
                            }}
                          >
                            <PricingCardsView
                              settings={settings}
                              plans={plans}
                              isPremium={isPremium}
                              showWatermark={!isPremium}
                              device={previewDevice}
                              labels={{
                                emptyTitle: t('widget.emptyTitle'),
                                emptyDesc: t('widget.emptyDesc'),
                                watermark: t('widget.watermark'),
                                billedAs: t('widget.billedAs'),
                                badgeMostPopular: t('badge.mostPopular'),
                                badgeNew: t('badge.new'),
                                badgeCrown: t('badge.crown'),
                              }}
                            />
                          </div>
                        )}
                      </Card.Content>
                    </Card>
                  </div>
                </Cell>
              </Layout>
            )}

            {dashboardTab === 'planSettings' && (
              <Layout>
                <Cell span={12}>
                  <Card>
                    <Card.Header title={t('plansCard.title')} subtitle={t('plansCard.subtitle')} />
                    <Card.Divider />
                    <Card.Content>
                      {plansLoading ? (
                        <Skeleton height={200} />
                      ) : marketPlans.length === 0 ? (
                        <Text secondary>{t('plansCard.noPlans')}</Text>
                      ) : (
                        <Layout>
                          {marketPlans.map((mp, idx) => {
                            const price = formatMonthlyPrice(mp, currencySymbol);
                            const isCurrent =
                              mp.name.toLowerCase() === currentPlanName.toLowerCase();
                            const planPrice = extractMonthlyPriceNumber(mp);
                            const isDowngrade = !isCurrent && planPrice < activePrice && activePrice > 0;
                            const isUpgrade = !isCurrent && planPrice > activePrice;
                            const popular = idx === 1;

                            return (
                              <Cell span={4} key={mp.vendorId || mp.name}>
                                <div
                                  style={{
                                    opacity: isDowngrade ? 0.55 : 1,
                                    background: isDowngrade ? '#F7F8FA' : undefined,
                                    borderRadius: 12,
                                    padding: 4,
                                  }}
                                >
                                  <Card>
                                    <Card.Header
                                      title={mp.name}
                                      suffix={
                                        isCurrent ? (
                                          <Badge skin="neutralSuccess">{t('plansCard.current')}</Badge>
                                        ) : popular ? (
                                          <Badge skin="premium">{t('plansCard.mostPopular')}</Badge>
                                        ) : undefined
                                      }
                                    />
                                    <Card.Divider />
                                    <Card.Content>
                                      <Heading size="medium">{price}</Heading>
                                      <Text size="small" secondary>
                                        {t('plansCard.perMonth')}
                                      </Text>
                                      <Box marginTop="SP3" direction="vertical" gap="SP1">
                                        {mp.benefits.slice(0, 4).map((b) => (
                                          <Text key={b} size="tiny">
                                            {'\u2713'} {b}
                                          </Text>
                                        ))}
                                      </Box>
                                      <Box marginTop="SP4">
                                        {isCurrent ? (
                                          <Button disabled fullWidth>
                                            {t('plansCard.currentPlan')}
                                          </Button>
                                        ) : isDowngrade ? (
                                          <Tooltip content={t('plansCard.downgradeTooltip')}>
                                            <Button disabled fullWidth>
                                              {t('plansCard.included')}
                                            </Button>
                                          </Tooltip>
                                        ) : isUpgrade ? (
                                          <Button
                                            as="a"
                                            href={upgradeUrl}
                                            target="_blank"
                                            fullWidth
                                          >
                                            {t('plansCard.getPlan', { name: mp.name })}
                                          </Button>
                                        ) : (
                                          <Button
                                            as="a"
                                            href={upgradeUrl}
                                            target="_blank"
                                            fullWidth
                                          >
                                            {t('plansCard.getPlan', { name: mp.name })}
                                          </Button>
                                        )}
                                      </Box>
                                    </Card.Content>
                                  </Card>
                                </div>
                              </Cell>
                            );
                          })}
                        </Layout>
                      )}
                    </Card.Content>
                  </Card>
                </Cell>
              </Layout>
            )}

            {dashboardTab === 'howToUse' && (
              <Layout>
                <Cell span={12}>
                  <Card>
                    <Card.Header title={t('howTo.title')} />
                    <Card.Divider />
                    <Card.Content>
                      <Layout>
                        {[1, 2, 3, 4].map((n) => (
                          <Cell span={6} key={n}>
                            <Box direction="vertical" gap="SP1">
                              <Text weight="bold">
                                {n}. {t(`howTo.step${n}`)}
                              </Text>
                              <Text size="small" secondary>
                                {t(`howTo.step${n}Desc`)}
                              </Text>
                            </Box>
                          </Cell>
                        ))}
                      </Layout>
                    </Card.Content>
                  </Card>
                </Cell>
                <Cell span={12}>
                  <Card>
                    <Card.Header title={t('faq.title')} />
                    <Card.Divider />
                    <Card.Content>
                      <Accordion
                        multiple
                        size="small"
                        items={Array.from({ length: 6 }, (_, i) => ({
                          title: t(`faq.q${i + 1}`),
                          children: (
                            <Text size="small" secondary>
                              {t(`faq.a${i + 1}`)}
                            </Text>
                          ),
                        }))}
                      />
                    </Card.Content>
                  </Card>
                </Cell>
                <Cell span={12}>
                  <Card>
                    <Card.Content>
                      <Box direction="horizontal" verticalAlign="middle">
                        <Box direction="vertical" gap="SP1" flex="1">
                          <Text weight="bold">{t('help.title')}</Text>
                          <Text size="small" secondary>
                            {t('help.subtitle')}
                          </Text>
                        </Box>
                        <Button
                          as="a"
                          href={`mailto:${SUPPORT_EMAIL}`}
                          prefixIcon={<Icons.Email />}
                        >
                          {t('help.contact')}
                        </Button>
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
      </ErrorBoundary>
    </WixDesignSystemProvider>
  );
};

export default withIntlProvider(DashboardPage);
