import React, { Component, type ReactNode } from 'react';
import { SUPPORT_EMAIL } from './app-config';

interface Props {
  children: ReactNode;
  surface?: 'dashboard' | 'panel' | 'widget';
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: { componentStack: string }): void {
    console.error('[ErrorBoundary]', error, info);
  }

  render(): ReactNode {
    if (!this.state.hasError) return this.props.children;
    const surface = this.props.surface ?? 'dashboard';
    const title =
      surface === 'widget'
        ? 'Pricing table unavailable'
        : 'Something went wrong';
    const subtitle =
      surface === 'widget'
        ? 'Refresh the page to try again.'
        : 'The dashboard could not finish rendering.';
    return (
      <div
        style={{
          padding: 24,
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Roboto, Arial, sans-serif',
        }}
      >
        <h3 style={{ margin: '0 0 8px', fontSize: 16 }}>{title}</h3>
        <p style={{ margin: '0 0 16px', fontSize: 14, color: '#555' }}>{subtitle}</p>
        <button
          type="button"
          onClick={() => this.setState({ hasError: false })}
          style={{ marginRight: 8, padding: '8px 12px', cursor: 'pointer' }}
        >
          Try again
        </button>
        <button
          type="button"
          onClick={() => window.location.reload()}
          style={{ marginRight: 8, padding: '8px 12px', cursor: 'pointer' }}
        >
          Reload page
        </button>
        <a href={`mailto:${SUPPORT_EMAIL}`} style={{ fontSize: 14 }}>
          Report issue
        </a>
      </div>
    );
  }
}

export default ErrorBoundary;
