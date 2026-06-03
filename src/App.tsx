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
  type AuthSession
} from "./authSession";
import { sessionHeaderLabel } from "./sessionRole";
import { getAppConfig } from "./config";
import { formatWhen, statusLabel } from "./format";
import type { OrderGroupMode } from "./groupOrderIntents";
import type { OrderInitiation } from "./types";
import { OrderIntentList } from "./components/OrderIntentList";
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
  const [groupMode, setGroupMode] = useState<OrderGroupMode>("day");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiDashboard, setApiDashboard] = useState<
    "coordinator" | "limited" | null
  >(null);

  const selected =
    intents.find((row) => row.order_intent_id === selectedId) ?? null;
  const coordinatorView = apiDashboard === "coordinator";

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
      const result = await fetchOrderInitiations(
        appConfig.apiBaseUrl,
        active
      );
      setIntents(result.intents);
      setApiDashboard(result.dashboard);
      setSelectedId((prev) =>
        prev &&
        result.intents.some((row) => row.order_intent_id === prev)
          ? prev
          : result.intents[0]?.order_intent_id ?? null
      );
    } catch (err) {
      setIntents([]);
      setApiDashboard(null);
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

  function handleHome() {
    setSelectedId(null);
    setError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
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
        onHome={handleHome}
        onSignOut={handleSignOut}
        loading={loading}
      />

      <main className="main">
        <section className="hero">
          <p className="hero-eyebrow">
            {coordinatorView ? "Coordinator dashboard" : "Donor dashboard (limited)"}
          </p>
          <div className="hero-headline-row">
            <h1>Order initiation history</h1>
            <div className="hero-stats" aria-live="polite">
              <span className="hero-stat-pill">
                <span className="hero-stat-value">{intents.length}</span>
                <span className="hero-stat-label">
                  {intents.length === 1 ? "initiation" : "initiations"}
                </span>
              </span>
              {coordinatorView ? (
                <span
                  className="hero-stat-pill hero-stat-pill-role"
                  title={sessionHeaderLabel(session)}
                >
                  <span className="hero-stat-label">Coordinator</span>
                  <span className="hero-stat-value hero-stat-value-sm">
                    {sessionHeaderLabel(session)}
                  </span>
                </span>
              ) : null}
            </div>
          </div>
          <p className="hero-lede">
            {coordinatorView
              ? "Each row shows the donor’s email and user id when Google sign-in stored it in the database."
              : "Neighbourhood feed — no other donors’ emails or ids; photos only within the last hour."}
          </p>
        </section>

        {error ? (
          <div className="banner banner-error" role="alert">
            {error}
          </div>
        ) : null}

        {apiDashboard === "limited" ? (
          <div className="banner" role="status">
            You are on the <strong>limited donor</strong> dashboard. Coordinator
            accounts see donor emails on each initiation. Ask an admin to add
            the <code>coordinator</code> role, then sign out and sign in again.
          </div>
        ) : null}

        {coordinatorView &&
        intents.length > 0 &&
        !intents.some((row) => row.donor_email?.trim()) ? (
          <div className="banner" role="status">
            No donor emails on these rows yet — usually because those donors
            never signed in with Google (only user ids in the database), or
            integration-service needs the latest deploy with email lookup.
          </div>
        ) : null}

        <div className="dashboard layout">
          <section className="panel list-panel" aria-labelledby="list-heading">
            <div className="panel-head">
              <h2 id="list-heading">Recent initiations</h2>
              {loading ? <span className="badge">Syncing…</span> : null}
            </div>
            {intents.length > 0 && coordinatorView ? (
              <div
                className="group-mode-toggle"
                role="group"
                aria-label="Group order initiations"
              >
                <button
                  type="button"
                  className={
                    groupMode === "donor"
                      ? "group-mode-btn active"
                      : "group-mode-btn"
                  }
                  onClick={() => setGroupMode("donor")}
                >
                  By donor
                </button>
                <button
                  type="button"
                  className={
                    groupMode === "day"
                      ? "group-mode-btn active"
                      : "group-mode-btn"
                  }
                  onClick={() => setGroupMode("day")}
                >
                  By day
                </button>
                <button
                  type="button"
                  className={
                    groupMode === "city"
                      ? "group-mode-btn active"
                      : "group-mode-btn"
                  }
                  disabled
                  title="City grouping will be available when location is stored on order intents"
                  onClick={() => setGroupMode("city")}
                >
                  By city (soon)
                </button>
              </div>
            ) : intents.length > 0 ? (
              <p className="sign-in-lede" style={{ marginBottom: "1rem" }}>
                Grouped by day. Reference photos appear only when the server
                allows (within the last hour).
              </p>
            ) : null}
            {intents.length === 0 && !loading ? (
              <p className="empty">No order initiations yet.</p>
            ) : (
              <OrderIntentList
                intents={intents}
                groupMode={coordinatorView ? groupMode : "day"}
                selectedId={selectedId}
                showDonorInList={coordinatorView}
                onSelect={setSelectedId}
              />
            )}
          </section>

          <section
            className="panel detail-panel"
            aria-labelledby="detail-heading"
          >
            <h2 id="detail-heading">Initiation detail</h2>
            {selected ? (
              <DetailView intent={selected} coordinatorView={coordinatorView} />
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
          SharingBridge · Signed in as {sessionHeaderLabel(session)} ·
          Session kept in this browser until sign-out or expiry
        </p>
      </footer>
    </div>
  );
}

function DetailView({
  intent,
  coordinatorView
}: {
  intent: OrderInitiation;
  coordinatorView: boolean;
}) {
  return (
    <dl className="detail-grid">
      <div>
        <dt>Reference</dt>
        <dd>{intent.order_intent_id}</dd>
      </div>
      {coordinatorView ? (
        <>
          <div>
            <dt>Donor email</dt>
            <dd>{intent.donor_email?.trim() || "—"}</dd>
          </div>
          <div>
            <dt>Donor user id</dt>
            <dd>{intent.user_id?.trim() || "—"}</dd>
          </div>
        </>
      ) : null}
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
