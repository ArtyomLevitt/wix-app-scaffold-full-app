import React, { Component, type ReactNode } from 'react';
import { Box, Button, Card, EmptyState, Text } from '@wix/design-system';
import * as Icons from '@wix/wix-ui-icons-common';
import { SUPPORT_EMAIL } from './app-config';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackSubtitle?: string;
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

  render(): ReactNode {
    if (!this.state.hasError) return this.props.children;

    const surface = this.props.surface ?? 'dashboard';
    const title =
      this.props.fallbackTitle ??
      (surface === 'widget'
        ? 'Pricing table unavailable'
        : 'Something went wrong');
    const subtitle =
      this.props.fallbackSubtitle ??
      (surface === 'widget'
        ? 'Refresh the page to try again.'
        : 'The dashboard could not finish rendering. Try again or contact support.');

    if (surface === 'widget') {
      return (
        <div
          style={{
            padding: 24,
            textAlign: 'center',
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Roboto, sans-serif',
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 8 }}>{title}</div>
          <div style={{ fontSize: 14, color: '#666', marginBottom: 16 }}>{subtitle}</div>
          <button type="button" onClick={this.handleReload} style={{ marginRight: 8 }}>
            Reload
          </button>
          <a href={`mailto:${SUPPORT_EMAIL}`}>Report issue</a>
        </div>
      );
    }

    return (
      <Box padding="SP6" align="center">
        <Card>
          <Card.Content>
            <EmptyState
              theme="page"
              image={<Icons.StatusAlert size="48" />}
              title={title}
              subtitle={subtitle}
            >
              <Box direction="vertical" gap="SP3" align="center">
                <Button onClick={this.handleRetry}>Try again</Button>
                <Button priority="secondary" onClick={this.handleReload}>
                  Reload page
                </Button>
                <Button
                  as="a"
                  href={`mailto:${SUPPORT_EMAIL}`}
                  priority="secondary"
                >
                  Report issue
                </Button>
              </Box>
            </EmptyState>
          </Card.Content>
        </Card>
      </Box>
    );
  }
}

export default ErrorBoundary;
