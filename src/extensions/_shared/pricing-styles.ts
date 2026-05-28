import type { CSSProperties } from 'react';
import type {
  AppSettings,
  PlanPeriod,
  PricingPlan,
} from './pricing-types';

export interface ThemeTokens {
  background: string;
  cardBackground: string;
  text: string;
  mutedText: string;
  border: string;
  accent: string;
  buttonText: string;
  featureIncluded: string;
  featureExcluded: string;
}

export function getFontStack(fontFamily: AppSettings['fontFamily']): string {
  switch (fontFamily) {
    case 'inter':
      return '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    case 'georgia':
      return 'Georgia, "Times New Roman", serif';
    case 'mono':
      return 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
    default:
      return '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
  }
}

export function getThemeTokens(
  settings: AppSettings,
  brandColor?: string,
): ThemeTokens {
  const accent = settings.highlightColor || brandColor || '#6B21A8';
  switch (settings.theme) {
    case 'dark':
      return {
        background: '#111827',
        cardBackground: '#1F2937',
        text: '#F9FAFB',
        mutedText: '#9CA3AF',
        border: '#374151',
        accent,
        buttonText: '#FFFFFF',
        featureIncluded: '#34D399',
        featureExcluded: '#6B7280',
      };
    case 'minimal':
      return {
        background: '#FFFFFF',
        cardBackground: '#FFFFFF',
        text: '#111827',
        mutedText: '#6B7280',
        border: '#E5E7EB',
        accent,
        buttonText: '#FFFFFF',
        featureIncluded: '#059669',
        featureExcluded: '#9CA3AF',
      };
    case 'brand':
      return {
        background: '#FAFAFA',
        cardBackground: '#FFFFFF',
        text: '#111827',
        mutedText: '#6B7280',
        border: accent,
        accent,
        buttonText: '#FFFFFF',
        featureIncluded: accent,
        featureExcluded: '#9CA3AF',
      };
    default:
      return {
        background: '#F3F4F6',
        cardBackground: '#FFFFFF',
        text: '#111827',
        mutedText: '#6B7280',
        border: '#E5E7EB',
        accent,
        buttonText: '#FFFFFF',
        featureIncluded: '#059669',
        featureExcluded: '#9CA3AF',
      };
  }
}

export function formatPeriod(period: PlanPeriod): string {
  switch (period) {
    case 'annual':
      return '/year';
    case 'one-time':
      return '';
    default:
      return '/mo';
  }
}

export function formatPrice(plan: PricingPlan): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: plan.currency || 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(plan.price);
  } catch {
    return `$${plan.price}`;
  }
}

export function getCardStyles(
  settings: AppSettings,
  plan: PricingPlan,
  tokens: ThemeTokens,
): CSSProperties {
  const adv = settings.advancedDesign;
  const cardOverride = plan._id ? adv.cardColors[plan._id] : undefined;
  const radius = adv.borderRadius ?? 12;
  const shadow = adv.shadowEnabled ? '0 8px 24px rgba(0,0,0,0.08)' : 'none';

  let padding = '24px';
  if (settings.cardStyle === 'compact') padding = '16px';
  if (settings.cardStyle === 'classic') padding = '28px 20px';

  return {
    background: cardOverride || tokens.cardBackground,
    border: plan.isHighlighted
      ? `2px solid ${tokens.accent}`
      : `1px solid ${tokens.border}`,
    borderRadius: radius,
    boxShadow: plan.isHighlighted ? `0 12px 32px ${tokens.accent}33` : shadow,
    padding,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    minHeight: plan.isHighlighted ? 420 : 360,
    transform: plan.isHighlighted ? 'scale(1.03)' : 'none',
    position: 'relative',
  };
}

export function getButtonRadius(settings: AppSettings): number | string {
  const shape = settings.advancedDesign.buttonShape;
  if (shape === 'pill') return 999;
  if (shape === 'square') return 4;
  return 8;
}
