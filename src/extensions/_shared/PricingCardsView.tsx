import type { AppSettings } from './app-settings-types';
import { buildWidgetStyles } from './app-settings-types';
import type { PricingPlanRecord, PlanPeriod } from './pricing-plans-types';
import React from 'react';

const PERIOD_LABELS: Record<PlanPeriod, string> = {
  monthly: '/mo',
  annual: '/yr',
  'one-time': '',
};

const THEME_STYLES: Record<AppSettings['theme'], { bg: string; text: string; card: string; muted: string }> = {
  light: { bg: '#f8f9fb', text: '#111827', card: '#ffffff', muted: '#6b7280' },
  dark: { bg: '#111827', text: '#f9fafb', card: '#1f2937', muted: '#9ca3af' },
  minimal: { bg: '#ffffff', text: '#111827', card: '#ffffff', muted: '#6b7280' },
  brand: { bg: '#f8f9fb', text: '#111827', card: '#ffffff', muted: '#6b7280' },
};

interface PricingCardsViewProps {
  plans: PricingPlanRecord[];
  settings: AppSettings;
  isPremium: boolean;
  showWatermark?: boolean;
  mobile?: boolean;
  onCtaClick?: (plan: PricingPlanRecord) => void;
  emptyMessage?: string;
}

export const PricingCardsView: React.FC<PricingCardsViewProps> = ({
  plans,
  settings,
  isPremium,
  showWatermark = false,
  mobile = false,
  onCtaClick,
  emptyMessage = 'Add your first plan in the dashboard',
}) => {
  const gatedSettings = settings;
  const theme = THEME_STYLES[gatedSettings.theme] ?? THEME_STYLES.light;
  const wrapperStyle = buildWidgetStyles(gatedSettings, isPremium);
  const sorted = [...plans].sort((a, b) => a.sortOrder - b.sortOrder);

  if (sorted.length === 0) {
    return (
      <div
        style={{
          ...wrapperStyle,
          background: theme.bg,
          color: theme.text,
          padding: 32,
          textAlign: 'center',
          borderRadius: 12,
          minHeight: 200,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {emptyMessage}
      </div>
    );
  }

  return (
    <div
      style={{
        ...wrapperStyle,
        background: theme.bg,
        color: theme.text,
        padding: mobile ? 16 : 24,
        boxSizing: 'border-box',
        width: '100%',
        minHeight: 320,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: mobile ? 'column' : 'row',
          gap: mobile ? 16 : 20,
          alignItems: mobile ? 'stretch' : 'flex-end',
          justifyContent: 'center',
        }}
      >
        {sorted.map((plan) => {
          const highlighted = plan.isHighlighted;
          const cardBg =
            (wrapperStyle['--ppt-card-bg'] as string) || theme.card;
          const borderColor = highlighted
            ? (wrapperStyle['--ppt-accent'] as string) || gatedSettings.highlightColor
            : (wrapperStyle['--ppt-card-border'] as string) || '#e5e7eb';
          return (
            <div
              key={plan._id ?? plan.name}
              style={{
                flex: mobile ? '1 1 auto' : '1 1 0',
                maxWidth: mobile ? '100%' : 280,
                background: cardBg,
                border: `2px solid ${borderColor}`,
                borderRadius: Number(wrapperStyle['--ppt-radius'] ?? 12),
                boxShadow: String(wrapperStyle['--ppt-shadow'] ?? '0 2px 12px rgba(0,0,0,0.08)'),
                padding: highlighted ? 28 : 22,
                transform: highlighted && !mobile ? 'scale(1.03)' : 'none',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                minHeight: highlighted ? 420 : 380,
              }}
            >
              {plan.badge === 'most_popular' && (
                <div
                  style={{
                    position: 'absolute',
                    top: -12,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: gatedSettings.highlightColor,
                    color: '#fff',
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '4px 12px',
                    borderRadius: 999,
                    letterSpacing: '0.5px',
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
                    right: 12,
                    background: '#10b981',
                    color: '#fff',
                    fontSize: 10,
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: 6,
                  }}
                >
                  New
                </div>
              )}
              {plan.badge === 'crown' && (
                <div style={{ position: 'absolute', top: 12, right: 12, fontSize: 18 }}>👑</div>
              )}
              <div style={{ fontSize: 13, color: theme.muted, marginBottom: 4 }}>{plan.tagline}</div>
              <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>{plan.name}</div>
              <div style={{ marginBottom: 16 }}>
                <span style={{ fontSize: 32, fontWeight: 800 }}>{plan.price || '$0'}</span>
                <span style={{ fontSize: 14, color: theme.muted }}>
                  {PERIOD_LABELS[plan.period]}
                </span>
                {settings.showBilledAs && plan.period === 'annual' && (
                  <div style={{ fontSize: 12, color: theme.muted, marginTop: 4 }}>Billed annually</div>
                )}
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px', flex: 1 }}>
                {(plan.featuresJson ?? []).map((feature, idx) => (
                  <li
                    key={`${feature.label}-${idx}`}
                    style={{
                      display: 'flex',
                      gap: 8,
                      marginBottom: 8,
                      fontSize: 14,
                      opacity: feature.included ? 1 : 0.45,
                      textDecoration: feature.included ? 'none' : 'line-through',
                    }}
                  >
                    <span style={{ color: feature.included ? '#10b981' : theme.muted }}>✓</span>
                    {feature.label}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => onCtaClick?.(plan)}
                style={{
                  width: '100%',
                  padding: highlighted ? '14px 16px' : '12px 16px',
                  fontSize: highlighted ? 16 : 14,
                  fontWeight: 700,
                  border: 'none',
                  borderRadius: Number(wrapperStyle['--ppt-btn-radius'] ?? 8),
                  background: (wrapperStyle['--ppt-accent'] as string) || gatedSettings.highlightColor,
                  color: '#fff',
                  cursor: onCtaClick ? 'pointer' : 'default',
                }}
              >
                {plan.ctaLabel || 'Get started'}
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
            color: theme.muted,
            opacity: 0.8,
          }}
        >
          Powered by Pricing Plans Compare
        </div>
      )}
    </div>
  );
};
