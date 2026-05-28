import React, { type FC } from 'react';
import { PlanCardsRenderer } from '../../../../_shared/plan-cards-renderer';
import type { AppSettingsRecord } from '../../../../_shared/app-settings-types';
import type { PricingPlanRecord } from '../../../../_shared/pricing-plan-types';

interface LivePreviewProps {
  plans: PricingPlanRecord[];
  settings: AppSettingsRecord;
  isPremium: boolean;
  device: 'desktop' | 'mobile';
}

export const LivePreview: FC<LivePreviewProps> = ({
  plans,
  settings,
  isPremium,
  device,
}) => (
  <PlanCardsRenderer
    plans={plans}
    settings={settings}
    isPremium={isPremium}
    showWatermark={!isPremium}
    device={device}
    emptyMessage="Add your first plan in the dashboard"
  />
);
