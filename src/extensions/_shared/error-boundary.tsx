import React, { Component, type ReactNode } from 'react';
import { SUPPORT_EMAIL } from './app-config';

type Surface = 'dashboard' | 'panel' | 'widget';

interface Props {
  children: ReactNode;
  surface?: Surface;
}

interface State {
  hasError: boolean;
}

const COPY: Record<Surface, { title: string; body: string }> = {
  dashboard: {
    title: 'Dashboard error',
    body: 'Something went wrong loading the PDF Viewer dashboard.',
  },
  panel: {
    title: 'Settings panel error',
    body: 'Something went wrong loading the editor settings panel.',
  },
  widget: {
    title: 'PDF viewer error',
    body: 'Something went wrong rendering the PDF viewer on your site.',
  },
};

export class WidgetErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: { componentStack: string }): void {
    console.error('[WidgetErrorBoundary]', error, info);
  }

  private handleRetry = (): void => {
    this.setState({ hasError: false });
  };

  private handleReload = (): void => {
    if (typeof window !== 'undefined') window.location.reload();
  };

  render(): ReactNode {
    if (!this.state.hasError) return this.props.children;

    const surface = this.props.surface ?? 'widget';
    const copy = COPY[surface];

    return (
      <div
        style={{
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          padding: 24,
          textAlign: 'center',
          color: '#333',
          background: '#FAFAFA',
          borderRadius: 8,
          border: '1px solid #E4E6EB',
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: 8 }}>{copy.title}</div>
        <div style={{ fontSize: 14, color: '#666', marginBottom: 16 }}>{copy.body}</div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button type="button" onClick={this.handleRetry} style={btnStyle}>
            Try again
          </button>
          <button type="button" onClick={this.handleReload} style={btnStyle}>
            Reload page
          </button>
          <a href={`mailto:${SUPPORT_EMAIL}`} style={{ ...btnStyle, textDecoration: 'none' }}>
            Report issue
          </a>
        </div>
      </div>
    );
  }
}

const btnStyle: React.CSSProperties = {
  padding: '8px 14px',
  fontSize: 13,
  borderRadius: 6,
  border: '1px solid #D1D5DB',
  background: '#fff',
  cursor: 'pointer',
  color: '#333',
};

export default WidgetErrorBoundary;
