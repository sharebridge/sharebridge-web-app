import { useCallback, useEffect, useState } from "react";
import { ApiError, fetchOrderInitiations } from "./api/orderIntents";
import { AuthHelpPanel } from "./components/AuthHelpPanel";
import { SiteHeader } from "./components/SiteHeader";
import { getAppConfig, type AppConfig } from "./config";
import { formatWhen, primaryRestaurant, statusLabel } from "./format";
import type { OrderInitiation } from "./types";

const appConfig = getAppConfig();

export function App() {
  const [intents, setIntents] = useState<OrderInitiation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authHelpOpen, setAuthHelpOpen] = useState(false);

  const selected =
    intents.find((row) => row.order_intent_id === selectedId) ?? null;

  const loadHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await fetchOrderInitiations(appConfig);
      setIntents(rows);
      setSelectedId((prev) =>
        prev && rows.some((row) => row.order_intent_id === prev)
          ? prev
          : rows[0]?.order_intent_id ?? null
      );
    } catch (err) {
      setIntents([]);
      setSelectedId(null);
      if (err instanceof ApiError) {
        setError(formatApiError(err, appConfig));
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Could not load order initiations.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    if (error?.includes("401")) {
      setAuthHelpOpen(true);
    }
  }, [error]);

  return (
    <div className="site">
      <SiteHeader config={appConfig} onRefresh={loadHistory} loading={loading} />

      <main className="main">
        <section className="hero">
          <div className="hero-inner">
            <p className="hero-eyebrow">Coordinator dashboard</p>
            <h1>Order initiation history</h1>
            <p className="hero-lede">
              Track when donors register delivery intent from{" "}
              <strong>Help a seeker</strong> on mobile — same records as the
              in-app history, optimized for desktop review.
            </p>
          </div>
          <div className="hero-metrics" aria-live="polite">
            <div className="metric">
              <span className="metric-value">{intents.length}</span>
              <span className="metric-label">Initiations</span>
            </div>
            <div className="metric">
              <span className="metric-value">{appConfig.userId}</span>
              <span className="metric-label">Signed-in user</span>
            </div>
          </div>
        </section>

        <AuthHelpPanel
          config={appConfig}
          open={authHelpOpen}
          onToggle={() => setAuthHelpOpen((v) => !v)}
        />

        {error ? (
          <div className="banner banner-error" role="alert">
            {error}
          </div>
        ) : null}

        <div className="dashboard layout">
          <section className="panel list-panel" aria-labelledby="list-heading">
            <div className="panel-head">
              <h2 id="list-heading">Recent initiations</h2>
              {loading ? <span className="badge">Syncing…</span> : null}
            </div>
            {intents.length === 0 && !loading ? (
              <p className="empty">
                No order initiations yet. After a donor copies instructions in
                the mobile app, click <strong>Refresh</strong> above.
              </p>
            ) : (
              <ul className="intent-list">
                {intents.map((intent) => {
                  const restaurant = primaryRestaurant(intent);
                  const meta = [
                    statusLabel(intent.status),
                    restaurant,
                    formatWhen(intent.updated_at || intent.created_at)
                  ]
                    .filter(Boolean)
                    .join(" · ");
                  return (
                    <li key={intent.order_intent_id}>
                      <button
                        type="button"
                        className={
                          selectedId === intent.order_intent_id
                            ? "intent-row active"
                            : "intent-row"
                        }
                        onClick={() =>
                          setSelectedId(intent.order_intent_id)
                        }
                      >
                        <span className="intent-id">
                          {intent.order_intent_id}
                        </span>
                        <span className="intent-meta">{meta}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className="panel detail-panel" aria-labelledby="detail-heading">
            <h2 id="detail-heading">Initiation detail</h2>
            {selected ? (
              <DetailView intent={selected} />
            ) : (
              <p className="empty">Select an initiation to review handover context.</p>
            )}
          </section>
        </div>
      </main>

      <footer className="footer">
        <p>
          SharingBridge MVP · API configured at build time · Auth via ModHeader
          or local <code>.env</code>
        </p>
      </footer>
    </div>
  );
}

function formatApiError(err: ApiError, config: AppConfig): string {
  if (err.status === 401 && config.authMode === "modheader") {
    return `${err.message} (HTTP 401). Set Authorization in ModHeader (Bearer JWT), then Refresh. Open “Authentication setup” below for steps.`;
  }
  return `${err.message} (HTTP ${err.status})`;
}

function DetailView({ intent }: { intent: OrderInitiation }) {
  return (
    <dl className="detail-grid">
      <div>
        <dt>Reference</dt>
        <dd>{intent.order_intent_id}</dd>
      </div>
      <div>
        <dt>Instruction pack</dt>
        <dd>{intent.pack_id}</dd>
      </div>
      <div>
        <dt>Status</dt>
        <dd>{statusLabel(intent.status)}</dd>
      </div>
      <div>
        <dt>Reference photo</dt>
        <dd>{intent.has_reference_photo ? "Yes" : "No"}</dd>
      </div>
      <div>
        <dt>Registered</dt>
        <dd>{formatWhen(intent.created_at)}</dd>
      </div>
      <div>
        <dt>Last updated</dt>
        <dd>{formatWhen(intent.updated_at)}</dd>
      </div>
      {intent.verbal_handover_notes.trim() ? (
        <div className="detail-block">
          <dt>Handover notes</dt>
          <dd>{intent.verbal_handover_notes}</dd>
        </div>
      ) : null}
      {intent.presets_snapshot.length > 0 ? (
        <div className="detail-block">
          <dt>
            Presets at registration ({intent.presets_snapshot.length})
          </dt>
          <dd>
            <ul className="preset-list">
              {intent.presets_snapshot.map((row, index) => (
                <li key={`${row.restaurant_name}-${index}`}>
                  <strong>{row.restaurant_name || "Vendor"}</strong>
                  {row.app_name ? ` · ${row.app_name}` : ""}
                </li>
              ))}
            </ul>
          </dd>
        </div>
      ) : null}
    </dl>
  );
}
