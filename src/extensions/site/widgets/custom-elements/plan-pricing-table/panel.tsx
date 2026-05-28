import React, { type FC, useEffect, useMemo, useState } from 'react';
import { dashboard } from '@wix/dashboard';
import {
  Badge,
  Box,
  Loader,
  SidePanel,
  Text,
  TextButton,
  WixDesignSystemProvider,
} from '@wix/design-system';
import * as Icons from '@wix/wix-ui-icons-common';
import '@wix/design-system/styles.global.css';
import { useIntl } from 'react-intl';
import { httpClient } from '@wix/essentials';
import { withIntlProvider } from '../../../../../intl/withIntlProvider';
import { APP_ID } from '../../../../_shared/app-config';
import ErrorBoundary from '../../../../_shared/error-boundary';

const getApiBase = (): string => {
  try {
    return new URL(import.meta.url).origin;
  } catch {
    return '';
  }
};

const PanelInner: FC = () => {
  const intl = useIntl();
  const t = (id: string) => intl.formatMessage({ id });
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);
  const [instanceId, setInstanceId] = useState<string | undefined>();

  const upgradeUrl = useMemo(
    () =>
      instanceId
        ? `https://www.wix.com/apps/upgrade/${APP_ID}?appInstanceId=${instanceId}`
        : `https://www.wix.com/apps/upgrade/${APP_ID}`,
    [instanceId],
  );

  useEffect(() => {
    httpClient
      .fetchWithAuth(`${getApiBase()}/api/app/check-premium`)
      .then((res) => res.json())
      .then((data: { isPremium?: boolean; instanceId?: string }) => {
        setIsPremium(Boolean(data.isPremium));
        setInstanceId(data.instanceId);
      })
      .catch(() => setIsPremium(false))
      .finally(() => setLoading(false));
  }, []);

  const openDashboard = () => {
    dashboard.navigate({ pageId: 'dd96bc7c-74b4-4bc0-a9d3-f4578c144b4c' }).catch(() => {
      window.open(`https://manage.wix.com/apps/${APP_ID}`, '_blank');
    });
  };

  return (
    <SidePanel width="100%">
      <SidePanel.Header
        title={t('panel.title')}
        suffix={
          loading ? (
            <Loader size="tiny" />
          ) : isPremium ? (
            <Badge size="tiny" skin="premium" prefixIcon={<Icons.PremiumFilled />}>
              {t('badge.premium')}
            </Badge>
          ) : (
            <Badge size="tiny" skin="neutral">
              {t('badge.free')}
            </Badge>
          )
        }
      />
      <SidePanel.Content>
        <Box direction="vertical" gap="SP4" padding="0 0 24px">
          <Text size="small" secondary>
            {t('panel.dashboardHint')}
          </Text>
          <TextButton prefixIcon={<Icons.ExternalLink />} onClick={openDashboard}>
            {t('panel.openDashboard')}
          </TextButton>
          {!isPremium ? (
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
              <TextButton as="a" href={upgradeUrl} target="_blank" size="small">
                {t('button.upgradeToPremium')}
              </TextButton>
            </Box>
          ) : null}
        </Box>
      </SidePanel.Content>
    </SidePanel>
  );
};

const Panel: FC = () => (
  <WixDesignSystemProvider features={{ newColorsBranding: true }}>
    <ErrorBoundary surface="panel">
      <PanelInner />
    </ErrorBoundary>
  </WixDesignSystemProvider>
);

export default withIntlProvider(Panel);
