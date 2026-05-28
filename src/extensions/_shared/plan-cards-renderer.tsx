import React, { type FC } from 'react';
import {
  buildCardStyles,
  getThemePalette,
  type AppSettingsRecord,
} from './app-settings-types';
import {
  parseFeatures,
  type PricingPlanRecord,
} from './pricing-plan-types';

interface PlanCardsRendererProps {
  plans: PricingPlanRecord[];
  settings: AppSettingsRecord;
  isPremium: boolean;
  showWatermark?: boolean;
  device?: 'desktop' | 'mobile';
  emptyMessage?: string;
  onCtaClick?: (plan: PricingPlanRecord) => void;
}

const PERIOD_LABELS: Record<string, string> = {
  monthly: '/mo',
  annual: '/yr',
  'one-time': '',
};

function formatPrice(price: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(price);
  } catch {
    return `$${price}`;
  }
}

export const PlanCardsRenderer: FC<PlanCardsRendererProps> = ({
  plans,
  settings,
  isPremium,
  showWatermark = false,
  device = 'desktop',
  emptyMessage = 'Add your first plan in the dashboard',
  onCtaClick,
}) => {
  const palette = getThemePalette(settings.theme, settings.highlightColor);
  const cardStyles = buildCardStyles(settings, isPremium);
  const fontFamily =
    settings.fontFamily ||
    '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

  const isCompact = settings.cardStyle === 'compact';
  const isClassic = settings.cardStyle === 'classic';

  if (!plans.length) {
    return (
      <div
        style={{
          padding: 48,
          textAlign: 'center',
          color: palette.muted,
          fontFamily,
          background: palette.background,
          borderRadius: cardStyles.borderRadius,
        }}
      >
        {emptyMessage}
      </div>
    );
  }

  return (
    <div
      style={{
        fontFamily,
        background: palette.background,
        padding: device === 'mobile' ? 12 : 20,
        borderRadius: cardStyles.borderRadius,
        minHeight: 320,
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: device === 'mobile' ? 'column' : 'row',
          gap: isCompact ? 12 : 16,
          alignItems: device === 'mobile' ? 'stretch' : 'flex-end',
          justifyContent: 'center',
        }}
      >
        {plans.map((plan) => {
          const features = parseFeatures(plan.featuresJson);
          const highlighted = plan.isHighlighted;
          const cardOverride = isPremium
            ? settings.advancedDesign.cardColors[plan._id ?? plan.name] ?? ''
            : '';
          const cardBg = cardOverride || palette.cardBg;

          return (
            <article
              key={plan._id ?? `${plan.name}-${plan.sortOrder}`}
              style={{
                flex: device === 'mobile' ? '1 1 auto' : '1 1 0',
                maxWidth: device === 'mobile' ? '100%' : 280,
                background: cardBg,
                border: highlighted
                  ? `2px solid ${palette.accent}`
                  : `1px solid ${palette.border}`,
                borderRadius: cardStyles.borderRadius,
                boxShadow: highlighted ? cardStyles.boxShadow : isClassic ? 'none' : cardStyles.boxShadow,
                padding: isCompact ? 16 : 24,
                transform: highlighted && device === 'desktop' ? 'scale(1.03)' : 'none',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              {plan.badge === 'mostPopular' && (
                <div
                  style={{
                    position: 'absolute',
                    top: -10,
                    right: 16,
                    background: palette.accent,
                    color: '#fff',
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '4px 10px',
                    borderRadius: 999,
                  }}
                >
                  Most Popular
                </div>
              )}
              {plan.badge === 'new' && (
                <div
                  style={{
                    position: 'absolute',
                    top: 12,
                    left: 12,
                    background: '#10B981',
                    color: '#fff',
                    fontSize: 10,
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 4,
                  }}
                >
                  New
                </div>
              )}
              {plan.badge === 'crown' && (
                <div style={{ fontSize: 20, lineHeight: 1 }} aria-hidden>
                  {'\u{1F451}'}
                </div>
              )}

              <div>
                <h3
                  style={{
                    margin: 0,
                    fontSize: isCompact ? 18 : 22,
                    color: palette.text,
                    fontWeight: 700,
                  }}
                >
                  {plan.name || 'Plan'}
                </h3>
                {plan.tagline && (
                  <p style={{ margin: '4px 0 0', color: palette.muted, fontSize: 13 }}>
                    {plan.tagline}
                  </p>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                <span
                  style={{
                    fontSize: highlighted ? 36 : 32,
                    fontWeight: 800,
                    color: palette.text,
                  }}
                >
                  {formatPrice(plan.price, plan.currency)}
                </span>
                {settings.showBilledAs && plan.period !== 'one-time' && (
                  <span style={{ color: palette.muted, fontSize: 14 }}>
                    {PERIOD_LABELS[plan.period] ?? ''}
                  </span>
                )}
              </div>

              <ul
                style={{
                  listStyle: 'none',
                  margin: 0,
                  padding: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  flex: 1,
                }}
              >
                {features.map((feature, idx) => (
                  <li key={idx} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <span style={{ color: palette.accent, fontWeight: 700 }}>{'\u2713'}</span>
                    <div>
                      <div style={{ color: palette.text, fontSize: 14, fontWeight: 600 }}>
                        {feature.text}
                      </div>
                      {feature.description && (
                        <div style={{ color: palette.muted, fontSize: 12, marginTop: 2 }}>
                          {feature.description}
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                onClick={() => onCtaClick?.(plan)}
                style={{
                  width: '100%',
                  border: 'none',
                  background: palette.accent,
                  color: '#fff',
                  padding: highlighted ? '14px 16px' : '12px 16px',
                  borderRadius: cardStyles.buttonBorderRadius,
                  fontWeight: 700,
                  fontSize: highlighted ? 16 : 14,
                  cursor: onCtaClick ? 'pointer' : 'default',
                }}
              >
                {plan.ctaLabel || 'Get started'}
              </button>
            </article>
          );
        })}
      </div>

      {showWatermark && (
        <div
          style={{
            marginTop: 16,
            textAlign: 'center',
            fontSize: 11,
            color: palette.muted,
            opacity: 0.8,
          }}
        >
          Powered by Pricing Plans Compare
        </div>
      )}
    </div>
  );
};
