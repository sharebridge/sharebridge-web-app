import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = {
  children: ReactNode;
};

type State = {
  error: Error | null;
};

/** Catches render errors so old browsers show a message instead of a white screen. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[sharingbridge-web] render error", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="site sign-in-site">
          <main className="sign-in-main">
            <section className="sign-in-card panel">
              <h1>Something went wrong</h1>
              <p className="sign-in-lede">
                This browser could not render the dashboard. Try Chrome on a
                newer phone or laptop, or update Chrome on this device.
              </p>
              <div className="banner banner-error" role="alert">
                {this.state.error.message || "Unknown error"}
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-block"
                onClick={() => this.setState({ error: null })}
              >
                Try again
              </button>
            </section>
          </main>
        </div>
      );
    }

    return this.props.children;
  }
}
