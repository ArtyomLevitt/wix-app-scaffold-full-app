import React, { useMemo } from 'react';
import { Box, SegmentedToggle } from '@wix/design-system';
import { useIntl } from 'react-intl';
import { DEFAULT_SETTINGS, type AppSettings } from '../../../../_shared/app-settings-types';
import { PricingCardsView } from '../../../../_shared/PricingCardsView';
import type { PricingPlanRecord } from '../../../../_shared/pricing-plans-types';

interface LivePreviewProps {
  plans: PricingPlanRecord[];
  settings: AppSettings;
  isPremium: boolean;
  previewMode: 'desktop' | 'mobile';
  onPreviewModeChange: (mode: 'desktop' | 'mobile') => void;
}

export const LivePreview: React.FC<LivePreviewProps> = ({
  plans,
  settings,
  isPremium,
  previewMode,
  onPreviewModeChange,
}) => {
  const intl = useIntl();
  return (
    <Box direction="vertical" gap="SP3">
      <SegmentedToggle
        selected={previewMode}
        onClick={(_, value) => onPreviewModeChange(value as 'desktop' | 'mobile')}
      >
        <SegmentedToggle.Button value="desktop">
          {intl.formatMessage({ id: 'preview.desktop' })}
        </SegmentedToggle.Button>
        <SegmentedToggle.Button value="mobile">
          {intl.formatMessage({ id: 'preview.mobile' })}
        </SegmentedToggle.Button>
      </SegmentedToggle>
      <div
        style={{
          position: 'sticky',
          top: 16,
          border: '1px solid #e5e7eb',
          borderRadius: 12,
          overflow: 'hidden',
          maxWidth: previewMode === 'mobile' ? 390 : '100%',
          margin: previewMode === 'mobile' ? '0 auto' : undefined,
        }}
      >
        <PricingCardsView
          plans={plans}
          settings={settings ?? DEFAULT_SETTINGS}
          isPremium={isPremium}
          showWatermark={!isPremium}
          mobile={previewMode === 'mobile'}
          emptyMessage={intl.formatMessage({ id: 'widget.emptyState' })}
        />
      </div>
    </Box>
  );
};
