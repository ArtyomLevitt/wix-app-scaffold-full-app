import { BASIC_THEMES } from './app-config';

export type ThemeName = 'light' | 'dark' | 'minimal' | 'brand';
export type CardStyle = 'modern' | 'classic' | 'compact';
export type ButtonShape = 'rounded' | 'pill' | 'square';

export interface AdvancedDesignSettings {
  borderRadius: number;
  shadowIntensity: 'none' | 'soft' | 'medium' | 'strong';
  buttonShape: ButtonShape;
  cardBackground: string;
  cardBorderColor: string;
  accentColor: string;
}

export interface AppSettings {
  v: number;
  theme: ThemeName;
  fontFamily: string;
  highlightColor: string;
  cardStyle: CardStyle;
  showBilledAs: boolean;
  advancedDesign: AdvancedDesignSettings;
}

export const SETTINGS_VERSION = 1;

export const DEPRECATED_KEYS = ['widthValue', 'widthUnit', 'height', 'size', 'dimensions'] as const;

export const DEFAULT_ADVANCED_DESIGN: AdvancedDesignSettings = {
  borderRadius: 12,
  shadowIntensity: 'soft',
  buttonShape: 'rounded',
  cardBackground: '',
  cardBorderColor: '',
  accentColor: '',
};

export const DEFAULT_SETTINGS: AppSettings = {
  v: SETTINGS_VERSION,
  theme: 'light',
  fontFamily: '',
  highlightColor: '#6B21A8',
  cardStyle: 'modern',
  showBilledAs: true,
  advancedDesign: { ...DEFAULT_ADVANCED_DESIGN },
};

export const PREMIUM_FIELDS: (keyof AppSettings)[] = ['advancedDesign'];

const ADVANCED_KEYS = new Set(Object.keys(DEFAULT_ADVANCED_DESIGN));

export function migrateSettings(stored: Record<string, unknown>): AppSettings {
  const clean: Record<string, unknown> = {};
  const allowed = new Set([
    'v',
    'theme',
    'fontFamily',
    'highlightColor',
    'cardStyle',
    'showBilledAs',
    'advancedDesign',
  ]);

  for (const [key, value] of Object.entries(stored)) {
    if (DEPRECATED_KEYS.includes(key as (typeof DEPRECATED_KEYS)[number])) continue;
    if (allowed.has(key)) clean[key] = value;
  }

  const merged: AppSettings = {
    ...DEFAULT_SETTINGS,
    ...(clean as Partial<AppSettings>),
    advancedDesign: {
      ...DEFAULT_ADVANCED_DESIGN,
      ...((clean.advancedDesign as Partial<AdvancedDesignSettings>) ?? {}),
    },
    v: SETTINGS_VERSION,
  };

  return merged;
}

export function applyPremiumGating(settings: AppSettings, isPremium: boolean): AppSettings {
  if (isPremium) return settings;
  return {
    ...settings,
    theme: BASIC_THEMES.includes(settings.theme as (typeof BASIC_THEMES)[number])
      ? settings.theme
      : 'light',
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
    delete next[field];
  }
  if (next.theme && !BASIC_THEMES.includes(next.theme as (typeof BASIC_THEMES)[number])) {
    delete next.theme;
  }
  return next;
}

export function applyPlanBadgeGating(
  plans: Array<{ badge?: string }>,
  isPremium: boolean,
): Array<{ badge?: string }> {
  if (isPremium) return plans;
  return plans.map((p) => ({ ...p, badge: '' }));
}

export function buildWidgetStyles(
  settings: AppSettings,
  isPremium: boolean,
): Record<string, string | number> {
  const gated = applyPremiumGating(settings, isPremium);
  const adv = gated.advancedDesign;
  const shadowMap: Record<AdvancedDesignSettings['shadowIntensity'], string> = {
    none: 'none',
    soft: '0 2px 12px rgba(0,0,0,0.08)',
    medium: '0 8px 24px rgba(0,0,0,0.12)',
    strong: '0 12px 40px rgba(0,0,0,0.18)',
  };
  const btnRadius =
    adv.buttonShape === 'pill' ? 999 : adv.buttonShape === 'square' ? 4 : 8;

  return {
    ['--ppt-highlight' as string]: gated.highlightColor,
    ['--ppt-radius' as string]: `${isPremium ? adv.borderRadius : 12}px`,
    ['--ppt-shadow' as string]: isPremium ? shadowMap[adv.shadowIntensity] : shadowMap.soft,
    ['--ppt-btn-radius' as string]: `${isPremium ? btnRadius : 8}px`,
    ['--ppt-card-bg' as string]: isPremium && adv.cardBackground ? adv.cardBackground : '',
    ['--ppt-card-border' as string]:
      isPremium && adv.cardBorderColor ? adv.cardBorderColor : '',
    ['--ppt-accent' as string]:
      isPremium && adv.accentColor ? adv.accentColor : gated.highlightColor,
    fontFamily:
      gated.fontFamily ||
      '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  };
}
