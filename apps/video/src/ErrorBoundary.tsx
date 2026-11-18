import { Button } from "@hussmartinez/ui/react";
import { Component, type ErrorInfo, type ReactNode } from "react";

interface ErrorBoundaryProps {
  readonly children: ReactNode;
}

interface ErrorBoundaryState {
  readonly failed: boolean;
}

/**
 * Catches a crash of the editor and offers a reload instead of a blank page.
 * It shows no error text: the editor's own errors are shown inside it, and
 * an unexpected one may carry text from the file.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = { failed: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { failed: true };
  }

  override componentDidCatch(error: unknown, info: ErrorInfo): void {
    // For whoever opens the console; nothing is sent anywhere.
    console.error(error, info.componentStack);
  }

  override render(): ReactNode {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="app-crash" role="alert">
        <h2>Something went wrong</h2>
        <p>
          The editor stopped unexpectedly. Your videos never left this device, but unsaved edits are
          lost. Reload the page to start again.
        </p>
        <Button variant="primary" onClick={() => window.location.reload()}>
          Reload
        </Button>
      </div>
    );
  }
}
