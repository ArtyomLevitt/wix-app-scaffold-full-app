// @ts-nocheck — reference skeleton, not real source. The foundation copies
// the cleaned version into the project automatically.
//
// Canonical PRPL ErrorBoundary. ALWAYS wrap the dashboard page body in this
// component so a single render exception (a hallucinated icon, a missing
// asset, a runtime type error) shows a recoverable error card instead of
// silently unmounting the whole subtree and shipping a blank page.
//
// Astro layout: src/extensions/dashboard/pages/<slug>/components/ErrorBoundary.tsx
// Legacy CLI:    src/dashboard/pages/_shared/ErrorBoundary.tsx
//
// Usage:
//   <WixDesignSystemProvider features={{ newColorsBranding: true }}>
//     <ErrorBoundary>
//       <Page>{...}</Page>
//     </ErrorBoundary>
//   </WixDesignSystemProvider>

import React, { Component, type ReactNode } from "react";
import { Box, Button, Card, EmptyState, Text } from "@wix/design-system";
import * as Icons from "@wix/wix-ui-icons-common";

interface Props {
  children: ReactNode;
  // Optional override for the heading shown in the error card.
  fallbackTitle?: string;
  // Optional override for the subtitle / body copy.
  fallbackSubtitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  componentStack: string | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null, componentStack: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, componentStack: null };
  }

  componentDidCatch(error: Error, info: { componentStack: string }): void {
    this.setState({ componentStack: info.componentStack });
    // Surface to the browser console so devs can find the real cause fast.
    console.error("[ErrorBoundary] caught", error, info);
  }

  private handleReload = (): void => {
    if (typeof window !== "undefined") window.location.reload();
  };

  render(): ReactNode {
    if (!this.state.hasError) return this.props.children;

    const title = this.props.fallbackTitle ?? "Something went wrong";
    const subtitle =
      this.props.fallbackSubtitle ??
      "The dashboard couldn’t finish rendering. Refresh the page to try again, or contact support if it keeps happening.";

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
                <Button onClick={this.handleReload}>Reload dashboard</Button>
                {process.env.NODE_ENV !== "production" && this.state.error ? (
                  <Box direction="vertical" gap="SP1" align="left">
                    <Text size="tiny" secondary weight="bold">
                      {this.state.error.name}: {this.state.error.message}
                    </Text>
                    {this.state.componentStack ? (
                      <pre
                        style={{
                          fontSize: 11,
                          maxWidth: 720,
                          overflow: "auto",
                          background: "#F5F5F5",
                          padding: 12,
                          borderRadius: 6,
                          margin: 0,
                        }}
                      >
                        {this.state.componentStack.trim()}
                      </pre>
                    ) : null}
                  </Box>
                ) : null}
              </Box>
            </EmptyState>
          </Card.Content>
        </Card>
      </Box>
    );
  }
}

export default ErrorBoundary;
