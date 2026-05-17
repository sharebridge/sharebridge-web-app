import { integrationHost, type AppConfig } from "../config";

type Props = {
  config: AppConfig;
  onRefresh: () => void;
  loading: boolean;
};

export function SiteHeader({ config, onRefresh, loading }: Props) {
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
          <button
            type="button"
            className="btn btn-primary"
            disabled={loading}
            onClick={() => onRefresh()}
          >
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </div>
    </header>
  );
}
