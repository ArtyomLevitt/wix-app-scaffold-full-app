import React, { Component, type ReactNode } from 'react';
import { APP_NAME, SUPPORT_EMAIL } from './app-config';

interface Props {
  surface?: 'dashboard' | 'panel' | 'widget';
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error(
      `[${APP_NAME}] ${this.props.surface ?? 'unknown'} render error:`,
      error,
      info?.componentStack,
    );
  }

  private reset = (): void => this.setState({ error: null });

  render(): ReactNode {
    if (!this.state.error) return this.props.children;
    return (
      <div
        role="alert"
        style={{
          padding: 24,
          margin: 24,
          maxWidth: 480,
          background: '#fff',
          border: '1px solid #F1B0B0',
          borderRadius: 12,
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div style={{ fontWeight: 700, color: '#B42318', marginBottom: 6 }}>Something went wrong</div>
        <div style={{ fontSize: 13, color: '#4B5563', marginBottom: 14 }}>
          Refresh usually fixes it. Please report if it keeps happening.
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            onClick={this.reset}
            style={{
              padding: '6px 14px',
              background: '#3B6AEA',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              padding: '6px 14px',
              background: '#fff',
              color: '#1F2937',
              border: '1px solid #D1D5DB',
              borderRadius: 6,
              cursor: 'pointer',
            }}
          >
            Reload page
          </button>
          <a
            href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(`[${APP_NAME}] crash`)}&body=${encodeURIComponent(this.state.error.message)}`}
            target="_blank"
            rel="noreferrer"
            style={{
              padding: '6px 14px',
              background: '#fff',
              color: '#3B6AEA',
              border: '1px solid #C7D2FE',
              borderRadius: 6,
              textDecoration: 'none',
            }}
          >
            Report issue
          </a>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
