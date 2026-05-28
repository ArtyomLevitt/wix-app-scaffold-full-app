import { i18n } from '@wix/essentials';
import { IntlProvider } from 'react-intl';
import React, { type ComponentType } from 'react';

import en from './messages/en.json';

const MESSAGES: Record<string, Record<string, string>> = { en };

export async function loadMessages(locale?: string): Promise<Record<string, string>> {
  const loc = locale || (await getLocaleSafe());
  return MESSAGES[loc] || MESSAGES.en;
}

export async function getLocaleSafe(): Promise<string> {
  try {
    const locale = await i18n.getLocale();
    return locale?.split('_')[0] || 'en';
  } catch {
    return 'en';
  }
}

export function withIntlProvider<P extends object>(Component: ComponentType<P>) {
  const Wrapped: React.FC<P> = (props) => {
    const [messages, setMessages] = React.useState<Record<string, string>>(en);
    const [locale, setLocale] = React.useState('en');

    React.useEffect(() => {
      (async () => {
        const loc = await getLocaleSafe();
        const msgs = await loadMessages(loc);
        setLocale(loc);
        setMessages(msgs);
      })();
    }, []);

    return (
      <IntlProvider locale={locale} messages={messages} defaultLocale="en">
        <Component {...props} />
      </IntlProvider>
    );
  };
  return Wrapped;
}
