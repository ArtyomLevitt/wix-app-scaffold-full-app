import React, { type ComponentType, useEffect, useState } from 'react';
import { IntlProvider } from 'react-intl';
import { Box, Loader, Page } from '@wix/design-system';
import { getLocaleSafe, loadMessages } from './load-messages';

export function withIntlProvider<P extends object>(Wrapped: ComponentType<P>) {
  return function IntlWrapped(props: P) {
    const [messages, setMessages] = useState<Record<string, string> | null>(null);
    const [locale, setLocale] = useState('en');

    useEffect(() => {
      let cancelled = false;
      (async () => {
        const loc = await getLocaleSafe();
        const msgs = await loadMessages(loc);
        if (!cancelled) {
          setLocale(loc);
          setMessages(msgs);
        }
      })();
      return () => {
        cancelled = true;
      };
    }, []);

    if (!messages) {
      return (
        <Page>
          <Page.Content>
            <Box align="center" padding="60px">
              <Loader />
            </Box>
          </Page.Content>
        </Page>
      );
    }

    return (
      <IntlProvider locale={locale} messages={messages}>
        <Wrapped {...props} />
      </IntlProvider>
    );
  };
}

export { getLocaleSafe, loadMessages } from './load-messages';
