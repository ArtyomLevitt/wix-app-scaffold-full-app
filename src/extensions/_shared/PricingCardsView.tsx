import React, { type FC, type ReactNode } from 'react';
import {
  applyPremiumGating,
  buildWidgetStyles,
  parseFeatures,
  type AppSettings,
  type PricingPlanRow,
} from './pricing-types';

interface PricingCardsProps {
  settings: AppSettings;
  plans: PricingPlanRow[];
  isPremium: boolean;
  showWatermark?: boolean;
  device?: 'desktop' | 'mobile';
  onCtaClick?: (plan: PricingPlanRow) => void;
  labels?: {
    emptyTitle?: string;
    emptyDesc?: string;
    watermark?: string;
    billedAs?: string;
    contactTitle?: string;
    contactSubmit?: string;
    badgeMostPopular?: string;
    badgeNew?: string;
    badgeCrown?: string;
  };
}

const badgeLabel = (badge: string, labels: PricingCardsProps['labels']) => {
  if (badge === 'mostPopular') return labels?.badgeMostPopular || 'Most Popular';
  if (badge === 'new') return labels?.badgeNew || 'New';
  if (badge === 'crown') return labels?.badgeCrown || 'Premium';
  return '';
};

export const PricingCardsView: FC<PricingCardsProps> = ({
  settings,
  plans,
  isPremium,
  showWatermark = !isPremium,
  device = 'desktop',
  onCtaClick,
  labels = {},
}) => {
  const gated = applyPremiumGating(settings, isPremium);
  const styles = buildWidgetStyles(gated, isPremium);
  const isMobile = device === 'mobile';
  const sorted = [...plans].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  if (sorted.length === 0) {
    return (
      <div style={{ ...styles.container, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', padding: 32 }}>
          <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
            {labels.emptyTitle || 'No pricing plans yet'}
          </div>
          <div style={{ fontSize: 14, opacity: 0.7 }}>
            {labels.emptyDesc || 'Add plans in the dashboard to display them here.'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div
        style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          gap: 16,
          alignItems: isMobile ? 'stretch' : 'flex-end',
          justifyContent: 'center',
        }}
      >
        {sorted.map((plan) => {
          const features = parseFeatures(plan.featuresJson);
          const badge = isPremium && plan.badge !== 'none' ? plan.badge : 'none';
          const highlighted = plan.highlighted;
          const cardStyle: React.CSSProperties = {
            ...styles.cardBase,
            flex: isMobile ? 'none' : '1 1 0',
            minWidth: isMobile ? 'auto' : 180,
            maxWidth: isMobile ? '100%' : 280,
            padding: gated.cardStyle === 'compact' ? 16 : 24,
            border: highlighted
              ? `2px solid ${gated.highlightColor}`
              : plan.cardBorderColor
                ? `1px solid ${plan.cardBorderColor}`
                : '1px solid #e4e6eb',
            background: plan.cardColor || (gated.theme === 'dark' ? '#252540' : '#fff'),
            transform: highlighted ? 'scale(1.03)' : 'none',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            minHeight: highlighted ? 380 : 340,
          };

          return (
            <div key={plan._id || plan.name + plan.sortOrder} style={cardStyle}>
              {badge !== 'none' && (
                <div
                  style={{
                    position: 'absolute',
                    top: -10,
                    right: 16,
                    background: gated.highlightColor,
                    color: '#fff',
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '4px 10px',
                    borderRadius: 4,
                    textTransform: 'uppercase',
                  }}
                >
                  {badgeLabel(badge, labels)}
                </div>
              )}
              <div style={{ fontSize: gated.cardStyle === 'compact' ? 16 : 20, fontWeight: 700, marginBottom: 4 }}>
                {plan.name || 'Plan'}
              </div>
              <div style={{ marginBottom: 8 }}>
                <span style={{ fontSize: 32, fontWeight: 800 }}>{plan.price || '$0'}</span>
                <span style={{ fontSize: 14, opacity: 0.7 }}>{plan.period || '/mo'}</span>
              </div>
              {plan.tagline && (
                <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 16 }}>{plan.tagline}</div>
              )}
              {gated.showBilledAsNote && plan.period && (
                <div style={{ fontSize: 11, opacity: 0.6, marginBottom: 12 }}>
                  {labels.billedAs || 'Billed as shown above'}
                </div>
              )}
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px', flex: 1 }}>
                {features.map((f, i) => (
                  <li
                    key={i}
                    style={{
                      display: 'flex',
                      gap: 8,
                      marginBottom: 8,
                      fontSize: 13,
                      opacity: f.included ? 1 : 0.45,
                      textDecoration: f.included ? 'none' : 'line-through',
                    }}
                  >
                    <span style={{ color: f.included ? '#22c55e' : '#999' }}>
                      {f.included ? '\u2713' : '\u2717'}
                    </span>
                    {f.label}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                style={{
                  ...styles.buttonBase,
                  fontSize: highlighted ? 16 : 14,
                  padding: highlighted ? '14px 24px' : '12px 24px',
                }}
                onClick={() => onCtaClick?.(plan)}
              >
                {plan.ctaLabel || 'Get Started'}
              </button>
            </div>
          );
        })}
      </div>
      {showWatermark && (
        <div
          style={{
            marginTop: 16,
            textAlign: 'center',
            fontSize: 11,
            opacity: 0.55,
            letterSpacing: '0.5px',
          }}
        >
          {labels.watermark || 'Powered by Pricing Plans Compare'}
        </div>
      )}
    </div>
  );
};

export default PricingCardsView;
