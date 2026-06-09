export type PlanPeriod = 'monthly' | 'annual' | 'one-time';
export type PlanBadge = '' | 'most_popular' | 'new' | 'crown';
export type CtaMode = 'wix_plan' | 'custom_url' | 'contact_us';

export interface PlanFeature {
  label: string;
  included: boolean;
}

export interface PricingPlanRecord {
  _id?: string;
  name: string;
  price: string;
  period: PlanPeriod;
  tagline: string;
  featuresJson: PlanFeature[];
  badge: PlanBadge;
  ctaMode: CtaMode;
  ctaLabel: string;
  ctaTarget: string;
  wixPricingPlanId: string;
  sortOrder: number;
  isHighlighted: boolean;
}

export const DEFAULT_FEATURE: PlanFeature = { label: '', included: true };

export function createEmptyPlan(sortOrder: number): PricingPlanRecord {
  return {
    name: '',
    price: '',
    period: 'monthly',
    tagline: '',
    featuresJson: [{ label: 'Feature 1', included: true }],
    badge: '',
    ctaMode: 'wix_plan',
    ctaLabel: 'Get started',
    ctaTarget: '',
    wixPricingPlanId: '',
    sortOrder,
    isHighlighted: false,
  };
}

export function normalizeFeatures(raw: unknown): PlanFeature[] {
  if (!Array.isArray(raw)) return [{ label: 'Feature 1', included: true }];
  return raw
    .map((item) => {
      if (typeof item === 'string') return { label: item, included: true };
      if (item && typeof item === 'object') {
        const o = item as Record<string, unknown>;
        return {
          label: String(o.label ?? ''),
          included: o.included !== false,
        };
      }
      return null;
    })
    .filter((f): f is PlanFeature => !!f && f.label.trim().length > 0);
}

export function parsePlanItem(item: Record<string, unknown>): PricingPlanRecord {
  return {
    _id: item._id as string | undefined,
    name: String(item.name ?? ''),
    price: String(item.price ?? ''),
    period: (item.period as PlanPeriod) ?? 'monthly',
    tagline: String(item.tagline ?? ''),
    featuresJson: normalizeFeatures(item.featuresJson),
    badge: (item.badge as PlanBadge) ?? '',
    ctaMode: (item.ctaMode as CtaMode) ?? 'wix_plan',
    ctaLabel: String(item.ctaLabel ?? 'Get started'),
    ctaTarget: String(item.ctaTarget ?? ''),
    wixPricingPlanId: String(item.wixPricingPlanId ?? ''),
    sortOrder: Number(item.sortOrder ?? 0),
    isHighlighted: Boolean(item.isHighlighted),
  };
}
