export type ThemePreset = 'light' | 'dark' | 'minimal' | 'brand';
export type CardStyle = 'modern' | 'classic' | 'compact';
export type ButtonShape = 'rounded' | 'pill' | 'square';

export interface AdvancedDesignSettings {
  borderRadius: number;
  shadowEnabled: boolean;
  buttonShape: ButtonShape;
  cardColors: Record<string, string>;
}

export interface AppSettingsRecord {
  theme: ThemePreset;
  fontFamily: string;
  highlightColor: string;
  cardStyle: CardStyle;
  showBilledAs: boolean;
  advancedDesign: AdvancedDesignSettings;
}

export const SETTINGS_VERSION = 1;

export const DEPRECATED_KEYS: string[] = [];

export const DEFAULT_SETTINGS: AppSettingsRecord = {
  theme: 'light',
  fontFamily: '',
  highlightColor: '#6B21A8',
  cardStyle: 'modern',
  showBilledAs: true,
  advancedDesign: {
    borderRadius: 16,
    shadowEnabled: true,
    buttonShape: 'rounded',
    cardColors: {},
  },
};

export const PREMIUM_FIELDS: Array<keyof AppSettingsRecord> = [
  'advancedDesign',
];

const PREMIUM_DEFAULTS: Partial<AppSettingsRecord> = {
  advancedDesign: DEFAULT_SETTINGS.advancedDesign,
};

export function applyPremiumGating(
  settings: AppSettingsRecord,
  isPremium: boolean,
): AppSettingsRecord {
  if (isPremium) return settings;
  const gated = { ...settings };
  for (const field of PREMIUM_FIELDS) {
    const fallback = PREMIUM_DEFAULTS[field];
    if (fallback !== undefined) {
      (gated as Record<string, unknown>)[field] = fallback;
    }
  }
  return gated;
}

export function migrateSettings(
  stored: Partial<AppSettingsRecord> & { _v?: number },
): AppSettingsRecord & { _v: number } {
  const clean: Record<string, unknown> = {};
  const allowedKeys: Array<keyof AppSettingsRecord> = [
    'theme',
    'fontFamily',
    'highlightColor',
    'cardStyle',
    'showBilledAs',
    'advancedDesign',
  ];
  for (const key of allowedKeys) {
    if (stored[key] !== undefined) clean[key] = stored[key];
  }
  for (const key of DEPRECATED_KEYS) {
    delete clean[key];
  }
  return {
    ...DEFAULT_SETTINGS,
    ...(clean as Partial<AppSettingsRecord>),
    _v: SETTINGS_VERSION,
  };
}

export type StoredAppSettings = AppSettingsRecord & { _v: number };

export function buildCardStyles(
  settings: AppSettingsRecord,
  isPremium: boolean,
): {
  borderRadius: number;
  boxShadow: string;
  buttonBorderRadius: number;
} {
  const advanced = isPremium ? settings.advancedDesign : DEFAULT_SETTINGS.advancedDesign;
  const radius = advanced.borderRadius ?? DEFAULT_SETTINGS.advancedDesign.borderRadius;
  const shadow = advanced.shadowEnabled
    ? '0 8px 24px rgba(15, 23, 42, 0.12)'
    : 'none';
  const buttonRadius =
    advanced.buttonShape === 'pill'
      ? 999
      : advanced.buttonShape === 'square'
        ? 4
        : Math.max(8, radius - 4);
  return { borderRadius: radius, boxShadow: shadow, buttonBorderRadius: buttonRadius };
}

export function getThemePalette(theme: ThemePreset, highlightColor: string) {
  switch (theme) {
    case 'dark':
      return {
        background: '#0F172A',
        cardBg: '#1E293B',
        text: '#F8FAFC',
        muted: '#94A3B8',
        border: '#334155',
        accent: highlightColor,
      };
    case 'minimal':
      return {
        background: '#FFFFFF',
        cardBg: '#FFFFFF',
        text: '#111827',
        muted: '#6B7280',
        border: '#E5E7EB',
        accent: highlightColor,
      };
    case 'brand':
      return {
        background: 'var(--wix-color-11, #F5F7FF)',
        cardBg: 'var(--wix-color-1, #FFFFFF)',
        text: 'var(--wix-color-5, #162D3D)',
        muted: 'var(--wix-color-4, #6E7881)',
        border: 'var(--wix-color-3, #DFE5EB)',
        accent: 'var(--wix-color-8, ' + highlightColor + ')',
      };
    default:
      return {
        background: '#F8FAFC',
        cardBg: '#FFFFFF',
        text: '#0F172A',
        muted: '#64748B',
        border: '#E2E8F0',
        accent: highlightColor,
      };
  }
}
