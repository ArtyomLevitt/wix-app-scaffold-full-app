export type PlanPeriod = 'monthly' | 'annual' | 'one-time';
export type PlanBadge = '' | 'most-popular' | 'new' | 'crown';
export type CtaMode = 'wix_plan' | 'custom_url' | 'contact';

export interface PlanFeature {
  label: string;
  included: boolean;
}

export interface PricingPlan {
  _id?: string;
  name: string;
  price: number;
  currency: string;
  period: PlanPeriod;
  tagline: string;
  featuresJson: PlanFeature[];
  badge: PlanBadge;
  isHighlighted: boolean;
  ctaMode: CtaMode;
  ctaTarget: string;
  ctaLabel: string;
  sortOrder: number;
}

export interface AdvancedDesign {
  borderRadius: number;
  shadowEnabled: boolean;
  buttonShape: 'rounded' | 'pill' | 'square';
  cardColors: Record<string, string>;
}

export type ThemeOption = 'light' | 'dark' | 'minimal' | 'brand';
export type CardStyleOption = 'modern' | 'classic' | 'compact';
export type FontOption = 'system' | 'inter' | 'georgia' | 'mono';

export interface AppSettings {
  theme: ThemeOption;
  fontFamily: FontOption;
  highlightColor: string;
  cardStyle: CardStyleOption;
  showBilledAs: boolean;
  advancedDesign: AdvancedDesign;
  _v: number;
}

export const SETTINGS_VERSION = 1;

export const DEFAULT_ADVANCED_DESIGN: AdvancedDesign = {
  borderRadius: 12,
  shadowEnabled: true,
  buttonShape: 'rounded',
  cardColors: {},
};

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'light',
  fontFamily: 'system',
  highlightColor: '#6B21A8',
  cardStyle: 'modern',
  showBilledAs: true,
  advancedDesign: DEFAULT_ADVANCED_DESIGN,
  _v: SETTINGS_VERSION,
};

export const DEPRECATED_KEYS: string[] = [];

export const PREMIUM_FIELDS: (keyof AppSettings | 'advancedDesign')[] = [
  'advancedDesign',
];

export function migrateSettings(stored: Partial<AppSettings> | null | undefined): AppSettings {
  const raw = stored ?? {};
  const cleaned: Partial<AppSettings> = {};
  const allowed = new Set([
    'theme',
    'fontFamily',
    'highlightColor',
    'cardStyle',
    'showBilledAs',
    'advancedDesign',
    '_v',
  ]);

  for (const [key, value] of Object.entries(raw)) {
    if (DEPRECATED_KEYS.includes(key)) continue;
    if (allowed.has(key)) {
      (cleaned as Record<string, unknown>)[key] = value;
    }
  }

  return {
    ...DEFAULT_SETTINGS,
    ...cleaned,
    advancedDesign: {
      ...DEFAULT_ADVANCED_DESIGN,
      ...(cleaned.advancedDesign ?? {}),
    },
    _v: SETTINGS_VERSION,
  };
}

export function applyPremiumGating(
  settings: AppSettings,
  isPremium: boolean,
): AppSettings {
  if (isPremium) return settings;
  return {
    ...settings,
    advancedDesign: { ...DEFAULT_ADVANCED_DESIGN },
  };
}

export function stripPremiumFromPatch(
  patch: Partial<AppSettings>,
  isPremium: boolean,
): Partial<AppSettings> {
  if (isPremium) return patch;
  const next = { ...patch };
  for (const field of PREMIUM_FIELDS) {
    delete (next as Record<string, unknown>)[field];
  }
  return next;
}

export function createEmptyPlan(sortOrder: number): PricingPlan {
  return {
    name: '',
    price: 0,
    currency: 'USD',
    period: 'monthly',
    tagline: '',
    featuresJson: [{ label: '', included: true }],
    badge: '',
    isHighlighted: false,
    ctaMode: 'wix_plan',
    ctaTarget: '',
    ctaLabel: 'Get Started',
    sortOrder,
  };
}

export function normalizePlan(raw: Partial<PricingPlan> & { _id?: string }): PricingPlan {
  let features: PlanFeature[] = [];
  if (Array.isArray(raw.featuresJson)) {
    features = raw.featuresJson.map((f) => ({
      label: String(f?.label ?? ''),
      included: f?.included !== false,
    }));
  } else if (typeof raw.featuresJson === 'string') {
    try {
      const parsed = JSON.parse(raw.featuresJson);
      if (Array.isArray(parsed)) {
        features = parsed.map((f: PlanFeature) => ({
          label: String(f?.label ?? ''),
          included: f?.included !== false,
        }));
      }
    } catch {
      features = [{ label: '', included: true }];
    }
  }
  if (!features.length) features = [{ label: '', included: true }];

  return {
    _id: raw._id,
    name: String(raw.name ?? ''),
    price: Number(raw.price ?? 0),
    currency: String(raw.currency ?? 'USD'),
    period: (['monthly', 'annual', 'one-time'].includes(String(raw.period))
      ? raw.period
      : 'monthly') as PlanPeriod,
    tagline: String(raw.tagline ?? ''),
    featuresJson: features,
    badge: (['', 'most-popular', 'new', 'crown'].includes(String(raw.badge))
      ? raw.badge
      : '') as PlanBadge,
    isHighlighted: Boolean(raw.isHighlighted),
    ctaMode: (['wix_plan', 'custom_url', 'contact'].includes(String(raw.ctaMode))
      ? raw.ctaMode
      : 'wix_plan') as CtaMode,
    ctaTarget: String(raw.ctaTarget ?? ''),
    ctaLabel: String(raw.ctaLabel ?? 'Get Started'),
    sortOrder: Number(raw.sortOrder ?? 0),
  };
}

export function planRecordToPlan(item: Record<string, unknown>): PricingPlan {
  return normalizePlan({
    _id: String(item._id ?? ''),
    name: item.name as string,
    price: item.price as number,
    currency: item.currency as string,
    period: item.period as PlanPeriod,
    tagline: item.tagline as string,
    featuresJson: item.featuresJson as PlanFeature[],
    badge: item.badge as PlanBadge,
    isHighlighted: item.isHighlighted as boolean,
    ctaMode: item.ctaMode as CtaMode,
    ctaTarget: item.ctaTarget as string,
    ctaLabel: item.ctaLabel as string,
    sortOrder: item.sortOrder as number,
  });
}

export interface WidgetDataResponse {
  plans: PricingPlan[];
  settings: AppSettings;
  isPremium: boolean;
}
