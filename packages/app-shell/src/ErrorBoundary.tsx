import { Button } from "@hussmartinez/ui/react";
import { Component, type ContextType, type ReactNode } from "react";
import { AnalyticsContext } from "./analytics.ts";
import { messages } from "./messages.ts";

interface ErrorBoundaryProps {
  readonly children: ReactNode;
}

interface ErrorBoundaryState {
  readonly failed: boolean;
}

/**
 * Replaces a crashed editor with a way forward, never a blank page or a
 * stack trace (docs/adr/0002).
 *
 * - **The error is logged to the local console,** by React, which logs every
 *   error a boundary catches. That's what a person needs to report a bug,
 *   and it never leaves the device.
 * - **Its text is never sent anywhere,** because it can carry text from the
 *   file.
 * - **Analytics gets one anonymous `component_error` event,** with no message
 *   or stack, so crashes can be counted.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  static override contextType = AnalyticsContext;
  declare context: ContextType<typeof AnalyticsContext>;

  override state: ErrorBoundaryState = { failed: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { failed: true };
  }

  override componentDidCatch(): void {
    this.context.event("component_error");
  }

  override render(): ReactNode {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="app-shell-crash" role="alert">
        <h2>{messages.t("shell.crash.title")}</h2>
        <p>{messages.t("shell.crash.body")}</p>
        <Button variant="primary" onClick={() => window.location.reload()}>
          {messages.t("shell.crash.reload")}
        </Button>
      </div>
    );
  }
}
