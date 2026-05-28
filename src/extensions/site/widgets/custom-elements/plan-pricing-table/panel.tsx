import React, { type FC, useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import reactToWebComponent from 'react-to-webcomponent';
import { httpClient } from '@wix/essentials';
import {
  Box,
  Button,
  Card,
  Loader,
  Text,
  WixDesignSystemProvider,
} from '@wix/design-system';
import * as Icons from '@wix/wix-ui-icons-common';
import { ErrorBoundary } from '../../../../_shared/error-boundary';
import { APP_ID } from '../../../../_shared/app-config';

const getApiBase = (): string => {
  try {
    return new URL(import.meta.url).origin;
  } catch {
    return '';
  }
};

const PanelInner: FC = () => {
  const [loading, setLoading] = useState(true);
  const [dashboardUrl, setDashboardUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    httpClient
      .fetchWithAuth(`${getApiBase()}/api/app/check-premium`)
      .then(async (res) => {
        if (!res.ok) return;
        const data = (await res.json()) as {
          metaSiteId?: string;
          instanceId?: string;
        };
        if (cancelled) return;
        const siteRef = data.metaSiteId || data.instanceId;
        if (siteRef) {
          setDashboardUrl(`https://manage.wix.com/dashboard/${siteRef}/app/${APP_ID}`);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <WixDesignSystemProvider features={{ newColorsBranding: true }}>
      <Box padding="SP3">
        <Card>
          <Card.Content>
            <Box direction="vertical" gap="SP3">
              <Text size="small" secondary>
                All plan and theme settings are managed in the app dashboard.
              </Text>
              {loading ? (
                <Loader size="small" />
              ) : (
                <Button
                  prefixIcon={<Icons.ExternalLinkSmall />}
                  disabled={!dashboardUrl}
                  onClick={() => dashboardUrl && window.open(dashboardUrl, '_blank')}
                >
                  Open Dashboard to Edit Plans
                </Button>
              )}
            </Box>
          </Card.Content>
        </Card>
      </Box>
    </WixDesignSystemProvider>
  );
};

const PanelWithBoundary: FC = () => (
  <ErrorBoundary surface="panel">
    <PanelInner />
  </ErrorBoundary>
);

const WebComponent = reactToWebComponent(PanelWithBoundary, React, ReactDOM);

if (typeof customElements !== 'undefined' && !customElements.get('plan-pricing-table-panel')) {
  customElements.define('plan-pricing-table-panel', WebComponent);
}

export default PanelWithBoundary;
