import React, { type FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { widget } from '@wix/editor';
import {
  Badge,
  Box,
  Divider,
  Dropdown,
  FormField,
  Input,
  Loader,
  SidePanel,
  Slider,
  Text,
  TextButton,
  ToggleSwitch,
  WixDesignSystemProvider,
} from '@wix/design-system';
import * as Icons from '@wix/wix-ui-icons-common';
import '@wix/design-system/styles.global.css';
import { httpClient } from '@wix/essentials';
import { useIntl } from 'react-intl';
import { APP_ID } from '../../../../_shared/app-config';
import { WidgetErrorBoundary } from '../../../../_shared/error-boundary';
import { validatePdfUrl } from '../../../../_shared/pdf-url';
import { withIntlProvider } from '../../../../../intl/withIntlProvider';

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

  const [pdfUrl, setPdfUrl] = useState('');
  const [defaultZoom, setDefaultZoom] = useState(100);
  const [fitMode, setFitMode] = useState('fit-width');
  const [showToolbar, setShowToolbar] = useState(true);
  const [allowDownload, setAllowDownload] = useState(false);
  const [theme, setTheme] = useState('light');
  const [accentColor, setAccentColor] = useState('#6B21A8');
  const [viewerHeight, setViewerHeight] = useState(600);
  const [pageLayout, setPageLayout] = useState('continuous');

  const [isPremium, setIsPremium] = useState(false);
  const [planLoading, setPlanLoading] = useState(true);
  const [instanceId, setInstanceId] = useState<string | undefined>();

  const upgradeUrl = useMemo(
    () =>
      instanceId
        ? `https://www.wix.com/apps/upgrade/${APP_ID}?appInstanceId=${instanceId}`
        : `https://www.wix.com/apps/upgrade/${APP_ID}`,
    [instanceId],
  );

  const urlTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    async function init() {
      try {
        const base = getApiBase();
        const [settingsRes, premiumRes] = await Promise.all([
          httpClient.fetchWithAuth(`${base}/api/widget/settings`),
          httpClient.fetchWithAuth(`${base}/api/app/check-premium`),
        ]);
        if (settingsRes.ok) {
          const data = await settingsRes.json();
          if (data.pdfUrl) setPdfUrl(data.pdfUrl);
          if (data.defaultZoom) setDefaultZoom(data.defaultZoom);
          if (data.fitMode) setFitMode(data.fitMode);
          setShowToolbar(data.showToolbar !== false);
          setAllowDownload(!!data.allowDownload);
          if (data.theme) setTheme(data.theme);
          if (data.accentColor) setAccentColor(data.accentColor);
          if (data.viewerHeight) setViewerHeight(data.viewerHeight);
          if (data.pageLayout) setPageLayout(data.pageLayout);
          setIsPremium(!!data.isPremium);
        }
        if (premiumRes.ok) {
          const premium = await premiumRes.json();
          setIsPremium(!!premium.isPremium);
          widget.setProp('ispremium', String(!!premium.isPremium));
          if (premium.instanceId) setInstanceId(premium.instanceId);
        }
      } catch (err) {
        console.warn('[panel] init failed:', err);
      } finally {
        setPlanLoading(false);
      }
    }
    init();
  }, []);

  const pushProp = useCallback((name: string, value: string) => {
    widget.setProp(name, value).catch(() => undefined);
  }, []);

  const handleUrlChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setPdfUrl(value);
      if (urlTimerRef.current) clearTimeout(urlTimerRef.current);
      urlTimerRef.current = setTimeout(() => {
        const v = validatePdfUrl(value);
        pushProp('pdfurl', v.ok ? v.normalized : value.trim());
      }, 800);
    },
    [pushProp],
  );

  if (planLoading) {
    return (
      <Box align="center" verticalAlign="middle" height="200px">
        <Loader size="small" />
      </Box>
    );
  }

  return (
    <WixDesignSystemProvider features={{ newColorsBranding: true }}>
      <SidePanel width="300px">
        <SidePanel.Header title={t('panel.title')} />
        <SidePanel.Content>
          <Box direction="vertical" gap="SP4">
            <FormField label={t('panel.pdfUrl')}>
              <Input value={pdfUrl} onChange={handleUrlChange} placeholder="https://..." />
            </FormField>

            <FormField label={t('panel.defaultZoom')}>
              <Slider
                min={50}
                max={200}
                step={10}
                value={defaultZoom}
                onChange={(val) => {
                  const n = Array.isArray(val) ? val[0] : val;
                  setDefaultZoom(n);
                  pushProp('defaultzoom', String(n));
                }}
              />
            </FormField>

            <FormField label={t('panel.fitMode')}>
              <Dropdown
                options={[
                  { id: 'fit-width', value: t('panel.fitWidth') },
                  { id: 'fit-page', value: t('panel.fitPage') },
                ]}
                selectedId={fitMode}
                onSelect={(opt) => {
                  const id = String(opt.id);
                  setFitMode(id);
                  pushProp('fitmode', id);
                }}
              />
            </FormField>

            <FormField label={t('panel.showToolbar')}>
              <ToggleSwitch
                checked={showToolbar}
                onChange={() => {
                  const next = !showToolbar;
                  setShowToolbar(next);
                  pushProp('showtoolbar', String(next));
                }}
              />
            </FormField>

            <FormField
              label={t('panel.allowDownload')}
              infoContent={!isPremium ? t('panel.premiumRequired') : undefined}
            >
              <ToggleSwitch
                checked={allowDownload && isPremium}
                disabled={!isPremium}
                onChange={() => {
                  if (!isPremium) return;
                  const next = !allowDownload;
                  setAllowDownload(next);
                  pushProp('allowdownload', String(next));
                }}
              />
            </FormField>

            <FormField
              label={t('panel.theme')}
              infoContent={!isPremium ? t('panel.premiumRequired') : undefined}
            >
              <Dropdown
                disabled={!isPremium}
                options={[
                  { id: 'light', value: t('panel.themeLight') },
                  { id: 'dark', value: t('panel.themeDark') },
                ]}
                selectedId={theme}
                onSelect={(opt) => {
                  if (!isPremium) return;
                  const id = String(opt.id);
                  setTheme(id);
                  pushProp('theme', id);
                }}
              />
            </FormField>

            <FormField label={t('panel.viewerHeight')}>
              <Slider
                min={320}
                max={900}
                step={20}
                value={viewerHeight}
                onChange={(val) => {
                  const n = Array.isArray(val) ? val[0] : val;
                  setViewerHeight(n);
                  pushProp('viewerheight', String(n));
                }}
              />
            </FormField>

            {!isPremium && (
              <Box direction="vertical" gap="SP2">
                <Badge skin="premium">{t('panel.upgradeHint')}</Badge>
                <TextButton as="a" href={upgradeUrl} target="_blank">
                  {t('panel.upgrade')}
                </TextButton>
              </Box>
            )}
          </Box>
        </SidePanel.Content>
        <SidePanel.Footer>
          <Divider />
          <Box padding="SP3">
            <Text size="tiny" secondary>
              {t('panel.footerHint')}
            </Text>
          </Box>
        </SidePanel.Footer>
      </SidePanel>
    </WixDesignSystemProvider>
  );
};

const Panel: FC = () => (
  <WidgetErrorBoundary surface="panel">
    <PanelInner />
  </WidgetErrorBoundary>
);

export default withIntlProvider(Panel);
