import { integrationHost, type AppConfig } from "../config";
import type { AuthSession } from "../authSession";
import { sessionHeaderLabel } from "../sessionRole";

type Props = {
  config: AppConfig;
  session: AuthSession;
  onRefresh: () => void;
  onHome: () => void;
  onSignOut: () => void;
  loading: boolean;
};

export function SiteHeader({
  config,
  session,
  onRefresh,
  onHome,
  onSignOut,
  loading
}: Props) {
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <button type="button" className="brand brand-button" onClick={onHome}>
          <span className="brand-mark" aria-hidden>
            SB
          </span>
          <div>
            <span className="brand-name">SharingBridge</span>
            <span className="brand-tag">Order operations</span>
          </div>
        </button>
        <div className="site-header-meta">
          <span className="env-pill" title={config.apiBaseUrl}>
            {integrationHost(config)}
          </span>
          <span className="user-pill" title={session.userId}>
            {sessionHeaderLabel(session)}
          </span>
          <button type="button" className="btn btn-ghost" onClick={onHome}>
            Home
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={loading}
            onClick={onRefresh}
          >
            {loading ? "Refreshing…" : "Refresh"}
          </button>
          <button type="button" className="btn btn-ghost" onClick={onSignOut}>
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
