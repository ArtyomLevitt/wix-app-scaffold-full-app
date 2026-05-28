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
    console.error(`[ErrorBoundary:${this.props.surface ?? 'unknown'}]`, error, info);
  }

  render(): ReactNode {
    if (!this.state.hasError) return this.props.children;

    const title =
      this.props.surface === 'widget'
        ? 'Pricing table unavailable'
        : 'Something went wrong';

    return (
      <div
        style={{
          padding: 24,
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Roboto, sans-serif',
          textAlign: 'center',
        }}
      >
        <h3 style={{ margin: '0 0 8px', fontSize: 16 }}>{title}</h3>
        <p style={{ margin: '0 0 16px', color: '#666', fontSize: 14 }}>
          Refresh the page to try again.
        </p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false })}
            style={{ padding: '8px 16px', cursor: 'pointer' }}
          >
            Try again
          </button>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{ padding: '8px 16px', cursor: 'pointer' }}
          >
            Reload page
          </button>
          <a href={`mailto:${SUPPORT_EMAIL}`} style={{ padding: '8px 16px' }}>
            Report issue
          </a>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
