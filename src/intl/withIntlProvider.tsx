import React from 'react';
import { IntlProvider } from 'react-intl';
import { loadMessages } from './load-messages';

export function withIntlProvider<P extends object>(
  Component: React.ComponentType<P>,
): React.FC<P> {
  const messages = loadMessages('en');
  const Wrapped: React.FC<P> = (props) => (
    <IntlProvider locale="en" messages={messages} defaultLocale="en">
      <Component {...props} />
    </IntlProvider>
  );
  Wrapped.displayName = `WithIntl(${Component.displayName || Component.name || 'Component'})`;
  return Wrapped;
}
