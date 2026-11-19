import { Button } from "@hussmartinez/ui/react";
import { Component, type ReactNode } from "react";

interface Props {
  readonly children: ReactNode;
  /** Called when the user asks to start the editor again. */
  readonly onReset: () => void;
}

interface State {
  readonly failed: boolean;
}

/**
 * Catches a crash in the editor and offers an explicit restart, instead of a
 * blank page. Errors are not logged anywhere: they can carry user data.
 */
export class ErrorBoundary extends Component<Props, State> {
  override state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  private reset = () => {
    this.setState({ failed: false });
    this.props.onReset();
  };

  override render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="app-error" role="alert">
        <h2>The editor stopped working</h2>
        <p>
          Something went wrong while editing. Your image never left this device. Start the editor
          again and reopen the image; unexported edits are lost.
        </p>
        <Button variant="primary" onClick={this.reset}>
          Start again
        </Button>
      </div>
    );
  }
}
