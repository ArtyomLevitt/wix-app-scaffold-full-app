import en from './messages/en.json';

const catalogs: Record<string, Record<string, string>> = {
  en: en as Record<string, string>,
};

export function loadMessages(locale: string): Record<string, string> {
  return catalogs[locale] ?? catalogs.en;
}
