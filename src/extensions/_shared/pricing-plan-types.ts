export type PlanPeriod = 'monthly' | 'annual' | 'one-time';
export type PlanBadge = '' | 'mostPopular' | 'new' | 'crown';
export type CtaMode = 'wixCheckout' | 'customUrl' | 'contact';

export interface PlanFeature {
  text: string;
  description?: string;
}

export interface PricingPlanRecord {
  _id?: string;
  name: string;
  price: number;
  currency: string;
  period: PlanPeriod;
  tagline: string;
  featuresJson: string;
  badge: PlanBadge;
  isHighlighted: boolean;
  ctaMode: CtaMode;
  ctaTarget: string;
  ctaLabel: string;
  sortOrder: number;
  wixPlanId?: string;
}

export interface WixPricingPlanOption {
  _id: string;
  name: string;
  description?: string;
}

export function parseFeatures(raw: string): PlanFeature[] {
  try {
    const parsed = JSON.parse(raw || '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => ({
        text: String(item?.text ?? ''),
        description: item?.description ? String(item.description) : undefined,
      }))
      .filter((item) => item.text.trim() !== '');
  } catch {
    return [];
  }
}

export function serializeFeatures(features: PlanFeature[]): string {
  return JSON.stringify(features);
}

export function createEmptyPlan(sortOrder: number): PricingPlanRecord {
  return {
    name: '',
    price: 0,
    currency: 'USD',
    period: 'monthly',
    tagline: '',
    featuresJson: serializeFeatures([{ text: '', description: '' }]),
    badge: '',
    isHighlighted: false,
    ctaMode: 'wixCheckout',
    ctaTarget: '',
    ctaLabel: 'Get started',
    sortOrder,
    wixPlanId: '',
  };
}

export const PREMIUM_BADGES: PlanBadge[] = ['mostPopular', 'new', 'crown'];

export function stripPremiumPlanFields(
  plan: PricingPlanRecord,
  isPremium: boolean,
): PricingPlanRecord {
  if (isPremium) return plan;
  return { ...plan, badge: '' };
}

export function enforceFreePlanLimit(
  plans: PricingPlanRecord[],
  isPremium: boolean,
): PricingPlanRecord[] {
  const sorted = [...plans].sort((a, b) => a.sortOrder - b.sortOrder);
  if (isPremium) return sorted;
  return sorted.slice(0, 3);
}
