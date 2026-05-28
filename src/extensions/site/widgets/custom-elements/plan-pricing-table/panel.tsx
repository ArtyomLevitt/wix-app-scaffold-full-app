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
import { APP_ID, APP_NAME, SUPPORT_EMAIL } from '../../../../_shared/app-config';
import { DEFAULT_SETTINGS, type AppSettings } from '../../../../_shared/app-settings-types';
import { getApiBase } from '../../../../_shared/widget-api';

const ACCENT = '#6B21A8';

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

interface PremiumResponse {
  isPremium?: boolean;
  packageName?: string;
  instanceId?: string;
  metaSiteId?: string;
}

interface SettingsResponse {
  settings?: AppSettings;
  plans?: Array<{ name?: string }>;
}

const Panel: FC = () => {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
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
        const base = getApiBase();
        const [settingsRes, premiumRes, plansRes] = await Promise.all([
          httpClient.fetchWithAuth(`${base}/api/widget/settings`),
          httpClient.fetchWithAuth(`${base}/api/app/check-premium`),
          httpClient.fetchWithAuth(`${base}/api/plans`),
        ]);
        if (cancelled) return;
        if (settingsRes.ok) {
          const data = (await settingsRes.json()) as SettingsResponse;
          if (data.settings) setSettings({ ...DEFAULT_SETTINGS, ...data.settings });
        }
        if (plansRes.ok) {
          const data = (await plansRes.json()) as { plans?: unknown[] };
          setPlanCount(data.plans?.length ?? 0);
        }
        if (premiumRes.ok) {
          const p = (await premiumRes.json()) as PremiumResponse;
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
    <WixDesignSystemProvider>
      <SidePanel width="300" height="100vh">
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
                  Manage in dashboard
                </Button>
              </SidePanel.Field>
            )}

            <SidePanel.Field>
              <Box direction="vertical" gap="SP2" padding="12px">
                <Box direction="horizontal" verticalAlign="middle" gap="SP2">
                  <Icons.Hint style={{ color: ACCENT }} />
                  <Text size="small" weight="bold">
                    Current configuration
                  </Text>
                </Box>
                <Box direction="vertical" gap="SP1">
                  <Text size="tiny" secondary>
                    Theme
                  </Text>
                  <Text size="small">{settings.theme}</Text>
                </Box>
                <Box direction="vertical" gap="SP1">
                  <Text size="tiny" secondary>
                    Highlight color
                  </Text>
                  <Box direction="horizontal" gap="SP1" verticalAlign="middle">
                    <div
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: 4,
                        background: settings.highlightColor,
                        border: '1px solid #E8E8E8',
                      }}
                    />
                    <Text size="small">{settings.highlightColor}</Text>
                  </Box>
                </Box>
                <Box direction="vertical" gap="SP1">
                  <Text size="tiny" secondary>
                    Plan cards
                  </Text>
                  <Text size="small">{planCount}</Text>
                </Box>
              </Box>
            </SidePanel.Field>

            <Divider />

            <SidePanel.Field>
              <Box
                direction="vertical"
                gap="SP2"
                padding="12px"
                borderRadius="8px"
                backgroundColor="#F7F8FA"
                border="1px solid #E8E8E8"
              >
                <Text size="tiny" secondary>
                  Edit plan cards, themes, badges, and CTAs in the app dashboard.
                  Changes appear on your site after you save.
                </Text>
              </Box>
            </SidePanel.Field>

            <SidePanel.Field>
              <Box padding="12px">
                <TextButton
                  size="tiny"
                  as="a"
                  href={`mailto:${SUPPORT_EMAIL}`}
                  prefixIcon={<Icons.Email />}
                >
                  Contact support
                </TextButton>
              </Box>
            </SidePanel.Field>
          </Box>
        </SidePanel.Content>
      </SidePanel>
    </WixDesignSystemProvider>
  );
};

export default Panel;
