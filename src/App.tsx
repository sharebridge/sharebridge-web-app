import { useCallback, useEffect, useState, type FormEvent } from "react";
import { ApiError, fetchOrderInitiations } from "./api/orderIntents";
import { formatWhen, primaryRestaurant, statusLabel } from "./format";
import {
  clearConnection,
  loadConnection,
  saveConnection
} from "./storage";
import type { ConnectionSettings, OrderInitiation } from "./types";

const defaultApiBase =
  import.meta.env.VITE_API_BASE_URL?.trim() ||
  "https://sharingbridge-integration-service.onrender.com";
const defaultUserId =
  import.meta.env.VITE_USER_ID?.trim() || "demo-user";

export function App() {
  const [connection, setConnection] = useState<ConnectionSettings | null>(
    () => loadConnection()
  );
  const [draft, setDraft] = useState<ConnectionSettings>(() => ({
    apiBaseUrl: connection?.apiBaseUrl ?? defaultApiBase,
    authToken: connection?.authToken ?? "",
    userId: connection?.userId ?? defaultUserId
  }));
  const [intents, setIntents] = useState<OrderInitiation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selected =
    intents.find((row) => row.order_intent_id === selectedId) ?? null;

  const loadHistory = useCallback(async (active: ConnectionSettings) => {
    setLoading(true);
    setError(null);
    try {
      const rows = await fetchOrderInitiations(active);
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
        setError(`${err.message} (HTTP ${err.status})`);
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
    if (connection) {
      void loadHistory(connection);
    }
  }, [connection, loadHistory]);

  function handleConnect(event: FormEvent) {
    event.preventDefault();
    const next: ConnectionSettings = {
      apiBaseUrl: draft.apiBaseUrl,
      authToken: draft.authToken,
      userId: draft.userId
    };
    saveConnection(next);
    setConnection(next);
  }

  function handleDisconnect() {
    clearConnection();
    setConnection(null);
    setIntents([]);
    setSelectedId(null);
    setError(null);
    setDraft((prev) => ({ ...prev, authToken: "" }));
  }

  return (
    <div className="app">
      <header className="header">
        <div>
          <p className="eyebrow">SharingBridge</p>
          <h1>Order initiation history</h1>
          <p className="lede">
            View order initiations registered when donors copy delivery
            instructions from <strong>Help a seeker</strong> (mobile).
          </p>
        </div>
        {connection ? (
          <button
            type="button"
            className="btn btn-ghost"
            onClick={handleDisconnect}
          >
            Clear session
          </button>
        ) : null}
      </header>

      <section className="panel">
        <h2>Connection</h2>
        <form className="form" onSubmit={handleConnect}>
          <label>
            Integration API URL
            <input
              type="url"
              required
              value={draft.apiBaseUrl}
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, apiBaseUrl: e.target.value }))
              }
              placeholder="https://sharingbridge-integration-service.onrender.com"
            />
          </label>
          <label>
            User ID
            <input
              type="text"
              required
              value={draft.userId}
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, userId: e.target.value }))
              }
            />
          </label>
          <label>
            Bearer token (from user-service)
            <input
              type="password"
              required
              autoComplete="off"
              value={draft.authToken}
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, authToken: e.target.value }))
              }
              placeholder="Paste JWT from POST /v1/auth/token"
            />
          </label>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary">
              {connection ? "Update & refresh" : "Connect"}
            </button>
            {connection ? (
              <button
                type="button"
                className="btn"
                disabled={loading}
                onClick={() => void loadHistory(connection)}
              >
                Refresh
              </button>
            ) : null}
          </div>
        </form>
        <p className="hint">
          Mint a token in PowerShell:{" "}
          <code>POST …/v1/auth/token</code> with{" "}
          <code>{`{"user_id":"${draft.userId || "demo-user"}"}`}</code>. On
          Render, set integration <code>WEB_CORS_ORIGINS</code> to this site’s
          origin (e.g. <code>http://localhost:5173</code>).
        </p>
      </section>

      {error ? (
        <div className="banner banner-error" role="alert">
          {error}
        </div>
      ) : null}

      {connection ? (
        <div className="layout">
          <section className="panel list-panel">
            <div className="panel-head">
              <h2>Initiations</h2>
              {loading ? <span className="badge">Loading…</span> : null}
            </div>
            {intents.length === 0 && !loading ? (
              <p className="empty">
                No order initiations yet. Register one from the mobile app
                (Help a seeker → copy instructions).
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

          <section className="panel detail-panel">
            <h2>Detail</h2>
            {selected ? (
              <DetailView intent={selected} />
            ) : (
              <p className="empty">Select an initiation from the list.</p>
            )}
          </section>
        </div>
      ) : null}
    </div>
  );
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
