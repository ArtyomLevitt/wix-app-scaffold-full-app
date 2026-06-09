import React, { type FC, useEffect, useState } from 'react';
import {
  Badge,
  Box,
  Button,
  Divider,
  Loader,
  SidePanel,
  Text,
  TextButton,
  WixDesignSystemProvider,
} from '@wix/design-system';
import '@wix/design-system/styles.global.css';
import * as Icons from '@wix/wix-ui-icons-common';
import { useIntl } from 'react-intl';
import { httpClient } from '@wix/essentials';
import { withIntlProvider } from '../../../../../intl/withIntlProvider';
import {
  APP_ID,
  APP_NAME,
  SUPPORT_EMAIL,
} from '../../../../_shared/app-config';
import {
  migrateSettings,
  type AppSettings,
} from '../../../../_shared/pricing-types';
import ErrorBoundary from '../../../../_shared/error-boundary';

const ACCENT = '#6B21A8';

const getApiBase = (): string => {
  try {
    return new URL(import.meta.url).origin;
  } catch {
    return '';
  }
};

const SkeletonLine: FC<{ width?: string | number; height?: number }> = ({
  width = '100%',
  height = 12,
}) => (
  <div
    style={{
      width: typeof width === 'number' ? `${width}px` : width,
      height,
      borderRadius: 4,
      background: 'linear-gradient(90deg, #ECEEF1 0%, #F7F8FA 50%, #ECEEF1 100%)',
      backgroundSize: '200% 100%',
      animation: 'app-panel-shimmer 1.4s ease-in-out infinite',
    }}
  />
);

const PanelInner: FC = () => {
  const intl = useIntl();
  const t = (id: string) => intl.formatMessage({ id });

  const [settings, setSettings] = useState<AppSettings>(migrateSettings(null));
  const [planCount, setPlanCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [packageName, setPackageName] = useState<string | undefined>();
  const [metaSiteId, setMetaSiteId] = useState<string | null>(null);
  const [instanceId, setInstanceId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const apiBase = getApiBase();
        const [widgetRes, premiumRes] = await Promise.all([
          httpClient.fetchWithAuth(`${apiBase}/api/widget/data`),
          httpClient.fetchWithAuth(`${apiBase}/api/app/check-premium`),
        ]);
        if (cancelled) return;
        const widgetData = (await widgetRes.json()) as {
          settings?: AppSettings;
          plans?: unknown[];
        };
        const premium = (await premiumRes.json()) as {
          isPremium?: boolean;
          packageName?: string;
          metaSiteId?: string;
          instanceId?: string;
        };
        setSettings(migrateSettings(widgetData.settings));
        setPlanCount((widgetData.plans ?? []).length);
        setIsPremium(Boolean(premium.isPremium));
        setPackageName(premium.packageName);
        setMetaSiteId(premium.metaSiteId ?? null);
        setInstanceId(premium.instanceId ?? null);
      } catch (e) {
        console.error('[panel] load failed', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const siteOrInstance = metaSiteId || instanceId;
  const dashboardUrl = siteOrInstance
    ? `https://manage.wix.com/dashboard/${siteOrInstance}/app/${APP_ID}`
    : null;

  if (loading) {
    return (
      <WixDesignSystemProvider features={{ newColorsBranding: true }}>
        <style>{`@keyframes app-panel-shimmer { 0% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }`}</style>
        <SidePanel width="300" height="100vh">
          <SidePanel.Header title={APP_NAME} suffix={<Loader size="tiny" />} />
          <SidePanel.Content noPadding stretchVertically>
            <Box direction="vertical" gap="SP0">
              <SidePanel.Field>
                <div
                  style={{
                    height: 32,
                    borderRadius: 6,
                    background:
                      'linear-gradient(90deg, #ECEEF1 0%, #F7F8FA 50%, #ECEEF1 100%)',
                    backgroundSize: '200% 100%',
                    animation: 'app-panel-shimmer 1.4s ease-in-out infinite',
                  }}
                />
              </SidePanel.Field>
              <SidePanel.Field>
                <Box direction="horizontal" gap="8px" verticalAlign="middle">
                  <SkeletonLine width={16} height={16} />
                  <SkeletonLine width={90} height={10} />
                </Box>
              </SidePanel.Field>
              <SidePanel.Field>
                <Box
                  direction="vertical"
                  gap="8px"
                  padding="10px 12px"
                  borderRadius="8px"
                  backgroundColor="#F7F8FA"
                  border="1px solid #E8E8E8"
                >
                  <SkeletonLine width="80%" />
                  <SkeletonLine width="60%" />
                  <SkeletonLine width="70%" />
                  <SkeletonLine width="50%" />
                </Box>
              </SidePanel.Field>
            </Box>
          </SidePanel.Content>
        </SidePanel>
      </WixDesignSystemProvider>
    );
  }

  return (
    <WixDesignSystemProvider features={{ newColorsBranding: true }}>
      <SidePanel width="300" height="100vh">
        <SidePanel.Header
          title={APP_NAME}
          suffix={
            <Badge
              size="tiny"
              skin={isPremium ? 'premium' : 'neutral'}
              prefixIcon={isPremium ? <Icons.PremiumFilled /> : undefined}
            >
              {isPremium ? packageName || t('badge.premium') : t('badge.free')}
            </Badge>
          }
        />
        <SidePanel.Content noPadding stretchVertically>
          <Box direction="vertical" gap="SP0">
            {dashboardUrl ? (
              <SidePanel.Field>
                <Button
                  size="small"
                  priority="primary"
                  prefixIcon={<Icons.ExternalLinkSmall />}
                  onClick={() => window.open(dashboardUrl, '_blank')}
                  fullWidth
                >
                  {t('panel.openDashboard')}
                </Button>
              </SidePanel.Field>
            ) : null}

            <SidePanel.Field>
              <Box direction="vertical" gap="SP2">
                <Text size="tiny" weight="bold" secondary>
                  {t('panel.dashboardHint')}
                </Text>
                <Box direction="horizontal" verticalAlign="middle" gap="SP2">
                  <Icons.List style={{ color: ACCENT }} />
                  <Text size="small">
                    {t('stats.plans.value', { count: planCount })}
                  </Text>
                </Box>
                <Box direction="horizontal" verticalAlign="middle" gap="SP2">
                  <Icons.ColorBucket style={{ color: ACCENT }} />
                  <Text size="small">{settings.theme}</Text>
                </Box>
              </Box>
            </SidePanel.Field>

            <Divider />

            {!isPremium ? (
              <SidePanel.Field>
                <Box
                  direction="vertical"
                  gap="SP2"
                  padding="12px"
                  background="#F7F5FA"
                  borderRadius="8px"
                >
                  <Text size="small" weight="bold">
                    {t('manage.plans.upgradeHint')}
                  </Text>
                  <TextButton
                    as="a"
                    href={`https://www.wix.com/apps/upgrade/${APP_ID}${instanceId ? `?appInstanceId=${instanceId}` : ''}`}
                    target="_blank"
                    size="small"
                    prefixIcon={<Icons.PremiumFilled />}
                  >
                    {t('button.upgradeToPremium')}
                  </TextButton>
                </Box>
              </SidePanel.Field>
            ) : null}

            <SidePanel.Field>
              <Box direction="vertical" gap="SP1">
                <Text size="tiny" secondary>
                  {t('help.title')}
                </Text>
                <TextButton
                  as="a"
                  href={`mailto:${SUPPORT_EMAIL}`}
                  size="tiny"
                  prefixIcon={<Icons.Email />}
                >
                  {SUPPORT_EMAIL}
                </TextButton>
              </Box>
            </SidePanel.Field>
          </Box>
        </SidePanel.Content>
      </SidePanel>
    </WixDesignSystemProvider>
  );
};

const Panel: FC = () => (
  <ErrorBoundary surface="panel">
    <PanelInner />
  </ErrorBoundary>
);

export default withIntlProvider(Panel);
