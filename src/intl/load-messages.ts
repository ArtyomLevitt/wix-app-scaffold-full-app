import en from './messages/en.json';

const catalogs: Record<string, Record<string, string>> = { en };

export function loadMessages(locale: string): Record<string, string> {
  return catalogs[locale] ?? en;
}
