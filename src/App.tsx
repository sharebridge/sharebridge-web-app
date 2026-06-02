import { useCallback, useEffect, useState } from "react";
import { GoogleOAuthProvider, googleLogout } from "@react-oauth/google";
import { ApiError, fetchOrderInitiations } from "./api/orderIntents";
import { SignInPage } from "./components/SignInPage";
import { SiteHeader } from "./components/SiteHeader";
import {
  clearSession,
  isSessionExpired,
  loadSession,
  saveSession,
  sessionDisplayLabel,
  type AuthSession
} from "./authSession";
import { getAppConfig } from "./config";
import { formatWhen, primaryRestaurant, statusLabel } from "./format";
import type { OrderInitiation } from "./types";
import { ReferencePhotoDisplay } from "./ReferencePhotoDisplay";

const appConfig = getAppConfig();

export function App() {
  const app = <AppShell />;
  if (!appConfig.googleClientId) {
    return app;
  }
  return (
    <GoogleOAuthProvider clientId={appConfig.googleClientId}>
      {app}
    </GoogleOAuthProvider>
  );
}

function AppShell() {
  const [session, setSession] = useState<AuthSession | null>(() =>
    loadSession()
  );
  const [intents, setIntents] = useState<OrderInitiation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selected =
    intents.find((row) => row.order_intent_id === selectedId) ?? null;

  const loadHistory = useCallback(async (active: AuthSession) => {
    if (isSessionExpired(active)) {
      clearSession();
      setSession(null);
      setError("Your session expired. Please sign in again.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const rows = await fetchOrderInitiations(appConfig.apiBaseUrl, active);
      setIntents(rows);
      setSelectedId((prev) =>
        prev && rows.some((row) => row.order_intent_id === prev)
          ? prev
          : rows[0]?.order_intent_id ?? null
      );
    } catch (err) {
      setIntents([]);
      setSelectedId(null);
      if (err instanceof ApiError && err.status === 401) {
        clearSession();
        setSession(null);
        setError("Session expired or invalid. Please sign in again.");
        return;
      }
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
    if (session) {
      void loadHistory(session);
    }
  }, [session, loadHistory]);

  function handleSignedIn(next: AuthSession) {
    saveSession(next);
    setSession(next);
    setError(null);
  }

  function handleSignOut() {
    clearSession();
    if (appConfig.googleClientId) {
      googleLogout();
    }
    setSession(null);
    setIntents([]);
    setSelectedId(null);
    setError(null);
  }

  if (!session) {
    return <SignInPage config={appConfig} onSignedIn={handleSignedIn} />;
  }

  return (
    <div className="site">
      <SiteHeader
        config={appConfig}
        session={session}
        onRefresh={() => void loadHistory(session)}
        onSignOut={handleSignOut}
        loading={loading}
      />

      <main className="main">
        <section className="hero">
          <div className="hero-inner">
            <p className="hero-eyebrow">Coordinator dashboard</p>
            <h1>Order initiation history</h1>
            <p className="hero-lede">
              Track when donors register delivery intent from{" "}
              <strong>Help a seeker</strong> on mobile.
            </p>
          </div>
          <div className="hero-metrics" aria-live="polite">
            <div className="metric">
              <span className="metric-value">{intents.length}</span>
              <span className="metric-label">Initiations</span>
            </div>
            <div className="metric">
              <span className="metric-value">{sessionDisplayLabel(session)}</span>
              <span className="metric-label">Signed-in coordinator</span>
            </div>
          </div>
        </section>

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
              <p className="empty">No order initiations yet.</p>
            ) : (
              <ul className="intent-list">
                {intents.map((intent) => {
                  const restaurant = primaryRestaurant(intent);
                  const meta = [
                    intent.user_id ? `Donor ${intent.user_id}` : null,
                    statusLabel(intent.status),
                    restaurant,
                    formatWhen(intent.updated_at || intent.created_at)
                  ]
                    .filter(Boolean)
                    .join(" · ");
                      const hasThumb = Boolean(
                        intent.reference_photo_thumbnail_url?.trim() &&
                          (intent.reference_photo_view_url?.trim() ||
                            intent.reference_photo_thumbnail_url?.trim())
                      );
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
                        {hasThumb ? (
                          <ReferencePhotoDisplay
                            compact
                            thumbnailUrl={intent.reference_photo_thumbnail_url}
                            viewUrl={intent.reference_photo_view_url}
                          />
                        ) : intent.has_reference_photo ? (
                          <span className="intent-photo-placeholder" aria-hidden>
                            📷
                          </span>
                        ) : null}
                        <span className="intent-row-text">
                          <span className="intent-id">
                            {intent.order_intent_id}
                          </span>
                          <span className="intent-meta">{meta}</span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section
            className="panel detail-panel"
            aria-labelledby="detail-heading"
          >
            <h2 id="detail-heading">Initiation detail</h2>
            {selected ? (
              <DetailView intent={selected} />
            ) : (
              <p className="empty">
                Select an initiation to review handover context.
              </p>
            )}
          </section>
        </div>
      </main>

      <footer className="footer">
        <p>
          SharingBridge MVP · Signed in as {sessionDisplayLabel(session)} ·
          Session kept in this browser until sign-out or expiry
        </p>
      </footer>
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
      <div
        className={
          intent.reference_photo_view_url ||
          intent.reference_photo_thumbnail_url
            ? "detail-block"
            : undefined
        }
      >
        <dt>Reference photo</dt>
        <dd>
          <ReferencePhotoDisplay
            thumbnailUrl={intent.reference_photo_thumbnail_url}
            viewUrl={intent.reference_photo_view_url}
            artifactId={intent.reference_photo_artifact_id}
            hasReferencePhoto={intent.has_reference_photo}
          />
        </dd>
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
