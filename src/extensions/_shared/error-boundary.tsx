import React, { Component, type ReactNode } from 'react';
import { SUPPORT_EMAIL } from './app-config';

interface Props {
  children: ReactNode;
  surface?: 'dashboard' | 'panel' | 'widget';
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error): void {
    console.error('[ErrorBoundary]', error);
  }

  private handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  private handleReload = (): void => {
    if (typeof window !== 'undefined') window.location.reload();
  };

  private handleReport = (): void => {
    const subject = encodeURIComponent('Pricing Plans Compare — render error');
    const body = encodeURIComponent(
      this.state.error?.message ?? 'Unknown error in Pricing Plans Compare',
    );
    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
  };

  render(): ReactNode {
    if (!this.state.hasError) return this.props.children;

    const surface = this.props.surface ?? 'dashboard';
    const title =
      surface === 'widget'
        ? 'Plan cards could not load'
        : surface === 'panel'
          ? 'Settings panel error'
          : 'Something went wrong';

    return (
      <div
        style={{
          padding: 24,
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        }}
      >
        <div
          style={{
            border: '1px solid #E4E6EB',
            borderRadius: 12,
            padding: 24,
            background: '#fff',
            maxWidth: 480,
            margin: '0 auto',
          }}
        >
          <h3 style={{ margin: '0 0 8px', fontSize: 18 }}>{title}</h3>
          <p style={{ margin: '0 0 16px', color: '#5B6670', fontSize: 14 }}>
            Try again or reload the page. If the problem continues, contact support.
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" onClick={this.handleRetry} style={btnStyle}>
              Try again
            </button>
            <button type="button" onClick={this.handleReload} style={btnStyle}>
              Reload page
            </button>
            <button type="button" onClick={this.handleReport} style={btnStyle}>
              Report issue
            </button>
          </div>
        </div>
      </div>
    );
  }
}

const btnStyle: React.CSSProperties = {
  border: '1px solid #CFD7DF',
  background: '#fff',
  borderRadius: 8,
  padding: '8px 14px',
  cursor: 'pointer',
  fontSize: 14,
};

export default ErrorBoundary;
