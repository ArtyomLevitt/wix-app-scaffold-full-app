import React, {
  type FC,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  Accordion,
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
  SectionHelper,
  Tabs,
  Text,
  ToggleSwitch,
  WixDesignSystemProvider,
} from '@wix/design-system';
import '@wix/design-system/styles.global.css';
import * as Icons from '@wix/wix-ui-icons-common';
import { dashboard } from '@wix/dashboard';
import { httpClient } from '@wix/essentials';
import { useIntl } from 'react-intl';
import {
  APP_ID,
  ALL_THEMES,
  BASIC_THEMES,
  LS_CELEBRATION,
  LS_ONBOARDING,
  LS_REVIEW,
  REVIEW_URL,
  SUPPORT_EMAIL,
} from '../../../_shared/app-config';
import {
  DEFAULT_SETTINGS,
  type AppSettings,
  type ThemeName,
} from '../../../_shared/app-settings-types';
import { ErrorBoundary } from '../../../_shared/error-boundary';
import type { PricingPlanRecord, PlanBadge, CtaMode } from '../../../_shared/pricing-plans-types';
import { withIntlProvider } from '../../../../intl/withIntlProvider';
import { ensureRatePopupRegistered, openRatePopup } from '../../../../dashboard/_shared/rate-popup';
import { StatCard } from './components/StatCard';
import { MoreAppsCard } from './components/MoreAppsCard';
import { LivePreview } from './components/LivePreview';

type DashboardTab = 'manage' | 'planSettings' | 'howToUse';

interface PremiumInfo {
  isPremium: boolean;
  planStatus: string;
  packageName?: string;
  instanceId?: string;
  maxPlans: number;
}

interface AppPlan {
  vendorId: string;
  name: string;
  benefits: string[];
  prices: Array<{ price: string; cycleType: string }>;
}

function extractMonthlyPriceNumber(plan: AppPlan): number {
  const monthly = plan.prices.find((p) => p.cycleType === 'MONTHLY' || p.cycleType === 'MONTH');
  const yearly = plan.prices.find((p) => p.cycleType === 'YEARLY' || p.cycleType === 'YEAR');
  const pick = monthly ?? yearly ?? plan.prices[0];
  if (!pick) return 0;
  const n = parseFloat(pick.price);
  if (yearly && !monthly && !isNaN(n)) return n * 12;
  return isNaN(n) ? 0 : n;
}

function formatMonthlyPrice(plan: AppPlan, symbol: string): string {
  const monthly = plan.prices.find((p) => p.cycleType === 'MONTHLY');
  const yearly = plan.prices.find((p) => p.cycleType === 'YEARLY');
  if (monthly) return `${symbol}${monthly.price}/mo`;
  if (yearly) {
    const n = parseFloat(yearly.price);
    if (!isNaN(n)) return `${symbol}${(n * 12).toFixed(2)}/yr`;
  }
  const first = plan.prices[0];
  return first ? `${symbol}${first.price}` : `${symbol}0`;
}

const DashboardPage: FC = () => {
  const intl = useIntl();
  const t = useCallback(
    (id: string, values?: Record<string, string | number>) =>
      intl.formatMessage({ id }, values),
    [intl],
  );

  const [activeTab, setActiveTab] = useState<DashboardTab>('manage');
  const [planLoading, setPlanLoading] = useState(true);
  const [premium, setPremium] = useState<PremiumInfo>({
    isPremium: false,
    planStatus: 'free',
    maxPlans: 3,
  });
  const [marketPlans, setMarketPlans] = useState<AppPlan[]>([]);
  const [currencySymbol, setCurrencySymbol] = useState('$');
  const [plansLoading, setPlansLoading] = useState(true);
  const [plans, setPlans] = useState<PricingPlanRecord[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [wixSitePlans, setWixSitePlans] = useState<Array<{ id: string; name: string }>>([]);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [onboardingDismissed, setOnboardingDismissed] = useState(() => {
    try {
      return localStorage.getItem(LS_ONBOARDING) === '1';
    } catch {
      return false;
    }
  });

  const upgradeUrl = useMemo(
    () =>
      premium.instanceId
        ? `https://www.wix.com/apps/upgrade/${APP_ID}?appInstanceId=${premium.instanceId}`
        : `https://www.wix.com/apps/upgrade/${APP_ID}`,
    [premium.instanceId],
  );

  const selectedPlan = plans.find((p) => p._id === selectedPlanId) ?? plans[0] ?? null;
  const isFirstTime = !plansLoading && plans.length === 0;
  const showOnboarding = isFirstTime && !onboardingDismissed;
  const currentPlanName = (premium.packageName ?? 'free').toLowerCase();
  const activePrice = useMemo(() => {
    const active = marketPlans.find(
      (p) => p.name.toLowerCase() === currentPlanName || p.vendorId === premium.packageName,
    );
    return active ? extractMonthlyPriceNumber(active) : 0;
  }, [marketPlans, currentPlanName, premium.packageName]);

  const loadAll = useCallback(async () => {
    setPlansLoading(true);
    try {
      const [premiumRes, plansRes, settingsRes, marketRes, wixPlansRes] = await Promise.all([
        httpClient.fetchWithAuth('/api/app/check-premium'),
        httpClient.fetchWithAuth('/api/plans'),
        httpClient.fetchWithAuth('/api/settings'),
        httpClient.fetchWithAuth('/api/app/plans'),
        httpClient.fetchWithAuth('/api/wix-pricing-plans'),
      ]);
      const premiumJson = (await premiumRes.json()) as PremiumInfo;
      setPremium(premiumJson);
      const plansJson = (await plansRes.json()) as { plans: PricingPlanRecord[] };
      setPlans(plansJson.plans ?? []);
      if (plansJson.plans?.[0]?._id) setSelectedPlanId(plansJson.plans[0]._id!);
      const settingsJson = (await settingsRes.json()) as { settings: AppSettings };
      setSettings(settingsJson.settings ?? DEFAULT_SETTINGS);
      const marketJson = (await marketRes.json()) as {
        plans: AppPlan[];
        currencySymbol: string;
      };
      setMarketPlans(marketJson.plans ?? []);
      setCurrencySymbol(marketJson.currencySymbol || '$');
      const wixJson = (await wixPlansRes.json()) as { plans: Array<{ id: string; name: string }> };
      setWixSitePlans(wixJson.plans ?? []);
    } catch (e) {
      console.error('[dashboard load]', e);
    } finally {
      setPlansLoading(false);
      setPlanLoading(false);
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
      openRatePopup(REVIEW_URL);
    } catch {
      window.open(REVIEW_URL, '_blank', 'noopener,noreferrer');
    }
  }, []);

  const triggerCelebrationOnce = useCallback(() => {
    try {
      if (localStorage.getItem(LS_CELEBRATION)) return;
      localStorage.setItem(LS_CELEBRATION, '1');
      dashboard.showToast({ message: t('celebration.message'), type: 'success' });
      setTimeout(triggerReviewOnce, 1500);
    } catch {
      triggerReviewOnce();
    }
  }, [t, triggerReviewOnce]);

  const saveSettings = useCallback(
    async (patch: Partial<AppSettings>, trackFirst = false) => {
      setSaving(true);
      try {
        const res = await httpClient.fetchWithAuth('/api/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(patch),
        });
        const json = (await res.json()) as { settings: AppSettings };
        setSettings(json.settings);
        setLastSaved(new Date());
        dashboard.showToast({ message: t('toast.saved'), type: 'success' });
        if (trackFirst) {
          await httpClient.fetchWithAuth('/api/app/track-setup-completed', { method: 'POST' });
          triggerCelebrationOnce();
        }
      } catch (e) {
        console.error('[save settings]', e);
        dashboard.showToast({ message: t('toast.saveFailed'), type: 'error' });
      } finally {
        setSaving(false);
      }
    },
    [t, triggerCelebrationOnce],
  );

  const savePlan = useCallback(
    async (plan: PricingPlanRecord, isNew = false) => {
      setSaving(true);
      try {
        const isFirst = plans.length === 0 && isNew;
        const url = isNew ? '/api/plans' : `/api/plans/${plan._id}`;
        const method = isNew ? 'POST' : 'PATCH';
        const res = await httpClient.fetchWithAuth(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(plan),
        });
        if (!res.ok) {
          const err = (await res.json()) as { error?: string };
          if (err.error === 'plan-limit-reached') {
            dashboard.showToast({ message: t('plans.limitReached'), type: 'warning' });
            return;
          }
          throw new Error(err.error);
        }
        const json = (await res.json()) as { plan: PricingPlanRecord };
        if (isNew) {
          setPlans((prev) => [...prev, json.plan]);
          setSelectedPlanId(json.plan._id ?? null);
        } else {
          setPlans((prev) => prev.map((p) => (p._id === json.plan._id ? json.plan : p)));
        }
        setLastSaved(new Date());
        dashboard.showToast({ message: t('toast.saved'), type: 'success' });
        if (isFirst) {
          await httpClient.fetchWithAuth('/api/app/track-setup-completed', { method: 'POST' });
          triggerCelebrationOnce();
        }
      } catch (e) {
        console.error('[save plan]', e);
        dashboard.showToast({ message: t('toast.saveFailed'), type: 'error' });
      } finally {
        setSaving(false);
      }
    },
    [plans.length, t, triggerCelebrationOnce],
  );

  const addPlan = async () => {
    if (plans.length >= premium.maxPlans) {
      dashboard.showToast({ message: t('plans.limitReached'), type: 'warning' });
      return;
    }
    await savePlan(
      {
        name: t('plans.newPlanName'),
        price: '$19',
        period: 'monthly',
        tagline: '',
        featuresJson: [{ label: t('plans.defaultFeature'), included: true }],
        badge: '',
        ctaMode: 'wix_plan',
        ctaLabel: t('plans.defaultCta'),
        ctaTarget: '',
        wixPricingPlanId: '',
        sortOrder: plans.length,
        isHighlighted: false,
      },
      true,
    );
  };

  const deletePlan = async (id: string) => {
    try {
      await httpClient.fetchWithAuth(`/api/plans/${id}`, { method: 'DELETE' });
      setPlans((prev) => prev.filter((p) => p._id !== id));
      dashboard.showToast({ message: t('toast.deleted'), type: 'success' });
    } catch (e) {
      dashboard.showToast({ message: t('toast.saveFailed'), type: 'error' });
    }
  };

  const movePlan = async (id: string, direction: -1 | 1) => {
    const idx = plans.findIndex((p) => p._id === id);
    const nextIdx = idx + direction;
    if (idx < 0 || nextIdx < 0 || nextIdx >= plans.length) return;
    const reordered = [...plans];
    const [item] = reordered.splice(idx, 1);
    reordered.splice(nextIdx, 0, item);
    setPlans(reordered);
    try {
      const res = await httpClient.fetchWithAuth('/api/plans/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: reordered.map((p) => p._id).filter(Boolean) }),
      });
      const json = (await res.json()) as { plans: PricingPlanRecord[] };
      setPlans(json.plans);
    } catch (e) {
      loadAll();
    }
  };

  const updateSelected = (patch: Partial<PricingPlanRecord>) => {
    if (!selectedPlan?._id) return;
    setPlans((prev) =>
      prev.map((p) => (p._id === selectedPlan._id ? { ...p, ...patch } : p)),
    );
  };

  const themeOptions = (premium.isPremium ? ALL_THEMES : BASIC_THEMES).map((value) => ({
    id: value,
    value: t(`settings.theme.${value}`),
  }));

  if (planLoading) {
    return (
      <Page>
        <Page.Content>
          <Box align="center" padding="60px">
            <Loader />
          </Box>
        </Page.Content>
      </Page>
    );
  }

  return (
    <WixDesignSystemProvider features={{ newColorsBranding: true }}>
      <ErrorBoundary surface="dashboard">
        <Page>
          <Page.Header
            subtitle={t('page.subtitle')}
            actionsBar={
              !premium.isPremium ? (
                <Button
                  skin="premium"
                  prefixIcon={<Icons.PremiumFilled />}
                  as="a"
                  href={upgradeUrl}
                  target="_blank"
                >
                  {t('button.upgrade')}
                </Button>
              ) : undefined
            }
          />
          <Page.Content>
            <Box marginBottom="24px">
              <Tabs
                activeId={activeTab}
                items={[
                  { id: 'manage', title: t('tab.manage') },
                  { id: 'planSettings', title: t('tab.planSettings') },
                  { id: 'howToUse', title: t('tab.howToUse') },
                ]}
                onClick={(item) => setActiveTab(item.id as DashboardTab)}
              />
            </Box>

            {activeTab === 'manage' && (
              <Layout>
                {showOnboarding && (
                  <Cell span={12}>
                    <Card>
                      <Card.Header title={t(`onboarding.slide${onboardingStep}.title`)} />
                      <Card.Content>
                        <Text>{t(`onboarding.slide${onboardingStep}.desc`)}</Text>
                        <Box marginTop="SP4" gap="SP2">
                          {onboardingStep > 0 && (
                            <Button priority="secondary" onClick={() => setOnboardingStep((s) => s - 1)}>
                              {t('button.back')}
                            </Button>
                          )}
                          {onboardingStep < 3 ? (
                            <Button onClick={() => setOnboardingStep((s) => s + 1)}>{t('button.next')}</Button>
                          ) : (
                            <Button
                              onClick={() => {
                                localStorage.setItem(LS_ONBOARDING, '1');
                                setOnboardingDismissed(true);
                              }}
                            >
                              {t('button.getStarted')}
                            </Button>
                          )}
                          <Button
                            priority="secondary"
                            onClick={() => {
                              localStorage.setItem(LS_ONBOARDING, '1');
                              setOnboardingDismissed(true);
                            }}
                          >
                            {t('button.skipToDashboard')}
                          </Button>
                        </Box>
                      </Card.Content>
                    </Card>
                  </Cell>
                )}

                <Cell span={12}>
                  <Layout gap="18px">
                    <Cell span={3}>
                      <StatCard
                        icon={<Icons.CreditCard style={{ color: '#3B6AEA' }} />}
                        iconBg="linear-gradient(135deg, #EDF3FF 0%, #D6E4FF 100%)"
                        label={t('stats.plans.label')}
                        value={`${plans.length}/${premium.maxPlans === Infinity ? '∞' : premium.maxPlans}`}
                        loading={plansLoading}
                      />
                    </Cell>
                    <Cell span={3}>
                      <StatCard
                        icon={<Icons.ColorDrop style={{ color: '#059669' }} />}
                        iconBg="linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)"
                        label={t('stats.theme.label')}
                        value={t(`settings.theme.${settings.theme}`)}
                      />
                    </Cell>
                    <Cell span={3}>
                      <StatCard
                        icon={<Icons.Premium style={{ color: '#D97706' }} />}
                        iconBg="linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)"
                        label={t('stats.plan.label')}
                        value={premium.packageName ?? t('badge.free')}
                        highlight={premium.isPremium}
                        badge={
                          premium.isPremium
                            ? { text: t('badge.premium'), skin: 'premium' }
                            : { text: t('badge.free'), skin: 'neutralStandard' }
                        }
                      />
                    </Cell>
                    <Cell span={3}>
                      <StatCard
                        icon={<Icons.Check style={{ color: '#7C3AED' }} />}
                        iconBg="linear-gradient(135deg, #F3E8FF 0%, #EDE9FE 100%)"
                        label={t('stats.highlight.label')}
                        value={plans.filter((p) => p.isHighlighted).length}
                      />
                    </Cell>
                  </Layout>
                </Cell>

                {!premium.isPremium && plans.length >= premium.maxPlans && (
                  <Cell span={12}>
                    <SectionHelper appearance="warning" title={t('plans.limitTitle')}>
                      {t('plans.limitDesc')}
                      <Box marginTop="SP2">
                        <Button skin="premium" as="a" href={upgradeUrl} target="_blank">
                          {t('button.upgrade')}
                        </Button>
                      </Box>
                    </SectionHelper>
                  </Cell>
                )}

                <Cell span={6}>
                  <Card>
                    <Card.Header
                      title={t('plans.editorTitle')}
                      suffix={
                        <Button size="small" prefixIcon={<Icons.Add />} onClick={addPlan}>
                          {t('plans.addPlan')}
                        </Button>
                      }
                    />
                    <Card.Content>
                      {plansLoading ? (
                        <Loader />
                      ) : plans.length === 0 ? (
                        <Text secondary>{t('widget.emptyState')}</Text>
                      ) : (
                        <Box direction="vertical" gap="SP3">
                          {plans.map((plan, index) => (
                            <Box
                              key={plan._id}
                              direction="horizontal"
                              verticalAlign="middle"
                              gap="SP2"
                              padding="SP2"
                              backgroundColor={selectedPlan?._id === plan._id ? '#F3E8FF' : undefined}
                              borderRadius="6px"
                            >
                              <Box direction="vertical" gap="SP1">
                                <Button size="tiny" priority="secondary" onClick={() => movePlan(plan._id!, -1)} disabled={index === 0}>
                                  ↑
                                </Button>
                                <Button size="tiny" priority="secondary" onClick={() => movePlan(plan._id!, 1)} disabled={index === plans.length - 1}>
                                  ↓
                                </Button>
                              </Box>
                              <Box flex="1" direction="vertical" gap="SP1">
                                <Text weight="bold">{plan.name || t('plans.untitled')}</Text>
                                <Text size="tiny" secondary>{plan.price}</Text>
                              </Box>
                              <Button size="small" onClick={() => setSelectedPlanId(plan._id ?? null)}>
                                {t('button.edit')}
                              </Button>
                              <Button size="small" skin="destructive" onClick={() => deletePlan(plan._id!)}>
                                {t('button.delete')}
                              </Button>
                            </Box>
                          ))}
                        </Box>
                      )}

                      {selectedPlan && (
                        <Box marginTop="SP4" direction="vertical" gap="SP3">
                          <Heading size="small">{t('plans.editPlan')}</Heading>
                          <FormField label={t('plans.field.name')}>
                            <Input value={selectedPlan.name} onChange={(e) => updateSelected({ name: e.target.value })} />
                          </FormField>
                          <FormField label={t('plans.field.price')}>
                            <Input value={selectedPlan.price} onChange={(e) => updateSelected({ price: e.target.value })} />
                          </FormField>
                          <FormField label={t('plans.field.period')}>
                            <Dropdown
                              options={[
                                { id: 'monthly', value: t('plans.period.monthly') },
                                { id: 'annual', value: t('plans.period.annual') },
                                { id: 'one-time', value: t('plans.period.oneTime') },
                              ]}
                              selectedId={selectedPlan.period}
                              onSelect={(opt) => updateSelected({ period: opt.id as PricingPlanRecord['period'] })}
                            />
                          </FormField>
                          <FormField label={t('plans.field.tagline')}>
                            <Input value={selectedPlan.tagline} onChange={(e) => updateSelected({ tagline: e.target.value })} />
                          </FormField>
                          <FormField label={t('plans.field.badge')}>
                            <Dropdown
                              disabled={!premium.isPremium}
                              options={[
                                { id: '', value: t('plans.badge.none') },
                                { id: 'most_popular', value: t('plans.badge.mostPopular') },
                                { id: 'new', value: t('plans.badge.new') },
                                { id: 'crown', value: t('plans.badge.crown') },
                              ]}
                              selectedId={selectedPlan.badge || ''}
                              onSelect={(opt) => updateSelected({ badge: opt.id as PlanBadge })}
                            />
                            {!premium.isPremium && (
                              <Text size="tiny" secondary>{t('plans.badge.premiumOnly')}</Text>
                            )}
                          </FormField>
                          <FormField label={t('plans.field.ctaMode')}>
                            <Dropdown
                              options={[
                                { id: 'wix_plan', value: t('plans.cta.wixPlan') },
                                { id: 'custom_url', value: t('plans.cta.customUrl') },
                                { id: 'contact_us', value: t('plans.cta.contact') },
                              ]}
                              selectedId={selectedPlan.ctaMode}
                              onSelect={(opt) => updateSelected({ ctaMode: opt.id as CtaMode })}
                            />
                          </FormField>
                          {selectedPlan.ctaMode === 'wix_plan' && (
                            <FormField label={t('plans.field.wixPlan')}>
                              <Dropdown
                                options={[
                                  { id: '', value: t('plans.selectWixPlan') },
                                  ...wixSitePlans.map((p) => ({ id: p.id, value: p.name })),
                                ]}
                                selectedId={selectedPlan.wixPricingPlanId || ''}
                                onSelect={(opt) => updateSelected({ wixPricingPlanId: opt.id as string })}
                              />
                            </FormField>
                          )}
                          {(selectedPlan.ctaMode === 'custom_url' || selectedPlan.ctaMode === 'contact_us') && (
                            <FormField label={t('plans.field.ctaTarget')}>
                              <Input
                                value={selectedPlan.ctaTarget}
                                onChange={(e) => updateSelected({ ctaTarget: e.target.value })}
                              />
                            </FormField>
                          )}
                          <FormField label={t('plans.field.ctaLabel')}>
                            <Input
                              value={selectedPlan.ctaLabel}
                              onChange={(e) => updateSelected({ ctaLabel: e.target.value })}
                            />
                          </FormField>
                          <Checkbox
                            checked={selectedPlan.isHighlighted}
                            onChange={(e) => updateSelected({ isHighlighted: e.target.checked })}
                          >
                            {t('plans.field.highlighted')}
                          </Checkbox>
                          <Button
                            onClick={() => savePlan(selectedPlan)}
                            disabled={saving}
                            prefixIcon={saving ? <Loader size="tiny" /> : undefined}
                          >
                            {saving ? t('button.saving') : t('button.savePlan')}
                          </Button>
                        </Box>
                      )}
                    </Card.Content>
                  </Card>

                  <Box marginTop="SP4">
                    <Card>
                      <Card.Header title={t('settings.designTitle')} />
                      <Card.Content>
                        <Box direction="vertical" gap="SP3">
                          <FormField label={t('settings.theme')}>
                            <Dropdown
                              options={themeOptions}
                              selectedId={settings.theme}
                              onSelect={(opt) => {
                                const theme = opt.id as ThemeName;
                                setSettings((s) => ({ ...s, theme }));
                              }}
                            />
                          </FormField>
                          <FormField label={t('settings.font')}>
                            <Input
                              value={settings.fontFamily}
                              placeholder={t('settings.fontPlaceholder')}
                              onChange={(e) => setSettings((s) => ({ ...s, fontFamily: e.target.value }))}
                            />
                          </FormField>
                          <FormField label={t('settings.highlightColor')}>
                            <Input
                              value={settings.highlightColor}
                              onChange={(e) => setSettings((s) => ({ ...s, highlightColor: e.target.value }))}
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
                                setSettings((s) => ({ ...s, cardStyle: opt.id as AppSettings['cardStyle'] }))
                              }
                            />
                          </FormField>
                          <Checkbox
                            checked={settings.showBilledAs}
                            onChange={(e) => setSettings((s) => ({ ...s, showBilledAs: e.target.checked }))}
                          >
                            {t('settings.showBilledAs')}
                          </Checkbox>

                          <Card>
                            <Card.Header
                              title={t('settings.advancedTitle')}
                              suffix={
                                !premium.isPremium ? (
                                  <Button size="tiny" skin="premium" as="a" href={upgradeUrl} target="_blank">
                                    {t('button.upgrade')}
                                  </Button>
                                ) : undefined
                              }
                            />
                            <Card.Content>
                              {!premium.isPremium ? (
                                <Text secondary>{t('settings.advancedLocked')}</Text>
                              ) : (
                                <Box direction="vertical" gap="SP3">
                                  <FormField label={t('settings.borderRadius')}>
                                    <NumberInput
                                      value={settings.advancedDesign.borderRadius}
                                      onChange={(val) =>
                                        setSettings((s) => ({
                                          ...s,
                                          advancedDesign: { ...s.advancedDesign, borderRadius: Number(val) },
                                        }))
                                      }
                                    />
                                  </FormField>
                                  <FormField label={t('settings.shadow')}>
                                    <Dropdown
                                      options={[
                                        { id: 'none', value: 'None' },
                                        { id: 'soft', value: 'Soft' },
                                        { id: 'medium', value: 'Medium' },
                                        { id: 'strong', value: 'Strong' },
                                      ]}
                                      selectedId={settings.advancedDesign.shadowIntensity}
                                      onSelect={(opt) =>
                                        setSettings((s) => ({
                                          ...s,
                                          advancedDesign: {
                                            ...s.advancedDesign,
                                            shadowIntensity: opt.id as AppSettings['advancedDesign']['shadowIntensity'],
                                          },
                                        }))
                                      }
                                    />
                                  </FormField>
                                  <FormField label={t('settings.buttonShape')}>
                                    <Dropdown
                                      options={[
                                        { id: 'rounded', value: 'Rounded' },
                                        { id: 'pill', value: 'Pill' },
                                        { id: 'square', value: 'Square' },
                                      ]}
                                      selectedId={settings.advancedDesign.buttonShape}
                                      onSelect={(opt) =>
                                        setSettings((s) => ({
                                          ...s,
                                          advancedDesign: {
                                            ...s.advancedDesign,
                                            buttonShape: opt.id as AppSettings['advancedDesign']['buttonShape'],
                                          },
                                        }))
                                      }
                                    />
                                  </FormField>
                                </Box>
                              )}
                            </Card.Content>
                          </Card>

                          <Box gap="SP2">
                            <Button
                              onClick={() => saveSettings(settings, plans.length > 0)}
                              disabled={saving}
                            >
                              {saving ? t('button.saving') : t('button.saveSettings')}
                            </Button>
                            {lastSaved && (
                              <Text size="tiny" secondary>
                                {t('settings.lastSaved', {
                                  time: lastSaved.toLocaleTimeString(),
                                })}
                              </Text>
                            )}
                          </Box>
                        </Box>
                      </Card.Content>
                    </Card>
                  </Box>
                </Cell>

                <Cell span={6}>
                  <Card>
                    <Card.Header title={t('preview.title')} />
                    <Card.Content>
                      <LivePreview
                        plans={plans}
                        settings={settings}
                        isPremium={premium.isPremium}
                        previewMode={previewMode}
                        onPreviewModeChange={setPreviewMode}
                      />
                    </Card.Content>
                  </Card>
                </Cell>

                <Cell span={12}>
                  <MoreAppsCard />
                </Cell>

                <Cell span={12}>
                  <Text size="tiny" secondary>
                    {t('support.footer', { email: SUPPORT_EMAIL })}
                  </Text>
                </Cell>
              </Layout>
            )}

            {activeTab === 'planSettings' && (
              <Layout>
                <Cell span={12}>
                  <Card>
                    <Card.Header title={t('pricing.title')} subtitle={t('pricing.subtitle')} />
                    <Card.Content>
                      {plansLoading ? (
                        <Loader />
                      ) : (
                        <Layout gap="18px">
                          {marketPlans.map((plan) => {
                            const isCurrent =
                              plan.name.toLowerCase() === currentPlanName ||
                              plan.vendorId === premium.packageName;
                            const planPrice = extractMonthlyPriceNumber(plan);
                            const isDowngrade = !isCurrent && activePrice > 0 && planPrice < activePrice;
                            const isUpgrade = !isCurrent && planPrice > activePrice;
                            const dimmed = isDowngrade;
                            return (
                              <Cell span={6} key={plan.vendorId}>
                                <div style={{ opacity: dimmed ? 0.55 : 1, background: dimmed ? '#F7F8FA' : undefined, borderRadius: 12, padding: 4 }}>
                                  <Card>
                                    <Card.Content>
                                      <Box direction="vertical" gap="SP2">
                                        <Box direction="horizontal" verticalAlign="middle" gap="SP2">
                                          <Text weight="bold">{plan.name}</Text>
                                          {plan.name.toLowerCase().includes('standard') && (
                                            <Text size="tiny" skin="premium">{t('pricing.mostPopular')}</Text>
                                          )}
                                          {isCurrent && (
                                            <Text size="tiny" secondary>{t('pricing.currentPlan')}</Text>
                                          )}
                                        </Box>
                                        <Text size="medium" weight="bold">
                                          {formatMonthlyPrice(plan, currencySymbol)}
                                        </Text>
                                        <ul style={{ margin: 0, paddingLeft: 18 }}>
                                          {plan.benefits.slice(0, 4).map((b) => (
                                            <li key={b}><Text size="small">{b}</Text></li>
                                          ))}
                                        </ul>
                                        {isCurrent ? (
                                          <Button disabled>{t('pricing.currentPlan')}</Button>
                                        ) : isDowngrade ? (
                                          <Button disabled>{t('pricing.includedInPlan')}</Button>
                                        ) : isUpgrade ? (
                                          <Button as="a" href={upgradeUrl} target="_blank" skin="premium">
                                            {t('pricing.getPlan', { plan: plan.name })}
                                          </Button>
                                        ) : (
                                          <Button as="a" href={upgradeUrl} target="_blank">
                                            {t('pricing.getPlan', { plan: plan.name })}
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

            {activeTab === 'howToUse' && (
              <Layout>
                <Cell span={12}>
                  <Card>
                    <Card.Header title={t('howTo.stepsTitle')} />
                    <Card.Content>
                      <Box direction="vertical" gap="SP3">
                        {[1, 2, 3, 4].map((step) => (
                          <Box key={step} direction="horizontal" gap="SP3" verticalAlign="top">
                            <Text weight="bold">{step}.</Text>
                            <Box direction="vertical" gap="SP1">
                              <Text weight="bold">{t(`howTo.step${step}.title`)}</Text>
                              <Text size="small" secondary>{t(`howTo.step${step}.desc`)}</Text>
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
                      <Box direction="horizontal" verticalAlign="middle" gap="SP4">
                        <Box direction="vertical" gap="SP1" flex="1">
                          <Text weight="bold">{t('help.title')}</Text>
                          <Text size="small" secondary>{t('help.subtitle')}</Text>
                        </Box>
                        <Button as="a" href={`mailto:${SUPPORT_EMAIL}`}>
                          {t('help.contact')}
                        </Button>
                      </Box>
                    </Card.Content>
                  </Card>
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
