import { Button } from "@hussmartinez/ui/react";
import { Component, type ReactNode } from "react";
import { analytics } from "./analytics.ts";

type Props = { children: ReactNode };
type State = { failed: boolean };

export class ErrorBoundary extends Component<Props, State> {
  override state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  override componentDidCatch(): void {
    // Only that it happened: an error's message may contain text from the file.
    analytics.event("component_error");
  }

  override render(): ReactNode {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="error-fallback" role="alert">
        <h2>Something went wrong</h2>
        <p>The editor stopped unexpectedly. Your file never left this device.</p>
        <Button variant="primary" onClick={() => window.location.reload()}>
          Reload the editor
        </Button>
      </div>
    );
  }
}
