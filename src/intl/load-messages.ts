import { i18n } from '@wix/essentials';

const FALLBACK_LOCALE = 'en';

export async function getLocaleSafe(): Promise<string> {
  try {
    const locale = await i18n.getLocale();
    const normalized = locale?.split('_')[0]?.split('-')[0]?.toLowerCase();
    return normalized || FALLBACK_LOCALE;
  } catch {
    return FALLBACK_LOCALE;
  }
}

export async function loadMessages(locale: string): Promise<Record<string, string>> {
  const base = locale.split('-')[0].split('_')[0].toLowerCase();
  try {
    const mod = await import(`./messages/${base}.json`);
    return (mod.default ?? mod) as Record<string, string>;
  } catch {
    const mod = await import('./messages/en.json');
    return (mod.default ?? mod) as Record<string, string>;
  }
}
