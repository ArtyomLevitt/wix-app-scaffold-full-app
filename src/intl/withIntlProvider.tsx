import React, { type FC, type ReactNode } from 'react';
import { IntlProvider } from 'react-intl';
import en from './messages/en.json';

const messages: Record<string, Record<string, string>> = { en };

export const WithIntlProvider: FC<{ children: ReactNode; locale?: string }> = ({
  children,
  locale = 'en',
}) => (
  <IntlProvider locale={locale} messages={messages[locale] ?? en} defaultLocale="en">
    {children}
  </IntlProvider>
);

export function loadMessages(locale: string): Record<string, string> {
  return messages[locale] ?? en;
}
