import { IntlProvider } from 'react-intl';
import React, { type ComponentType } from 'react';
import { loadMessages } from './load-messages';

export function withIntlProvider<P extends object>(Component: ComponentType<P>) {
  const Wrapped: React.FC<P> = (props) => {
    const messages = loadMessages('en');
    return (
      <IntlProvider locale="en" messages={messages} defaultLocale="en">
        <Component {...props} />
      </IntlProvider>
    );
  };
  return Wrapped;
}
