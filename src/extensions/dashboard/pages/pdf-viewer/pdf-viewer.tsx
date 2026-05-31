import React, {
  type FC,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  Accordion,
  Badge,
  Box,
  Button,
  Card,
  Cell,
  ColorPicker,
  Divider,
  EmptyState,
  FormField,
  Input,
  Layout,
  Loader,
  Page,
  SegmentedToggle,
  Slider,
  Tabs,
  Text,
  ToggleSwitch,
  Tooltip,
  WixDesignSystemProvider,
} from '@wix/design-system';
import '@wix/design-system/styles.global.css';
import * as Icons from '@wix/wix-ui-icons-common';
import { dashboard } from '@wix/dashboard';
import { httpClient } from '@wix/essentials';
import { useIntl } from 'react-intl';

import {
  APP_ID,
  APP_SLUG,
  FREE_PAGE_LIMIT,
  LS_LAST_SAVED,
  LS_ONBOARDING,
  LS_REVIEW,
  REVIEW_URL,
} from '../../../_shared/app-config';
import { PdfViewerCore } from '../../../_shared/pdf-viewer-core';
import {
  mapValidationToConnectionStatus,
  validatePdfUrl,
  type UrlReachabilityStatus,
} from '../../../_shared/pdf-url';
import {
  DEFAULT_SETTINGS,
  type FitMode,
  type PageLayout,
  type ThemeMode,
  type WidgetSettings,
} from '../../../_shared/widget-settings-types';
import { ensureRatePopupRegistered, openRatePopup } from '../../../../dashboard/_shared/rate-popup';
import { withIntlProvider } from '../../../../intl/withIntlProvider';
import { ErrorBoundary } from './components/ErrorBoundary';
import { MoreAppsCard } from './components/MoreAppsCard';
import { StatCard } from './components/StatCard';

type DashboardTab = 'manage' | 'planSettings' | 'howToUse';
type PreviewDevice = 'desktop' | 'mobile';

interface PremiumInfo {
  isPremium: boolean;
  planStatus: 'premium' | 'cancelled' | 'free';
  packageName?: string;
  instanceId?: string;
  metaSiteId?: string;
  siteUrl?: string;
}

interface AppPlan {
  vendorId: string;
  name: string;
  benefits: string[];
  prices: Array<{ price: string; cycleType: string }>;
}

interface PricingTier {
  name: string;
  monthlyPrice: string;
  yearlyPrice: string | null;
  monthlyNum: number;
  features: string[];
  popular: boolean;
}

function extractMonthlyPriceNumber(plan: AppPlan): number {
  const monthly = plan.prices.find((p) => p.cycleType === 'MONTHLY');
  if (!monthly) return 0;
  const n = parseFloat(monthly.price);
  return Number.isFinite(n) ? n : 0;
}

function formatMonthlyPrice(plan: AppPlan, sym: string): string {
  const monthly = plan.prices.find((p) => p.cycleType === 'MONTHLY');
  if (!monthly || parseFloat(monthly.price) === 0) return `${sym}0`;
  return `${sym}${monthly.price}`;
}

function formatYearlyPrice(plan: AppPlan, sym: string): string | null {
  const yearly = plan.prices.find((p) => p.cycleType === 'YEARLY');
  if (!yearly) return null;
  const n = parseFloat(yearly.price);
  if (!Number.isFinite(n) || n <= 0) return null;
  const annual = n * 12;
  return `${sym}${annual.toFixed(2)}`;
}

function buildFallbackPlans(sym = '$'): PricingTier[] {
  return [
    {
      name: 'Free',
      monthlyPrice: `${sym}0`,
      yearlyPrice: null,
      monthlyNum: 0,
      features: [
        'pricing.featureWidget',
        'pricing.featurePreview5',
        'pricing.featureToolbar',
        'pricing.featureWatermark',
      ],
      popular: false,
    },
    {
      name: 'Premium',
      monthlyPrice: `${sym}3.99`,
      yearlyPrice: `${sym}39.90`,
      monthlyNum: 3.99,
      features: [
        'pricing.featureEverythingFree',
        'pricing.featureAllPages',
        'pricing.featureNoWatermark',
        'pricing.featureDownload',
        'pricing.featureTheme',
        'pricing.featureSupport',
      ],
      popular: true,
    },
  ];
}

function apiPlanToTier(plan: AppPlan, sym: string): PricingTier {
  return {
    name: plan.name,
    monthlyPrice: formatMonthlyPrice(plan, sym),
    yearlyPrice: formatYearlyPrice(plan, sym),
    monthlyNum: extractMonthlyPriceNumber(plan),
    features: plan.benefits.length > 0 ? plan.benefits : ['pricing.featureWidget'],
    popular: plan.name.toLowerCase().includes('premium'),
  };
}

const connectionBadgeSkin = (
  status: UrlReachabilityStatus,
): 'neutralSuccess' | 'warning' | 'danger' | 'neutralStandard' => {
  if (status === 'reachable' || status === 'valid') return 'neutralSuccess';
  if (status === 'unknown') return 'neutralStandard';
  if (status === 'unreachable') return 'warning';
  return 'danger';
};

const DashboardPage: FC = () => {
  const intl = useIntl();
  const t = useCallback(
    (id: string, values?: Record<string, string | number>) =>
      intl.formatMessage({ id }, values),
    [intl],
  );

  const [activeTab, setActiveTab] = useState<DashboardTab>('manage');
  const [previewDevice, setPreviewDevice] = useState<PreviewDevice>('desktop');

  const [planLoading, setPlanLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [currentPlanName, setCurrentPlanName] = useState('free');
  const [instanceId, setInstanceId] = useState<string | undefined>();
  const [siteId, setSiteId] = useState<string>('');
  const [siteUrl, setSiteUrl] = useState<string>('');
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

  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settings, setSettings] = useState<WidgetSettings>(DEFAULT_SETTINGS);
  const [hasSavedOnce, setHasSavedOnce] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<UrlReachabilityStatus>('unknown');
  const [urlError, setUrlError] = useState('');

  const [plansLoading, setPlansLoading] = useState(true);
  const [pricingTiers, setPricingTiers] = useState<PricingTier[]>(buildFallbackPlans());
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const [onboardingStep, setOnboardingStep] = useState(0);
  const [onboardingDismissed, setOnboardingDismissedRaw] = useState(() => {
    try {
      return localStorage.getItem(LS_ONBOARDING) === '1';
    } catch {
      return false;
    }
  });

  const setOnboardingDismissed = useCallback((val: boolean) => {
    if (val) {
      try {
        localStorage.setItem(LS_ONBOARDING, '1');
      } catch {
        /* ignore */
      }
    }
    setOnboardingDismissedRaw(val);
  }, []);

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

  const upgradeUrl = useMemo(
    () =>
      instanceId
        ? `https://www.wix.com/apps/upgrade/${APP_ID}?appInstanceId=${instanceId}`
        : `https://www.wix.com/apps/upgrade/${APP_ID}`,
    [instanceId],
  );

  const isFirstTime = !settingsLoading && !settings.pdfUrl.trim() && !hasSavedOnce;
  const showOnboarding = isFirstTime && !onboardingDismissed;

  const triggerReviewPopupOnce = useCallback(() => {
    try {
      if (localStorage.getItem(LS_REVIEW)) return;
      localStorage.setItem(LS_REVIEW, '1');
      openRatePopup(REVIEW_URL);
    } catch (e) {
      console.warn('[review] failed to open rate popup', e);
      try {
        window.open(REVIEW_URL, '_blank', 'noopener,noreferrer');
      } catch {
        /* ignore */
      }
    }
  }, []);

  useEffect(() => {
    ensureRatePopupRegistered();
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await httpClient.fetchWithAuth('/api/app/check-premium');
        const data = (await res.json()) as PremiumInfo;
        if (cancelled) return;
        setIsPremium(data.isPremium);
        if (data.packageName) setCurrentPlanName(data.packageName);
        if (data.instanceId) setInstanceId(data.instanceId);
        if (data.metaSiteId) setSiteId(data.metaSiteId);
        if (data.siteUrl) setSiteUrl(data.siteUrl);
      } catch {
        if (!cancelled) {
          setIsPremium(false);
        }
      } finally {
        if (!cancelled) setPlanLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await httpClient.fetchWithAuth('/api/app/plans');
        const data = (await res.json()) as {
          plans: AppPlan[];
          currencySymbol?: string;
        };
        const sym = data.currencySymbol || '$';
        const fromApi = (data.plans ?? []).map((p) => apiPlanToTier(p, sym));
        if (!cancelled) {
          setPricingTiers(fromApi.length > 0 ? fromApi : buildFallbackPlans(sym));
        }
      } catch {
        if (!cancelled) setPricingTiers(buildFallbackPlans('$'));
      } finally {
        if (!cancelled) setPlansLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await httpClient.fetchWithAuth('/api/widget/dashboard-settings');
        const data = (await res.json()) as { settings: WidgetSettings; isPremium?: boolean };
        if (cancelled) return;
        if (data.settings) {
          setSettings(data.settings);
          if (data.settings.pdfUrl?.trim()) setHasSavedOnce(true);
        }
        if (typeof data.isPremium === 'boolean') setIsPremium(data.isPremium);
      } catch (err) {
        console.error('[dashboard] load settings failed:', err);
      } finally {
        if (!cancelled) setSettingsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const updateSetting = useCallback(
    <K extends keyof WidgetSettings>(key: K, value: WidgetSettings[K]) => {
      setSettings((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const handleTestLoad = useCallback(async () => {
    const validation = validatePdfUrl(settings.pdfUrl);
    if (!validation.ok) {
      setUrlError(validation.reason ?? t('settings.pdfUrlError'));
      setConnectionStatus('invalid');
      dashboard.showToast({ message: t('toast.invalidUrl'), type: 'error' });
      return;
    }

    setUrlError('');
    setTesting(true);
    setConnectionStatus('unknown');

    try {
      const res = await httpClient.fetchWithAuth('/api/validate-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: validation.normalized }),
      });
      const data = (await res.json()) as { ok?: boolean; reachable?: boolean; status?: string };
      const reachable = data.reachable === true;
      const status = mapValidationToConnectionStatus(validation, reachable);
      setConnectionStatus(status);
      updateSetting('pdfUrl', validation.normalized);

      if (data.ok !== false) {
        dashboard.showToast({ message: t('toast.testSuccess'), type: 'success' });
      } else {
        dashboard.showToast({ message: t('toast.testFailed'), type: 'warning' });
      }
    } catch (err) {
      console.error('[test-load]', err);
      setConnectionStatus(mapValidationToConnectionStatus(validation, null));
      dashboard.showToast({ message: t('toast.testFailed'), type: 'error' });
    } finally {
      setTesting(false);
    }
  }, [settings.pdfUrl, t, updateSetting]);

  const handleSave = useCallback(async () => {
    const validation = validatePdfUrl(settings.pdfUrl);
    if (settings.pdfUrl.trim() && !validation.ok) {
      setUrlError(validation.reason ?? t('settings.pdfUrlError'));
      dashboard.showToast({ message: t('toast.invalidUrl'), type: 'error' });
      return;
    }

    setSaving(true);
    const wasFirstSave = !hasSavedOnce;

    try {
      const payload: Partial<WidgetSettings> = {
        ...settings,
        pdfUrl: validation.ok ? validation.normalized : settings.pdfUrl,
      };

      const res = await httpClient.fetchWithAuth('/api/widget/dashboard-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errBody = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(errBody.error ?? 'save_failed');
      }

      const data = (await res.json()) as { settings: WidgetSettings; isPremium?: boolean };
      setSettings(data.settings);
      setHasSavedOnce(true);
      if (typeof data.isPremium === 'boolean') setIsPremium(data.isPremium);

      const now = Date.now();
      setLastSavedAt(now);
      try {
        localStorage.setItem(LS_LAST_SAVED, String(now));
      } catch {
        /* ignore */
      }

      dashboard.showToast({ message: t('toast.saved'), type: 'success' });

      try {
        await httpClient.fetchWithAuth('/api/app/track-setup-completed', { method: 'POST' });
      } catch {
        /* ignore tracking errors */
      }

      if (wasFirstSave) {
        triggerReviewPopupOnce();
      }
    } catch (err) {
      console.error('[save]', err);
      dashboard.showToast({ message: t('toast.saveFailed'), type: 'error' });
    } finally {
      setSaving(false);
    }
  }, [hasSavedOnce, settings, t, triggerReviewPopupOnce]);

  const connectionLabel = useMemo(() => {
    switch (connectionStatus) {
      case 'reachable':
        return t('stats.connectionReachable');
      case 'valid':
        return t('stats.connectionValid');
      case 'invalid':
        return t('stats.connectionInvalid');
      case 'unreachable':
        return t('stats.connectionUnreachable');
      default:
        return settings.pdfUrl.trim() ? t('badge.validating') : t('stats.connectionNotSet');
    }
  }, [connectionStatus, settings.pdfUrl, t]);

  const previewLabels = useMemo(
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
    [t],
  );

  const activePrice = useMemo(() => {
    const match = pricingTiers.find(
      (tier) => tier.name.toLowerCase() === currentPlanName.toLowerCase(),
    );
    if (match) return match.monthlyNum;
    return isPremium ? 3.99 : 0;
  }, [currentPlanName, isPremium, pricingTiers]);

  const statGridCols = isPremium
    ? 'repeat(3, minmax(0, 1fr))'
    : 'repeat(4, minmax(0, 1fr))';

  const renderOnboarding = () => (
    <Card>
      <Card.Content>
        <Box direction="vertical" gap="SP4" align="center">
          <div
            style={{
              minHeight: 340,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
            }}
          >
            {onboardingStep === 0 && (
              <Box direction="vertical" gap="SP3" align="center">
                <div
                  style={{
                    width: 120,
                    height: 120,
                    borderRadius: 12,
                    background: 'linear-gradient(135deg, #EDE7F6, #D1C4E9)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icons.Document style={{ color: '#6B21A8', width: 56, height: 56 }} />
                </div>
                <Text size="medium" weight="bold">
                  {t('onboarding.welcome')}
                </Text>
                <Text size="small" secondary style={{ textAlign: 'center', maxWidth: 480 }}>
                  {t('onboarding.welcomeDesc')}
                </Text>
              </Box>
            )}

            {onboardingStep === 1 && (
              <Box direction="vertical" gap="SP3" align="center" width="100%">
                <Text size="medium" weight="bold">
                  {t('onboarding.howItWorks')}
                </Text>
                <Text size="tiny" secondary>
                  {t('onboarding.simpleSteps')}
                </Text>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
                    gap: 12,
                    maxWidth: 760,
                    width: '100%',
                    margin: '0 auto',
                  }}
                >
                  {[
                    { title: t('onboarding.step.addWidget'), desc: t('onboarding.step.addWidgetDesc'), icon: <Icons.Add /> },
                    { title: t('onboarding.step.pasteUrl'), desc: t('onboarding.step.pasteUrlDesc'), icon: <Icons.Link /> },
                    { title: t('onboarding.step.customize'), desc: t('onboarding.step.customizeDesc'), icon: <Icons.Settings /> },
                    { title: t('onboarding.step.publish'), desc: t('onboarding.step.publishDesc'), icon: <Icons.Publish /> },
                  ].map((step) => (
                    <div
                      key={step.title}
                      style={{
                        padding: 12,
                        borderRadius: 8,
                        border: '1px solid #E4E6EB',
                        textAlign: 'center',
                        minWidth: 0,
                      }}
                    >
                      <Box direction="vertical" gap="SP1" align="center">
                        {step.icon}
                        <Text size="tiny" weight="bold">
                          {step.title}
                        </Text>
                        <Text size="tiny" secondary>
                          {step.desc}
                        </Text>
                      </Box>
                    </div>
                  ))}
                </div>
              </Box>
            )}

            {onboardingStep === 2 && (
              <Box direction="vertical" gap="SP3" align="center" width="100%">
                <Text size="medium" weight="bold">
                  {t('onboarding.whatYouGet')}
                </Text>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                    gap: 12,
                    maxWidth: 560,
                    width: '100%',
                  }}
                >
                  {[
                    { title: t('onboarding.feature.flipbook'), desc: t('onboarding.feature.flipbookDesc') },
                    { title: t('onboarding.feature.toolbar'), desc: t('onboarding.feature.toolbarDesc') },
                    { title: t('onboarding.feature.mobile'), desc: t('onboarding.feature.mobileDesc') },
                    { title: t('onboarding.feature.premium'), desc: t('onboarding.feature.premiumDesc') },
                  ].map((f) => (
                    <div
                      key={f.title}
                      style={{
                        padding: 12,
                        borderRadius: 8,
                        background: '#F7F8FA',
                        minWidth: 0,
                      }}
                    >
                      <Text size="small" weight="bold">
                        {f.title}
                      </Text>
                      <Text size="tiny" secondary>
                        {f.desc}
                      </Text>
                    </div>
                  ))}
                </div>
              </Box>
            )}

            {onboardingStep === 3 && (
              <Box direction="vertical" gap="SP3" align="center">
                <Icons.StatusComplete style={{ color: '#27AE60', width: 56, height: 56 }} />
                <Text size="medium" weight="bold">
                  {t('onboarding.allSet')}
                </Text>
                <Text size="small" secondary style={{ textAlign: 'center', maxWidth: 420 }}>
                  {t('onboarding.allSetDesc')}
                </Text>
              </Box>
            )}
          </div>

          <Box direction="horizontal" gap="SP2">
            {onboardingStep > 0 && (
              <Button priority="secondary" onClick={() => setOnboardingStep((s) => s - 1)}>
                {t('button.back')}
              </Button>
            )}
            {onboardingStep < 3 ? (
              <Button onClick={() => setOnboardingStep((s) => s + 1)}>
                {t('button.next')}
              </Button>
            ) : (
              <Button
                onClick={() => {
                  setOnboardingDismissed(true);
                  setActiveTab('manage');
                }}
              >
                {t('onboarding.configureNow')}
              </Button>
            )}
            <Button
              priority="secondary"
              onClick={() => setOnboardingDismissed(true)}
            >
              {t('button.skipToDashboard')}
            </Button>
          </Box>
        </Box>
      </Card.Content>
    </Card>
  );

  const renderManageTab = () => (
    <Box direction="vertical" gap="SP4">
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: statGridCols,
          gap: 16,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <StatCard
            iconBg="linear-gradient(135deg, #DBEAFE, #C3D9F7)"
            icon={<Icons.Link style={{ color: '#1565C0', width: 24, height: 24 }} />}
            label={t('stats.connection')}
            value={connectionLabel}
            badge={{
              text:
                connectionStatus === 'reachable' || connectionStatus === 'valid'
                  ? t('badge.connected')
                  : settings.pdfUrl.trim()
                    ? t('badge.notConnected')
                    : t('badge.notConnected'),
              skin: connectionBadgeSkin(connectionStatus),
            }}
            loading={testing}
          />
        </div>
        <div style={{ minWidth: 0 }}>
          <StatCard
            iconBg="linear-gradient(135deg, #FEF3C7, #FDE68A)"
            icon={<Icons.PremiumFilled style={{ color: '#D97706', width: 24, height: 24 }} />}
            label={t('stats.yourPlan')}
            value={currentPlanName}
            highlight={isPremium}
            badge={{
              text: isPremium ? t('badge.premium') : t('badge.free'),
              skin: isPremium ? 'premium' : 'neutralStandard',
            }}
          />
        </div>
        <div style={{ minWidth: 0 }}>
          <StatCard
            iconBg="linear-gradient(135deg, #D1FAE5, #A7F3D0)"
            icon={<Icons.Document style={{ color: '#059669', width: 24, height: 24 }} />}
            label={t('stats.pageLimit')}
            value={isPremium ? t('stats.pageLimitPremium') : t('stats.pageLimitFree')}
          />
        </div>
        {!isPremium && (
          <div style={{ minWidth: 0 }}>
            <StatCard
              iconBg="linear-gradient(135deg, #FEF9C3, #FDE047)"
              icon={<Icons.PremiumFilled style={{ color: '#CA8A04', width: 24, height: 24 }} />}
              label={t('stats.upgrade')}
              value={t('stats.allUnlocked')}
              badge={{ text: t('button.upgrade'), skin: 'premium' }}
            />
          </div>
        )}
      </div>

      {!isPremium && (
        <Card>
          <Card.Content>
            <Box direction="horizontal" verticalAlign="middle" gap="SP3">
              <Box direction="vertical" gap="SP1" flex="1">
                <Text size="medium" weight="bold">
                  {t('upsell.title')}
                </Text>
                <Text size="small" secondary>
                  {t('upsell.desc')}
                </Text>
              </Box>
              <Button
                skin="premium"
                prefixIcon={<Icons.PremiumFilled />}
                as="a"
                href={upgradeUrl}
                target="_blank"
              >
                {t('button.upgrade')}
              </Button>
            </Box>
          </Card.Content>
        </Card>
      )}

      <Layout>
        <Cell span={7}>
          <Card stretchVertically>
            <Card.Header title={t('settings.title')} subtitle={t('settings.subtitle')} />
            <Card.Divider />
            <Card.Content>
              <Box direction="vertical" gap="SP4">
                <FormField
                  label={t('settings.pdfUrl')}
                  infoContent={t('settings.pdfUrlInfo')}
                  status={urlError ? 'error' : undefined}
                  statusMessage={urlError || undefined}
                >
                  <Box direction="horizontal" gap="SP2" verticalAlign="bottom">
                    <Box flex="1">
                      <Input
                        value={settings.pdfUrl}
                        placeholder={t('settings.pdfUrlPlaceholder')}
                        onChange={(e) => {
                          updateSetting('pdfUrl', e.target.value);
                          setUrlError('');
                          setConnectionStatus('unknown');
                        }}
                        onBlur={() => {
                          const v = validatePdfUrl(settings.pdfUrl);
                          if (settings.pdfUrl.trim() && !v.ok) {
                            setUrlError(v.reason ?? t('settings.pdfUrlError'));
                          }
                        }}
                      />
                    </Box>
                    <Button onClick={handleTestLoad} disabled={testing || !settings.pdfUrl.trim()}>
                      {testing ? <Loader size="tiny" /> : t('button.testLoad')}
                    </Button>
                  </Box>
                </FormField>

                <div style={{ minWidth: 0 }}>
                  <StatCard
                    iconBg="#EDF3FF"
                    icon={<Icons.StatusComplete style={{ color: '#3B6AEA', width: 22, height: 22 }} />}
                    label={t('settings.connection')}
                    value={connectionLabel}
                    loading={testing}
                  />
                </div>

                <FormField
                  label={t('settings.defaultZoom')}
                  infoContent={t('settings.defaultZoomInfo')}
                >
                  <Slider
                    min={50}
                    max={200}
                    step={10}
                    value={settings.defaultZoom}
                    displayMarks={false}
                    onChange={(val) => updateSetting('defaultZoom', val as number)}
                  />
                  <Text size="tiny" secondary>
                    {settings.defaultZoom}%
                  </Text>
                </FormField>

                <FormField label={t('settings.fitMode')} infoContent={t('settings.fitModeInfo')}>
                  <SegmentedToggle
                    selected={settings.fitMode}
                    onClick={(_e, val) => updateSetting('fitMode', val as FitMode)}
                  >
                    <SegmentedToggle.Button value="fit-width">
                      {t('settings.fitWidth')}
                    </SegmentedToggle.Button>
                    <SegmentedToggle.Button value="fit-page">
                      {t('settings.fitPage')}
                    </SegmentedToggle.Button>
                  </SegmentedToggle>
                </FormField>

                <FormField label={t('settings.showToolbar')}>
                  <ToggleSwitch
                    checked={settings.showToolbar}
                    onChange={() => updateSetting('showToolbar', !settings.showToolbar)}
                  />
                  <Text size="tiny" secondary>
                    {t('settings.showToolbarDesc')}
                  </Text>
                </FormField>

                <FormField label={t('settings.allowDownload')}>
                  <ToggleSwitch
                    checked={settings.allowDownload}
                    disabled={!isPremium}
                    onChange={() => updateSetting('allowDownload', !settings.allowDownload)}
                  />
                  <Text size="tiny" secondary>
                    {!isPremium ? t('settings.premiumLock') : t('settings.allowDownloadDesc')}
                  </Text>
                </FormField>

                <FormField label={t('settings.theme')} infoContent={t('settings.themeInfo')}>
                  <SegmentedToggle
                    selected={settings.theme}
                    disabled={!isPremium}
                    onClick={(_e, val) => isPremium && updateSetting('theme', val as ThemeMode)}
                  >
                    <SegmentedToggle.Button value="light">
                      {t('settings.themeLight')}
                    </SegmentedToggle.Button>
                    <SegmentedToggle.Button value="dark">
                      {t('settings.themeDark')}
                    </SegmentedToggle.Button>
                  </SegmentedToggle>
                  {!isPremium && (
                    <Text size="tiny" secondary>
                      {t('settings.premiumLock')}
                    </Text>
                  )}
                </FormField>

                <FormField
                  label={t('settings.accentColor')}
                  infoContent={t('settings.accentColorInfo')}
                >
                  {isPremium ? (
                    <ColorPicker
                      value={settings.accentColor}
                      onChange={(color) => updateSetting('accentColor', color as string)}
                    />
                  ) : (
                    <Text size="tiny" secondary>
                      {t('settings.premiumLock')}
                    </Text>
                  )}
                </FormField>

                <FormField
                  label={t('settings.viewerHeight')}
                  infoContent={t('settings.viewerHeightInfo')}
                >
                  <Slider
                    min={320}
                    max={900}
                    step={20}
                    value={settings.viewerHeight}
                    displayMarks={false}
                    onChange={(val) => updateSetting('viewerHeight', val as number)}
                  />
                  <Text size="tiny" secondary>
                    {settings.viewerHeight}px
                  </Text>
                </FormField>

                <FormField
                  label={t('settings.pageLayout')}
                  infoContent={t('settings.pageLayoutInfo')}
                >
                  <SegmentedToggle
                    selected={settings.pageLayout}
                    onClick={(_e, val) => updateSetting('pageLayout', val as PageLayout)}
                  >
                    <SegmentedToggle.Button value="single">
                      {t('settings.pageLayoutSingle')}
                    </SegmentedToggle.Button>
                    <SegmentedToggle.Button value="continuous">
                      {t('settings.pageLayoutContinuous')}
                    </SegmentedToggle.Button>
                  </SegmentedToggle>
                </FormField>

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
                        <Text size="tiny" secondary>Last saved {formatLastSaved(lastSavedAt)}</Text>
                      </>
                    ) : null}
                  </Box>
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    prefixIcon={<Icons.Confirm />}
                    style={{ borderTopRightRadius: 0, borderBottomRightRadius: 0 }}
                  >
                    {saving ? 'Saving…' : hasSavedOnce ? t('button.update') : t('button.save')}
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
                  <Tooltip content={<span>{siteUrl ? 'Open your published site in a new tab.' : 'Publish your site to see the widget live.'}</span>}>
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
            </Card.Content>
          </Card>
        </Cell>

        <Cell span={5}>
          <div style={{ position: 'sticky', top: 64 }}>
            <Card stretchVertically>
              <Card.Header
                title={t('preview.title')}
                subtitle={t('preview.subtitle')}
                suffix={
                  <SegmentedToggle
                    size="small"
                    selected={previewDevice}
                    onClick={(_e, val) => setPreviewDevice(val as PreviewDevice)}
                  >
                    <SegmentedToggle.Button value="desktop" prefixIcon={<Icons.Desktop />} />
                    <SegmentedToggle.Button value="mobile" prefixIcon={<Icons.Mobile />} />
                  </SegmentedToggle>
                }
              />
              <Card.Divider />
              <Card.Content>
                {settings.pdfUrl.trim() ? (
                  <div
                    style={{
                      maxWidth: previewDevice === 'mobile' ? 375 : 'none',
                      margin: previewDevice === 'mobile' ? '0 auto' : undefined,
                      transition: 'max-width 0.3s ease',
                      width: '100%',
                    }}
                  >
                    <PdfViewerCore
                      pdfUrl={settings.pdfUrl}
                      defaultZoom={settings.defaultZoom}
                      fitMode={settings.fitMode}
                      showToolbar={settings.showToolbar}
                      allowDownload={isPremium && settings.allowDownload}
                      theme={isPremium ? settings.theme : 'light'}
                      accentColor={isPremium ? settings.accentColor : DEFAULT_SETTINGS.accentColor}
                      viewerHeight={Math.max(
                        320,
                        Math.min(
                          settings.viewerHeight,
                          previewDevice === 'mobile' ? 560 : 540,
                        ),
                      )}
                      pageLayout={settings.pageLayout}
                      isPremium={isPremium}
                      maxPages={isPremium ? null : FREE_PAGE_LIMIT}
                      labels={previewLabels}
                      previewWidth={previewDevice === 'mobile' ? 375 : '100%'}
                    />
                  </div>
                ) : (
                  <div
                    style={{
                      minHeight: 480,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '100%',
                    }}
                  >
                    <EmptyState
                      theme="page-no-border"
                      title={t('preview.emptyTitle')}
                      subtitle={t('preview.emptyDesc')}
                    />
                  </div>
                )}
              </Card.Content>
            </Card>
          </div>
        </Cell>
      </Layout>

      <MoreAppsCard />
    </Box>
  );

  const renderPlanTab = () => (
    <Card>
      <Card.Header title={t('pricing.title')} subtitle={t('pricing.subtitle')} />
      <Card.Divider />
      <Card.Content>
        {plansLoading ? (
          <Box align="center" padding="SP6">
            <Loader />
            <Text size="small" secondary>
              {t('pricing.loading')}
            </Text>
          </Box>
        ) : (
          <Box direction="vertical" gap="SP4">
            <SegmentedToggle
              selected={billingCycle}
              onClick={(_e, val) => setBillingCycle(val as 'monthly' | 'yearly')}
            >
              <SegmentedToggle.Button value="monthly">
                {t('pricing.monthly')}
              </SegmentedToggle.Button>
              <SegmentedToggle.Button value="yearly">
                {t('pricing.yearly')}
              </SegmentedToggle.Button>
            </SegmentedToggle>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${pricingTiers.length}, minmax(0, 1fr))`,
                gap: 16,
                paddingTop: 16,
              }}
            >
              {pricingTiers.map((tier) => {
                const tierName = tier.name.toLowerCase();
                const pkg = currentPlanName.toLowerCase();
                const isCurrent =
                  tierName === pkg ||
                  (!isPremium && tier.monthlyNum === 0) ||
                  (isPremium && tier.monthlyNum > 0 && (pkg.includes(tierName) || tierName.includes(pkg)));
                const isDowngrade = !isCurrent && tier.monthlyNum < activePrice;
                const price =
                  billingCycle === 'yearly' && tier.yearlyPrice
                    ? tier.yearlyPrice
                    : tier.monthlyPrice;
                const cycleLabel =
                  billingCycle === 'yearly' && tier.yearlyPrice
                    ? t('pricing.perYear')
                    : tier.monthlyNum === 0
                      ? t('pricing.forever')
                      : t('pricing.perMonth');

                return (
                  <div
                    key={tier.name}
                    style={{
                      minWidth: 0,
                      position: 'relative',
                      borderRadius: 12,
                      border: tier.popular ? '2px solid #6B21A8' : '1px solid #E4E6EB',
                      padding: 20,
                      background: isDowngrade ? '#F7F8FA' : '#fff',
                      opacity: isDowngrade ? 0.55 : 1,
                      wordBreak: 'break-word',
                    }}
                  >
                    {tier.popular && (
                      <Badge
                        size="small"
                        skin="success"
                        style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)' }}
                      >
                        {t('pricing.mostPopular')}
                      </Badge>
                    )}
                    {isCurrent && (
                      <Badge
                        size="small"
                        skin="standard"
                        style={{ position: 'absolute', top: -12, right: 12 }}
                      >
                        {t('pricing.currentPlan')}
                      </Badge>
                    )}

                    <Box direction="vertical" gap="SP2">
                      <Text size="medium" weight="bold">
                        {tier.name}
                      </Text>
                      <Text size="medium" weight="bold">
                        {price}
                        <Text size="tiny" secondary>
                          {' '}
                          {cycleLabel}
                        </Text>
                      </Text>

                      <Divider />

                      <Box direction="vertical" gap="SP1">
                        {tier.features.map((feature) => (
                          <Box key={feature} direction="horizontal" gap="SP1" verticalAlign="top">
                            <Icons.Check style={{ color: '#27AE60', flexShrink: 0 }} />
                            <Text size="tiny">
                              {feature.startsWith('pricing.') ? t(feature) : feature}
                            </Text>
                          </Box>
                        ))}
                      </Box>

                      {isCurrent ? (
                        <Button disabled>{t('button.currentPlan')}</Button>
                      ) : isDowngrade ? (
                        <Tooltip content={t('pricing.downgradeTooltip')}>
                          <div>
                            <Button disabled>{t('button.includedInPlan')}</Button>
                          </div>
                        </Tooltip>
                      ) : (
                        <Button
                          as="a"
                          href={upgradeUrl}
                          target="_blank"
                          skin={tier.popular ? 'premium' : undefined}
                        >
                          {t('button.upgrade')} {tier.name}
                        </Button>
                      )}
                    </Box>
                  </div>
                );
              })}
            </div>
          </Box>
        )}
      </Card.Content>
    </Card>
  );

  const renderHowToTab = () => (
    <Box direction="vertical" gap="SP4">
      <Card>
        <Card.Header title={t('howTo.title')} subtitle={t('howTo.subtitle')} />
        <Card.Divider />
        <Card.Content>
          <Accordion
            items={[
              { title: t('faq.q1'), children: <Text size="small">{t('faq.a1')}</Text> },
              { title: t('faq.q2'), children: <Text size="small">{t('faq.a2')}</Text> },
              { title: t('faq.q3'), children: <Text size="small">{t('faq.a3')}</Text> },
              { title: t('faq.q4'), children: <Text size="small">{t('faq.a4')}</Text> },
              { title: t('faq.q5'), children: <Text size="small">{t('faq.a5')}</Text> },
              { title: t('faq.q6'), children: <Text size="small">{t('faq.a6')}</Text> },
            ]}
          />
        </Card.Content>
      </Card>

      <Card>
        <Card.Content>
          <Box direction="horizontal" verticalAlign="middle" gap="SP3">
            <Box direction="vertical" gap="SP1" flex="1">
              <Text size="medium" weight="bold">
                {t('help.title')}
              </Text>
              <Text size="small" secondary>
                {t('help.description')}
              </Text>
            </Box>
            <Button
              as="a"
              href={`mailto:${t('help.email')}`}
              priority="secondary"
              prefixIcon={<Icons.Email />}
            >
              {t('help.email')}
            </Button>
          </Box>
        </Card.Content>
      </Card>
    </Box>
  );

  if (planLoading || settingsLoading) {
    return (
      <WixDesignSystemProvider features={{ newColorsBranding: true }}>
        <Page>
          <Page.Content>
            <Box align="center" padding="60px">
              <Loader />
              <Text size="small" secondary>
                {t('page.checkingPlan')}
              </Text>
            </Box>
          </Page.Content>
        </Page>
      </WixDesignSystemProvider>
    );
  }

  return (
    <WixDesignSystemProvider features={{ newColorsBranding: true }}>
      <ErrorBoundary>
        <Page height="100vh">
          <Page.Header
            subtitle={t('page.subtitle')}
            actionsBar={
              !isPremium ? (
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
            {showOnboarding ? (
              renderOnboarding()
            ) : (
              <>
                <Box marginBottom="24px">
                  <Tabs
                    activeId={activeTab}
                    type="compact"
                    items={[
                      { id: 'manage', title: t('tab.manage') },
                      { id: 'planSettings', title: t('tab.planSettings') },
                      { id: 'howToUse', title: t('tab.howToUse') },
                    ]}
                    onClick={(item) => setActiveTab(item.id as DashboardTab)}
                  />
                </Box>

                {activeTab === 'manage' && renderManageTab()}
                {activeTab === 'planSettings' && renderPlanTab()}
                {activeTab === 'howToUse' && renderHowToTab()}
              </>
            )}
          </Page.Content>
        </Page>
      </ErrorBoundary>
    </WixDesignSystemProvider>
  );
};

export default withIntlProvider(DashboardPage);
