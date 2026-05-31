export type FitMode = 'fit-width' | 'fit-page';
export type PageLayout = 'single' | 'continuous';
export type ThemeMode = 'light' | 'dark';

export interface WidgetSettings {
  _v?: number;
  pdfUrl: string;
  defaultZoom: number;
  fitMode: FitMode;
  showToolbar: boolean;
  allowDownload: boolean;
  theme: ThemeMode;
  accentColor: string;
  viewerHeight: number;
  pageLayout: PageLayout;
}

export const SETTINGS_VERSION = 1;

export const DEPRECATED_KEYS = ['widthValue', 'widthUnit', 'height', 'size', 'dimensions'];

export const DEFAULT_SETTINGS: WidgetSettings = {
  _v: SETTINGS_VERSION,
  pdfUrl: '',
  defaultZoom: 100,
  fitMode: 'fit-width',
  showToolbar: true,
  allowDownload: false,
  theme: 'light',
  accentColor: '#6B21A8',
  viewerHeight: 600,
  pageLayout: 'continuous',
};

/** Premium-only fields — reset to defaults when !isPremium */
export const PREMIUM_FIELDS: (keyof WidgetSettings)[] = [
  'theme',
  'accentColor',
  'allowDownload',
];

const KNOWN_KEYS = new Set<keyof WidgetSettings>([
  '_v',
  'pdfUrl',
  'defaultZoom',
  'fitMode',
  'showToolbar',
  'allowDownload',
  'theme',
  'accentColor',
  'viewerHeight',
  'pageLayout',
]);

export function migrateSettings(stored: Record<string, unknown>): WidgetSettings {
  const clean: Partial<WidgetSettings> = {};
  for (const key of KNOWN_KEYS) {
    if (key in stored && !DEPRECATED_KEYS.includes(key)) {
      (clean as Record<string, unknown>)[key] = stored[key];
    }
  }
  return { ...DEFAULT_SETTINGS, ...clean, _v: SETTINGS_VERSION };
}

export function applyPremiumGating(
  settings: WidgetSettings,
  isPremium: boolean,
): WidgetSettings {
  if (isPremium) return settings;
  const gated = { ...settings };
  for (const field of PREMIUM_FIELDS) {
    (gated as Record<string, unknown>)[field] = DEFAULT_SETTINGS[field];
  }
  gated.allowDownload = false;
  return gated;
}

export function stripPremiumFieldsFromPatch(
  patch: Partial<WidgetSettings>,
  isPremium: boolean,
): Partial<WidgetSettings> {
  if (isPremium) return patch;
  const stripped = { ...patch };
  for (const field of PREMIUM_FIELDS) {
    delete stripped[field];
  }
  if ('allowDownload' in stripped) {
    stripped.allowDownload = false;
  }
  return stripped;
}

export interface PublicWidgetSettings extends WidgetSettings {
  isPremium: boolean;
  maxPages: number | null;
}

export function toPublicSettings(
  settings: WidgetSettings,
  isPremium: boolean,
): PublicWidgetSettings {
  const gated = applyPremiumGating(settings, isPremium);
  return {
    ...gated,
    isPremium,
    maxPages: isPremium ? null : 5,
  };
}
