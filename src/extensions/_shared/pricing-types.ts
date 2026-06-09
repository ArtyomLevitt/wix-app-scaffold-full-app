export type ThemeId = 'light' | 'dark' | 'minimal' | 'brand';
export type CardStyleId = 'modern' | 'classic' | 'compact';
export type BadgeId = 'none' | 'mostPopular' | 'new' | 'crown';
export type CtaMode = 'wixCheckout' | 'customUrl' | 'contactForm';
export type ButtonShape = 'rounded' | 'pill' | 'square';
export type ShadowDepth = 'none' | 'soft' | 'medium' | 'strong';
export type FontId = 'system' | 'inter' | 'poppins' | 'roboto';

export interface PlanFeature {
  label: string;
  included: boolean;
}

export interface PricingPlanRow {
  _id?: string;
  name: string;
  price: string;
  period: string;
  tagline: string;
  featuresJson: string;
  badge: BadgeId;
  ctaMode: CtaMode;
  ctaLabel: string;
  wixPlanId: string;
  customUrl: string;
  contactEmail: string;
  highlighted: boolean;
  sortOrder: number;
  cardColor: string;
  cardBorderColor: string;
}

export interface AppSettings {
  v: number;
  theme: ThemeId;
  font: FontId;
  highlightColor: string;
  cardStyle: CardStyleId;
  showBilledAsNote: boolean;
  borderRadius: number;
  shadowDepth: ShadowDepth;
  buttonShape: ButtonShape;
}

export const SETTINGS_VERSION = 1;

export const DEPRECATED_KEYS = ['widthValue', 'widthUnit', 'height', 'size', 'dimensions'] as const;

export const DEFAULT_SETTINGS: AppSettings = {
  v: SETTINGS_VERSION,
  theme: 'light',
  font: 'system',
  highlightColor: '#6B21A8',
  cardStyle: 'modern',
  showBilledAsNote: true,
  borderRadius: 12,
  shadowDepth: 'soft',
  buttonShape: 'rounded',
};

export const PREMIUM_FIELDS: (keyof AppSettings)[] = [
  'theme',
  'borderRadius',
  'shadowDepth',
  'buttonShape',
];

export function parseFeatures(raw: string): PlanFeature[] {
  try {
    const parsed = JSON.parse(raw || '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((f) => f && typeof f.label === 'string');
  } catch {
    return [];
  }
}

export function defaultPlan(sortOrder: number): PricingPlanRow {
  return {
    name: '',
    price: '',
    period: '/mo',
    tagline: '',
    featuresJson: JSON.stringify([{ label: '', included: true }]),
    badge: 'none',
    ctaMode: 'wixCheckout',
    ctaLabel: 'Get Started',
    wixPlanId: '',
    customUrl: '',
    contactEmail: '',
    highlighted: false,
    sortOrder,
    cardColor: '',
    cardBorderColor: '',
  };
}

export function migrateSettings(stored: Record<string, unknown>): AppSettings {
  const allowed = new Set(Object.keys(DEFAULT_SETTINGS));
  const clean: Record<string, unknown> = {};
  for (const key of Object.keys(stored)) {
    if (DEPRECATED_KEYS.includes(key as (typeof DEPRECATED_KEYS)[number])) continue;
    if (allowed.has(key)) clean[key] = stored[key];
  }
  return { ...DEFAULT_SETTINGS, ...clean, v: SETTINGS_VERSION } as AppSettings;
}

export function applyPremiumGating(settings: AppSettings, isPremium: boolean): AppSettings {
  if (isPremium) return migrateSettings(settings as unknown as Record<string, unknown>);
  const gated = migrateSettings(settings as unknown as Record<string, unknown>);
  if (!['light', 'minimal'].includes(gated.theme)) {
    gated.theme = 'light';
  }
  gated.borderRadius = DEFAULT_SETTINGS.borderRadius;
  gated.shadowDepth = DEFAULT_SETTINGS.shadowDepth;
  gated.buttonShape = DEFAULT_SETTINGS.buttonShape;
  return gated;
}

export function applyPlanPremiumGating(plan: PricingPlanRow, isPremium: boolean): PricingPlanRow {
  if (isPremium) return plan;
  return {
    ...plan,
    badge: plan.badge === 'none' ? 'none' : 'none',
    cardColor: '',
    cardBorderColor: '',
  };
}

export function stripPremiumFieldsFromPatch(
  patch: Partial<AppSettings>,
  isPremium: boolean,
): Partial<AppSettings> {
  if (isPremium) return patch;
  const next = { ...patch };
  for (const field of PREMIUM_FIELDS) {
    if (field in next) delete next[field];
  }
  return next;
}

export function stripPremiumPlanFields(plan: PricingPlanRow, isPremium: boolean): PricingPlanRow {
  if (isPremium) return plan;
  return {
    ...plan,
    badge: plan.badge === 'none' ? 'none' : 'none',
    cardColor: '',
    cardBorderColor: '',
  };
}

export function validateCustomUrl(raw: string): { ok: boolean; normalized: string; reason?: string } {
  const trimmed = (raw || '').trim();
  if (!trimmed) return { ok: true, normalized: '' };
  try {
    const url = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
    if (!['http:', 'https:'].includes(url.protocol)) {
      return { ok: false, normalized: trimmed, reason: 'URL must use http or https' };
    }
    return { ok: true, normalized: url.toString() };
  } catch {
    return { ok: false, normalized: trimmed, reason: 'Enter a valid URL' };
  }
}

export function validateWixPlanId(raw: string): { ok: boolean; normalized: string; reason?: string } {
  const trimmed = (raw || '').trim();
  if (!trimmed) return { ok: false, normalized: '', reason: 'Select a Wix Pricing Plan' };
  if (!/^[a-f0-9-]{36}$/i.test(trimmed)) {
    return { ok: false, normalized: trimmed, reason: 'Invalid plan ID format' };
  }
  return { ok: true, normalized: trimmed };
}

export interface WidgetPayload {
  settings: AppSettings;
  plans: PricingPlanRow[];
  isPremium: boolean;
  showWatermark: boolean;
}

export function buildWidgetStyles(settings: AppSettings, isPremium: boolean): {
  container: Record<string, string | number>;
  cardBase: Record<string, string | number>;
  buttonBase: Record<string, string | number>;
} {
  const gated = applyPremiumGating(settings, isPremium);
  const radius = isPremium ? gated.borderRadius : DEFAULT_SETTINGS.borderRadius;
  const shadowMap: Record<ShadowDepth, string> = {
    none: 'none',
    soft: '0 2px 8px rgba(0,0,0,0.08)',
    medium: '0 4px 16px rgba(0,0,0,0.12)',
    strong: '0 8px 32px rgba(0,0,0,0.16)',
  };
  const shadow = isPremium ? shadowMap[gated.shadowDepth] : shadowMap.soft;
  const btnRadius =
    gated.buttonShape === 'pill' ? 999 : gated.buttonShape === 'square' ? 4 : 8;
  const fontStacks: Record<FontId, string> = {
    system:
      '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    inter: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
    poppins: '"Poppins", -apple-system, sans-serif',
    roboto: '"Roboto", -apple-system, sans-serif',
  };
  const themeBg: Record<ThemeId, string> = {
    light: '#ffffff',
    dark: '#1a1a2e',
    minimal: '#fafafa',
    brand: '#ffffff',
  };
  const themeText: Record<ThemeId, string> = {
    light: '#162d3d',
    dark: '#f5f5f5',
    minimal: '#333333',
    brand: '#162d3d',
  };
  return {
    container: {
      fontFamily: fontStacks[gated.font],
      color: themeText[gated.theme],
      background: themeBg[gated.theme],
      width: '100%',
      height: '100%',
      minHeight: 320,
      boxSizing: 'border-box',
      padding: 16,
    },
    cardBase: {
      borderRadius: radius,
      boxShadow: shadow,
    },
    buttonBase: {
      borderRadius: btnRadius,
      background: gated.highlightColor,
      color: '#fff',
      border: 'none',
      padding: '12px 24px',
      fontWeight: 600,
      cursor: 'pointer',
      width: '100%',
    },
  };
}
