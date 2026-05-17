import { integrationHost, type AppConfig } from "../config";
import type { AuthSession } from "../authSession";

type Props = {
  config: AppConfig;
  session: AuthSession;
  onRefresh: () => void;
  onSignOut: () => void;
  loading: boolean;
};

export function SiteHeader({
  config,
  session,
  onRefresh,
  onSignOut,
  loading
}: Props) {
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <div className="brand">
          <span className="brand-mark" aria-hidden>
            SB
          </span>
          <div>
            <span className="brand-name">SharingBridge</span>
            <span className="brand-tag">Order operations</span>
          </div>
        </div>
        <div className="site-header-meta">
          <span className="env-pill" title={config.apiBaseUrl}>
            {integrationHost(config)}
          </span>
          <span className="user-pill">{session.userId}</span>
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
