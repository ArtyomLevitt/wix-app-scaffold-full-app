import React, { type FC, type CSSProperties } from 'react';
import type { AppSettings, PricingPlan } from './pricing-types';
import {
  formatPeriod,
  formatPrice,
  getButtonRadius,
  getCardStyles,
  getFontStack,
  getThemeTokens,
  type ThemeTokens,
} from './pricing-styles';

interface PricingCardsProps {
  plans: PricingPlan[];
  settings: AppSettings;
  isPremium: boolean;
  isMobile?: boolean;
  onCtaClick?: (plan: PricingPlan) => void;
  emptyLabel?: string;
  showWatermark?: boolean;
  watermarkLabel?: string;
}

const CheckIcon: FC<{ color: string }> = ({ color }) => (
  <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
    <path
      d="M3 8.5l3 3 7-7"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const XIcon: FC<{ color: string }> = ({ color }) => (
  <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
    <path
      d="M4 4l8 8M12 4L4 12"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

function badgeLabel(badge: PricingPlan['badge']): string | null {
  if (badge === 'most-popular') return 'Most Popular';
  if (badge === 'new') return 'New';
  if (badge === 'crown') return 'Premium';
  return null;
}

const PlanCard: FC<{
  plan: PricingPlan;
  settings: AppSettings;
  tokens: ThemeTokens;
  onCtaClick?: (plan: PricingPlan) => void;
}> = ({ plan, settings, tokens, onCtaClick }) => {
  const badge = badgeLabel(plan.badge);
  const cardStyle = getCardStyles(settings, plan, tokens);
  const buttonStyle: CSSProperties = {
    background: tokens.accent,
    color: tokens.buttonText,
    border: 'none',
    borderRadius: getButtonRadius(settings),
    padding: plan.isHighlighted ? '14px 20px' : '12px 18px',
    fontSize: plan.isHighlighted ? 16 : 14,
    fontWeight: 600,
    cursor: 'pointer',
    width: '100%',
    marginTop: 'auto',
  };

  return (
    <div style={cardStyle}>
      {badge ? (
        <div
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            background: tokens.accent,
            color: tokens.buttonText,
            fontSize: 11,
            fontWeight: 700,
            padding: '4px 10px',
            borderRadius: 999,
            textTransform: 'uppercase',
            letterSpacing: '0.4px',
          }}
        >
          {badge}
        </div>
      ) : null}
      <div style={{ fontSize: 20, fontWeight: 700, color: tokens.text }}>
        {plan.name || 'Plan name'}
      </div>
      {plan.tagline ? (
        <div style={{ fontSize: 14, color: tokens.mutedText }}>{plan.tagline}</div>
      ) : null}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span style={{ fontSize: plan.isHighlighted ? 36 : 32, fontWeight: 800, color: tokens.text }}>
          {formatPrice(plan)}
        </span>
        <span style={{ fontSize: 14, color: tokens.mutedText }}>
          {formatPeriod(plan.period)}
        </span>
      </div>
      {settings.showBilledAs && plan.period === 'annual' ? (
        <div style={{ fontSize: 12, color: tokens.mutedText }}>Billed annually</div>
      ) : null}
      <ul style={{ listStyle: 'none', padding: 0, margin: '8px 0', flex: 1 }}>
        {(plan.featuresJson ?? []).map((feature, idx) => (
          <li
            key={`${feature.label}-${idx}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 8,
              fontSize: 14,
              color: feature.included ? tokens.text : tokens.featureExcluded,
              textDecoration: feature.included ? 'none' : 'line-through',
            }}
          >
            {feature.included ? (
              <CheckIcon color={tokens.featureIncluded} />
            ) : (
              <XIcon color={tokens.featureExcluded} />
            )}
            <span>{feature.label || 'Feature'}</span>
          </li>
        ))}
      </ul>
      <button type="button" style={buttonStyle} onClick={() => onCtaClick?.(plan)}>
        {plan.ctaLabel || 'Get Started'}
      </button>
    </div>
  );
};

export const PricingCards: FC<PricingCardsProps> = ({
  plans,
  settings,
  isPremium,
  isMobile,
  onCtaClick,
  emptyLabel = 'Add your first pricing plan in the app dashboard.',
  showWatermark,
  watermarkLabel = 'Powered by Pricing Plans Compare',
}) => {
  const tokens = getThemeTokens(settings);
  const font = getFontStack(settings.fontFamily);
  const visiblePlans = plans.filter((p) => p.name?.trim());

  const containerStyle: CSSProperties = {
    fontFamily: font,
    background: tokens.background,
    padding: isMobile ? 16 : 24,
    borderRadius: settings.advancedDesign.borderRadius ?? 12,
    minHeight: 320,
    width: '100%',
    height: '100%',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  };

  const gridStyle: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: isMobile
      ? '1fr'
      : `repeat(${Math.max(visiblePlans.length || 1, 1)}, minmax(0, 1fr))`,
    gap: 16,
    alignItems: 'stretch',
    flex: 1,
  };

  return (
    <div style={containerStyle}>
      <div style={gridStyle}>
        {visiblePlans.length === 0 ? (
          <div
            style={{
              ...getCardStyles(settings, createEmptyPreviewPlan(), tokens),
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              color: tokens.mutedText,
            }}
          >
            {emptyLabel}
          </div>
        ) : (
          visiblePlans.map((plan) => (
            <PlanCard
              key={plan._id ?? plan.name}
              plan={plan}
              settings={settings}
              tokens={tokens}
              onCtaClick={onCtaClick}
            />
          ))
        )}
      </div>
      {(showWatermark || !isPremium) && (
        <div
          style={{
            textAlign: 'center',
            fontSize: 11,
            color: tokens.mutedText,
            letterSpacing: '1px',
            textTransform: 'uppercase',
          }}
        >
          {watermarkLabel}
        </div>
      )}
    </div>
  );
};

function createEmptyPreviewPlan(): PricingPlan {
  return {
    name: '',
    price: 0,
    currency: 'USD',
    period: 'monthly',
    tagline: '',
    featuresJson: [],
    badge: '',
    isHighlighted: false,
    ctaMode: 'wix_plan',
    ctaTarget: '',
    ctaLabel: '',
    sortOrder: 0,
  };
}

export default PricingCards;
