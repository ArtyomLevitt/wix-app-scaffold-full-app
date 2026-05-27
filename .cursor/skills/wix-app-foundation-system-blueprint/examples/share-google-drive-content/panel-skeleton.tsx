// @ts-nocheck — reference skeleton, not real source. Imports point at placeholder paths or modules that aren't installed in this skills repo. See examples/INDEX.md.
// SKELETON — distilled from share-google-drive-content/src/site/widgets/custom-elements/google-drive-viewer/panel.tsx (475 lines).
// Goes at: src/site/widgets/custom-elements/<slug>/panel.tsx
//
// Demonstrates the canonical PRPL editor settings panel patterns:
//   1. WDS components (SidePanel, FormField, Input, Slider, Dropdown, ToggleSwitch) — only the panel can use WDS, the widget cannot
//   2. widget.getProp() on mount → seed local state from existing widget props
//   3. widget.setProp() on every change → push back to the live widget on the page
//   4. checkPremium() once → propagate to the widget via widget.setProp('ispremium', '...')
//   5. Debounced text input writes (so we don't `setProp` on every keystroke)
//   6. WDS withIntlProvider wrapper for translation

import React, { type FC, useState, useEffect, useCallback, useRef } from 'react';
import { widget } from '@wix/editor';
import {
  Badge, Box, Divider, Dropdown, FormField, Input, Loader, SidePanel, Slider, Text, TextButton, ToggleSwitch,
  WixDesignSystemProvider,
} from '@wix/design-system';
import * as Icons from '@wix/wix-ui-icons-common';
import '@wix/design-system/styles.global.css';
import { useIntl } from 'react-intl';

import { checkPremium } from '../../../../backend/check-premium.web';
import { withIntlProvider } from '../../../../intl/withIntlProvider';

const APP_ID = '<APP_ID>';

const Panel: FC = () => {
  const intl = useIntl();
  const t = (id: string, values?: Record<string, string | number>) => intl.formatMessage({ id }, values);

  /* (1) Local state mirrors widget props — strings only at the prop layer */
  const [driveUrl, setDriveUrl] = useState('');
  const [viewMode, setViewMode] = useState('preview');
  const [displayHeight, setDisplayHeight] = useState(600);
  const [showBorder, setShowBorder] = useState(true);
  const [borderColor, setBorderColor] = useState('#e0e0e0');
  const [title, setTitle] = useState('');

  const [isPremium, setIsPremium] = useState(false);
  const [planLoading, setPlanLoading] = useState(true);
  const [instanceId, setInstanceId] = useState<string | undefined>();

  const upgradeUrl = instanceId
    ? `https://www.wix.com/apps/upgrade/${APP_ID}?appInstanceId=${instanceId}`
    : `https://www.wix.com/apps/upgrade/${APP_ID}`;

  /* (2) On mount: read existing props + check premium */
  useEffect(() => {
    async function loadProps() {
      try {
        const url = await widget.getProp('driveurl'); if (url) setDriveUrl(url);
        const vm = await widget.getProp('viewmode'); if (vm) setViewMode(vm);
        const dh = await widget.getProp('displayheight'); if (dh) setDisplayHeight(Number(dh));
        const sb = await widget.getProp('showborder'); if (sb) setShowBorder(sb === 'true');
        const bc = await widget.getProp('bordercolor'); if (bc) setBorderColor(bc);
        const ct = await widget.getProp('contenttitle'); if (ct) setTitle(ct);
      } catch (e) {
        console.warn('[panel] could not load widget props:', e);
      }
    }
    loadProps();

    /* (3) Premium check → propagate to widget so it can hide watermark instantly */
    checkPremium()
      .then((result) => {
        setIsPremium(result.isPremium);
        widget.setProp('ispremium', String(result.isPremium));
        if (result.instanceId) setInstanceId(result.instanceId);
      })
      .catch(() => {
        setIsPremium(false);
        widget.setProp('ispremium', 'false');
      })
      .finally(() => setPlanLoading(false));
  }, []);

  /* (4) Debounce URL writes — avoid setProp on every keystroke */
  const urlTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleUrlChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDriveUrl(value);
    if (urlTimerRef.current) clearTimeout(urlTimerRef.current);
    if (!value.trim()) {
      // empty = " " (single space) so the widget treats it as set-but-empty rather than undefined
      widget.setProp('driveurl', ' ');
      return;
    }
    urlTimerRef.current = setTimeout(() => widget.setProp('driveurl', value.trim()), 800);
  }, []);

  /* Other handlers — write immediately because they're discrete (radio / slider / toggle) */
  const handleViewModeChange = useCallback((option: { id: string | number }) => {
    const id = String(option.id);
    if (id === 'edit' && !isPremium) return;     // Premium-gated option
    setViewMode(id);
    widget.setProp('viewmode', id);
  }, [isPremium]);

  const handleHeightChange = useCallback((val: number | number[]) => {
    const num = Array.isArray(val) ? val[0] : val;
    setDisplayHeight(num);
    widget.setProp('displayheight', String(num));
  }, []);

  const handleBorderToggle = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setShowBorder(e.target.checked);
    widget.setProp('showborder', String(e.target.checked));
  }, []);

  const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTitle(value);
    widget.setProp('contenttitle', value || ' ');
  }, []);

  const viewModeOptions = [
    { id: 'preview', value: t('panel.viewPreview') },
    { id: 'edit',    value: t('panel.viewEdit'), disabled: !isPremium },
  ];

  return (
    <WixDesignSystemProvider features={{ newColorsBranding: true }}>
      <SidePanel width="100%">
        <SidePanel.Header
          title={t('panel.title')}
          suffix={
            planLoading
              ? <Loader size="tiny" />
              : isPremium
                ? <Badge size="tiny" skin="premium" prefixIcon={<Icons.PremiumFilled />}>{t('badge.premium')}</Badge>
                : <Badge size="tiny" skin="neutral">{t('badge.free')}</Badge>
          }
        />
        <SidePanel.Content>
          <Box direction="vertical" gap="24px" padding="0 0 24px">

            {/* URL input */}
            <FormField label={t('panel.driveUrlLabel')}>
              <Input value={driveUrl} onChange={handleUrlChange} placeholder={t('panel.driveUrlPlaceholder')} />
            </FormField>

            {/* View mode (premium-gated option) */}
            <FormField label={t('panel.viewModeLabel')}>
              <Dropdown options={viewModeOptions} selectedId={viewMode} onSelect={handleViewModeChange as any} />
            </FormField>
            {!isPremium && viewMode === 'edit' && (
              <Text size="tiny" secondary>
                {t('panel.editPremiumHint')}{' '}
                <TextButton as="a" href={upgradeUrl} target="_blank" size="tiny">
                  {t('button.upgrade')}
                </TextButton>
              </Text>
            )}

            {/* Title */}
            <FormField label={t('panel.titleLabel')}>
              <Input value={title} onChange={handleTitleChange} placeholder={t('panel.titlePlaceholder')} />
            </FormField>

            <Divider />

            {/* Height slider */}
            <FormField label={t('panel.heightLabel')}>
              <Slider min={200} max={1200} step={10} value={displayHeight} onChange={handleHeightChange} />
            </FormField>

            {/* Border toggle */}
            <ToggleSwitch checked={showBorder} onChange={handleBorderToggle} label={t('panel.showBorderLabel')} />

            {/* Free-tier upgrade nudge in the panel footer */}
            {!isPremium && (
              <Box direction="vertical" gap="4px" padding="12px" background="#f7f5fa" borderRadius="8px">
                <Text size="small" weight="bold">{t('panel.upgradeNudgeTitle')}</Text>
                <Text size="tiny" secondary>{t('panel.upgradeNudgeBody')}</Text>
                <TextButton as="a" href={upgradeUrl} target="_blank" prefixIcon={<Icons.PremiumFilled />} size="small">
                  {t('button.upgradeToPremium')}
                </TextButton>
              </Box>
            )}
          </Box>
        </SidePanel.Content>
      </SidePanel>
    </WixDesignSystemProvider>
  );
};

export default withIntlProvider(Panel);
