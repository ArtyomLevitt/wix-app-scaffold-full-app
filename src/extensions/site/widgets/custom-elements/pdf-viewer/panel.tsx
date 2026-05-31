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
import { httpClient } from '@wix/essentials';
import { useIntl } from 'react-intl';
import {
  APP_ID,
  APP_NAME,
  SUPPORT_EMAIL,
} from '../../../../_shared/app-config';
import { ErrorBoundary } from '../../../../_shared/error-boundary';
import {
  DEFAULT_SETTINGS,
  type WidgetSettings,
} from '../../../../_shared/widget-settings-types';
import { withIntlProvider } from '../../../../../intl/withIntlProvider';

const ACCENT = '#3B6AEA';

const getApiBase = (): string => {
  try {
    return new URL(import.meta.url).origin;
  } catch {
    return '';
  }
};

interface PremiumInfo {
  isPremium: boolean;
  packageName?: string;
  instanceId?: string;
  metaSiteId?: string;
}

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

const SummaryRow: FC<{ label: string; value: string }> = ({ label, value }) => (
  <SidePanel.Field>
    <Box direction="horizontal" gap="8px" verticalAlign="middle">
      <Text size="tiny" secondary weight="bold">
        {label}
      </Text>
      <Text size="tiny">{value}</Text>
    </Box>
  </SidePanel.Field>
);

const Panel: FC = () => {
  const intl = useIntl();
  const t = (id: string) => intl.formatMessage({ id });

  const [settings, setSettings] = useState<WidgetSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [packageName, setPackageName] = useState<string | undefined>();
  const [metaSiteId, setMetaSiteId] = useState<string | null>(null);
  const [instanceId, setInstanceId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const base = getApiBase();
        const [settingsRes, premiumRes] = await Promise.all([
          httpClient.fetchWithAuth(`${base}/api/widget/settings`),
          httpClient.fetchWithAuth(`${base}/api/app/check-premium`),
        ]);
        if (cancelled) return;

        if (settingsRes.ok) {
          const w = (await settingsRes.json()) as WidgetSettings;
          setSettings({ ...DEFAULT_SETTINGS, ...w });
        }

        if (premiumRes.ok) {
          const p = (await premiumRes.json()) as PremiumInfo;
          setIsPremium(!!p.isPremium);
          setPackageName(p.packageName);
          setMetaSiteId(p.metaSiteId ?? null);
          setInstanceId(p.instanceId ?? null);
        }
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
      <WixDesignSystemProvider>
        <style>{`@keyframes app-panel-shimmer { 0% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }`}</style>
        <SidePanel width="300px" height="100vh">
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

  const pdfSummary = settings.pdfUrl?.trim()
    ? settings.pdfUrl.length > 42
      ? `${settings.pdfUrl.slice(0, 39)}…`
      : settings.pdfUrl
    : t('panel.notConfigured');

  return (
    <WixDesignSystemProvider>
      <SidePanel width="300px" height="100vh">
        <SidePanel.Header
          title={APP_NAME}
          suffix={
            <Badge
              size="tiny"
              skin={isPremium ? 'premium' : 'neutral'}
              prefixIcon={isPremium ? <Icons.PremiumFilled /> : undefined}
            >
              {isPremium ? packageName || 'Premium' : 'Free'}
            </Badge>
          }
        />
        <SidePanel.Content noPadding stretchVertically>
          <Box direction="vertical" gap="SP0">
            {dashboardUrl && (
              <SidePanel.Field>
                <Button
                  size="small"
                  priority="primary"
                  prefixIcon={<Icons.ExternalLinkSmall />}
                  onClick={() => window.open(dashboardUrl, '_blank')}
                  fullWidth
                >
                  {t('panel.manageInDashboard')}
                </Button>
              </SidePanel.Field>
            )}

            <SummaryRow label={t('panel.pdfUrl')} value={pdfSummary} />
            <SummaryRow label={t('panel.defaultZoom')} value={`${settings.defaultZoom}%`} />
            <SummaryRow label={t('panel.fitMode')} value={settings.fitMode} />
            <SummaryRow
              label={t('panel.showToolbar')}
              value={settings.showToolbar ? t('panel.on') : t('panel.off')}
            />
            <SummaryRow
              label={t('panel.allowDownload')}
              value={settings.allowDownload ? t('panel.on') : t('panel.off')}
            />
            <SummaryRow label={t('panel.theme')} value={settings.theme} />
            <SummaryRow label={t('panel.viewerHeight')} value={`${settings.viewerHeight}px`} />

            <SidePanel.Field>
              <Box
                direction="vertical"
                gap="SP2"
                padding="10px 12px"
                borderRadius="8px"
                backgroundColor="#F7F8FA"
                border="1px solid #E8E8E8"
              >
                <Box direction="horizontal" gap="6px" verticalAlign="middle">
                  <Icons.Hint style={{ color: ACCENT }} />
                  <Text size="tiny" weight="bold">
                    {t('panel.tipTitle')}
                  </Text>
                </Box>
                <Text size="tiny" secondary>
                  {t('panel.tipDesc')}
                </Text>
              </Box>
            </SidePanel.Field>
          </Box>
        </SidePanel.Content>
        <SidePanel.Footer>
          <Divider />
          <Box padding="SP3" direction="vertical" gap="SP1">
            <Text size="tiny" weight="bold">
              {t('panel.needHelp')}
            </Text>
            <TextButton
              as="a"
              href={`mailto:${SUPPORT_EMAIL}`}
              prefixIcon={<Icons.Email />}
            >
              {SUPPORT_EMAIL}
            </TextButton>
          </Box>
        </SidePanel.Footer>
      </SidePanel>
    </WixDesignSystemProvider>
  );
};

const PanelWithBoundary: FC = () => (
  <ErrorBoundary surface="panel">
    <Panel />
  </ErrorBoundary>
);

export default withIntlProvider(PanelWithBoundary);
