import { useCallback, useEffect, useState } from "react";
import { GoogleOAuthProvider, googleLogout } from "@react-oauth/google";
import {
  ApiError,
  fetchOrderInitiations,
  patchOrderIntent
} from "./api/orderIntents";
import {
  fetchDemandBoard,
  type SeekerDemandRow
} from "./api/demandBoard";
import { SignInPage } from "./components/SignInPage";
import { SiteHeader } from "./components/SiteHeader";
import {
  clearSession,
  isSessionExpired,
  loadSession,
  saveSession,
  type AuthSession
} from "./authSession";
import { DashboardHero } from "./components/DashboardHero";
import { getAppConfig } from "./config";
import { sessionHeaderLabel } from "./sessionRole";
import type { OrderGroupMode } from "./groupOrderIntents";
import type { OrderInitiation } from "./types";
import { OrderIntentList } from "./components/OrderIntentList";
import { OrderIntentDetail } from "./components/OrderIntentDetail";
import { OrderIntentsMap } from "./components/OrderIntentsMap";
import { DemandBoardPanel } from "./components/DemandBoardPanel";
import { useMobileLayout } from "./hooks/useMobileLayout";
import {
  donorEmptyListMessage,
  donorFeedLede,
  donorNoHandoverLocationNotice,
  feedScopeFromApi,
  type FeedScope
} from "./feedScope";
import { GroupModeToolbar } from "./components/GroupModeToolbar";
import { LocationRequiredDialog } from "./components/LocationRequiredDialog";
import {
  locationRequiredMessage,
  readViewerLocation
} from "./viewerLocation";

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
  const [locationNotice, setLocationNotice] = useState<string | null>(null);
  const [feedScope, setFeedScope] = useState<FeedScope | null>(null);
  const [viewerLocationShared, setViewerLocationShared] = useState(false);
  const [areaLoading, setAreaLoading] = useState(false);
  const [locationDialogMessage, setLocationDialogMessage] = useState<
    string | null
  >(null);
  const [dashboardMode, setDashboardMode] = useState<
    "list" | "map" | "demand"
  >("list");
  const [seekerDemands, setSeekerDemands] = useState<SeekerDemandRow[]>([]);
  const [opsSaving, setOpsSaving] = useState(false);
  const [demandRefreshKey, setDemandRefreshKey] = useState(0);
  const isMobileLayout = useMobileLayout();

  const selected =
    intents.find((row) => row.order_intent_id === selectedId) ?? null;
  const coordinatorView = apiDashboard === "coordinator";
  const showGroupToolbar =
    coordinatorView && intents.length > 0
      ? true
      : apiDashboard === "limited" || (apiDashboard == null && !coordinatorView);
  const loadHistory = useCallback(
    async (
      active: AuthSession,
      viewerCoords: { near_lat: number; near_lng: number } | null = null
    ) => {
    if (isSessionExpired(active)) {
      clearSession();
      setSession(null);
      setError("Your session expired. Please sign in again.");
      return;
    }

    setLoading(true);
    setError(null);
    setLocationNotice(null);
    setFeedScope(null);
    setViewerLocationShared(viewerCoords != null);
    try {
      const result = await fetchOrderInitiations(
        appConfig.apiBaseUrl,
        active,
        viewerCoords
      );
      setIntents(result.intents);
      setApiDashboard(result.dashboard);
      const scope =
        result.dashboard === "limited"
          ? feedScopeFromApi(result.feedMeta)
          : null;
      setFeedScope(scope);
      setSelectedId((prev) =>
        prev &&
        result.intents.some((row) => row.order_intent_id === prev)
          ? prev
          : result.intents[0]?.order_intent_id ?? null
      );
    } catch (err) {
      setIntents([]);
      setApiDashboard(null);
      setFeedScope(null);
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
  },
    []
  );

  const loadByAreaWithFreshLocation = useCallback(
    async (active: AuthSession): Promise<boolean> => {
      const location = await readViewerLocation();
      if (location.status !== "granted") {
        setLocationDialogMessage(
          locationRequiredMessage(location.reason)
        );
        return false;
      }
      try {
        await loadHistory(active, {
          near_lat: location.coords.lat,
          near_lng: location.coords.lng
        });
        return true;
      } catch {
        return false;
      }
    },
    [loadHistory]
  );

  const handleGroupModeClick = useCallback(
    async (nextMode: OrderGroupMode) => {
      if (!session) {
        return;
      }
      if (nextMode !== "locality") {
        setGroupMode(nextMode);
        await loadHistory(session, null);
        return;
      }

      setAreaLoading(true);
      const ok = await loadByAreaWithFreshLocation(session);
      setAreaLoading(false);
      if (ok) {
        setGroupMode("locality");
      }
    },
    [session, loadHistory, loadByAreaWithFreshLocation]
  );

  const handleRefresh = useCallback(async () => {
    if (!session) {
      return;
    }
    if (dashboardMode === "demand") {
      setDemandRefreshKey((key) => key + 1);
      return;
    }
    if (groupMode === "locality") {
      setAreaLoading(true);
      await loadByAreaWithFreshLocation(session);
      setAreaLoading(false);
    } else {
      await loadHistory(session, null);
    }
  }, [session, dashboardMode, groupMode, loadHistory, loadByAreaWithFreshLocation]);

  useEffect(() => {
    if (session) {
      void loadHistory(session, null);
    }
  }, [session, loadHistory]);

  useEffect(() => {
    if (!session || dashboardMode !== "map") {
      return;
    }
    void fetchDemandBoard(appConfig.apiBaseUrl, session)
      .then((board) => setSeekerDemands(board.seeker_demands))
      .catch(() => setSeekerDemands([]));
  }, [session, dashboardMode]);

  const handleMarkPaymentDone = useCallback(async (intentId?: string) => {
    const targetId = intentId ?? selectedId;
    if (!session || !targetId) {
      return;
    }
    setOpsSaving(true);
    try {
      const updated = await patchOrderIntent(
        appConfig.apiBaseUrl,
        session,
        targetId,
        { payment_status: "paid_externally" }
      );
      setIntents((rows) =>
        rows.map((row) =>
          row.order_intent_id === updated.order_intent_id ? updated : row
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update payment.");
    } finally {
      setOpsSaving(false);
    }
  }, [session, selectedId]);

  const handleMarkDelivered = useCallback(async (intentId?: string) => {
    const targetId = intentId ?? selectedId;
    if (!session || !targetId || !coordinatorView) {
      return;
    }
    setOpsSaving(true);
    try {
      const updated = await patchOrderIntent(
        appConfig.apiBaseUrl,
        session,
        targetId,
        { delivery_status: "delivered" }
      );
      setIntents((rows) =>
        rows.map((row) =>
          row.order_intent_id === updated.order_intent_id ? updated : row
        )
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not update delivery."
      );
    } finally {
      setOpsSaving(false);
    }
  }, [session, selectedId, coordinatorView]);

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
        onRefresh={() => void handleRefresh()}
        onHome={handleHome}
        onSignOut={handleSignOut}
        loading={loading || areaLoading}
      />

      {locationDialogMessage ? (
        <LocationRequiredDialog
          message={locationDialogMessage}
          onClose={() => setLocationDialogMessage(null)}
        />
      ) : null}

      <main className="main">
        <DashboardHero
          kind={coordinatorView ? "coordinator" : "initiator"}
          session={session}
          initiationCount={intents.length}
          feedLede={
            coordinatorView ? undefined : donorFeedLede(feedScope)
          }
        />

        {error ? (
          <div className="banner banner-error" role="alert">
            {error}
          </div>
        ) : null}

        {apiDashboard === "limited" ? (
          <div className="banner" role="status">
            You are on the initiator dashboard with limited view. Request admin to
            add more roles if you have legitimate reasons.
          </div>
        ) : null}

        {apiDashboard === "limited" &&
        groupMode !== "locality" &&
        !viewerLocationShared ? (
          <div className="banner banner-info" role="status">
            Showing only initiations you registered. Tap <strong>By area</strong>{" "}
            and allow location to load neighbourhood orders from other initiators.
          </div>
        ) : null}

        {locationNotice ? (
          <div className="banner" role="status">
            {locationNotice}
          </div>
        ) : null}

        {apiDashboard === "limited" &&
        viewerLocationShared &&
        intents.some(
          (row) =>
            row.distance_m == null &&
            row.user_id !== session.userId
        ) ? (
          <div className="banner banner-info" role="status">
            {donorNoHandoverLocationNotice()}
          </div>
        ) : null}

        {coordinatorView &&
        intents.length > 0 &&
        !intents.some(
          (row) => (row.initiator_email ?? row.donor_email)?.trim()
        ) ? (
          <div className="banner" role="status">
            No initiator emails on these rows yet — usually because those initiators
            never signed in with Google (only user ids in the database), or
            integration-service needs the latest deploy with email lookup.
          </div>
        ) : null}

        {showGroupToolbar && dashboardMode === "list" ? (
          <GroupModeToolbar
            coordinatorView={coordinatorView}
            groupMode={groupMode}
            areaLoading={areaLoading}
            onSelect={(mode) => void handleGroupModeClick(mode)}
          />
        ) : null}

        <div className="view-mode-toolbar" role="tablist" aria-label="Dashboard view">
          <button
            type="button"
            role="tab"
            aria-selected={dashboardMode === "list"}
            className={
              dashboardMode === "list" ? "view-mode-btn active" : "view-mode-btn"
            }
            onClick={() => setDashboardMode("list")}
          >
            List
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={dashboardMode === "map"}
            className={
              dashboardMode === "map" ? "view-mode-btn active" : "view-mode-btn"
            }
            onClick={() => setDashboardMode("map")}
          >
            Map
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={dashboardMode === "demand"}
            className={
              dashboardMode === "demand"
                ? "view-mode-btn active"
                : "view-mode-btn"
            }
            onClick={() => setDashboardMode("demand")}
          >
            Demand
          </button>
        </div>

        {dashboardMode === "demand" ? (
          <DemandBoardPanel session={session} refreshKey={demandRefreshKey} />
        ) : dashboardMode === "map" ? (
          <OrderIntentsMap
            intents={intents}
            seekerDemands={seekerDemands}
            selectedId={selectedId}
            onSelect={setSelectedId}
            coordinatorView={coordinatorView}
            viewerUserId={session.userId}
          />
        ) : (
          <div
            className={
              isMobileLayout
                ? "dashboard layout layout-mobile-inline"
                : "dashboard layout"
            }
          >
            <section className="panel list-panel" aria-labelledby="list-heading">
              <div className="panel-head">
                <h2 id="list-heading">Recent initiations</h2>
                {loading ? <span className="badge">Syncing…</span> : null}
              </div>
              {intents.length === 0 && !loading ? (
                <p className="empty">
                  {apiDashboard === "limited"
                    ? donorEmptyListMessage(feedScope, viewerLocationShared)
                    : "No order initiations yet."}
                </p>
              ) : (
                <OrderIntentList
                  intents={intents}
                  groupMode={groupMode}
                  selectedId={selectedId}
                  showDonorInList={coordinatorView}
                  coordinatorView={coordinatorView}
                  showInlineDetail={isMobileLayout}
                  viewerUserId={session.userId}
                  opsSaving={opsSaving}
                  onSelect={setSelectedId}
                  onMarkPaymentDone={(id) => void handleMarkPaymentDone(id)}
                  onMarkDelivered={(id) => void handleMarkDelivered(id)}
                />
              )}
            </section>

            <section
              className="panel detail-panel detail-panel-desktop"
              aria-labelledby="detail-heading"
            >
              <h2 id="detail-heading">Initiation detail</h2>
              {selected ? (
                <OrderIntentDetail
                  intent={selected}
                  coordinatorView={coordinatorView}
                  canMarkPaymentDone={
                    !coordinatorView &&
                    selected.user_id === session.userId &&
                    selected.payment_status !== "paid_externally"
                  }
                  markingPayment={opsSaving}
                  onMarkPaymentDone={() =>
                    void handleMarkPaymentDone(selected.order_intent_id)
                  }
                  canMarkDelivered={
                    coordinatorView && selected.delivery_status !== "delivered"
                  }
                  markingDelivered={opsSaving}
                  onMarkDelivered={() =>
                    void handleMarkDelivered(selected.order_intent_id)
                  }
                />
              ) : (
                <p className="empty">
                  Select an initiation to review handover context.
                </p>
              )}
            </section>
          </div>
        )}
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
