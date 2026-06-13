import { useCallback, useEffect, useRef, useState } from "react";
import type { AuthSession } from "../authSession";
import { getAppConfig } from "../config";
import { formatWhen } from "../format";
import {
  createPledge,
  createVendorBid,
  demandBoardFeedMeta,
  demandLineKey,
  fetchDemandBoard,
  parseDemandLineKey,
  type DemandBoardSnapshot,
  type PledgeRow
} from "../api/demandBoard";
import {
  DEFAULT_LINE_DRAFT,
  DemandLineRow,
  type DemandLineDraft
} from "./DemandLineRow";
import {
  EMPTY_ORDER_LIST_QUERY,
  orderListQueryKey,
  type OrderListQuery
} from "../coordinatorScope";
import type { OrderFeedMeta } from "../feedScope";
import { isCoordinatorSession } from "../sessionRole";

type Props = {
  session: AuthSession;
  refreshKey?: number;
  scopeQuery?: OrderListQuery;
  onBoundariesChange?: (
    meta: OrderFeedMeta,
    coordinator: boolean
  ) => void;
  /** When true, hide outer panel chrome (embedded in Operations tab). */
  embedded?: boolean;
};

export function DemandBoardPanel({
  session,
  refreshKey = 0,
  scopeQuery = EMPTY_ORDER_LIST_QUERY,
  onBoundariesChange,
  embedded = false
}: Props) {
  const [snapshot, setSnapshot] = useState<DemandBoardSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [lineDrafts, setLineDrafts] = useState<Record<string, DemandLineDraft>>(
    {}
  );
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [bulkPledgeUnits, setBulkPledgeUnits] = useState("1");
  const [bulkBidVendor, setBulkBidVendor] = useState("");
  const [bulkBidPortions, setBulkBidPortions] = useState("10");
  const coordinator = isCoordinatorSession(session);
  const scopeQueryKey = orderListQueryKey(scopeQuery);
  const onBoundariesChangeRef = useRef(onBoundariesChange);
  onBoundariesChangeRef.current = onBoundariesChange;

  const getDraft = useCallback(
    (lineKey: string): DemandLineDraft =>
      lineDrafts[lineKey] ?? DEFAULT_LINE_DRAFT,
    [lineDrafts]
  );

  const setDraft = useCallback((lineKey: string, draft: DemandLineDraft) => {
    setLineDrafts((prev) => ({ ...prev, [lineKey]: draft }));
  }, []);

  const toggleSelected = useCallback((lineKey: string) => {
    setSelectedKeys((prev) =>
      prev.includes(lineKey)
        ? prev.filter((key) => key !== lineKey)
        : [...prev, lineKey]
    );
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchDemandBoard(
        getAppConfig().apiBaseUrl,
        session,
        scopeQuery
      );
      setSnapshot(data);
      onBoundariesChangeRef.current?.(
        demandBoardFeedMeta(data),
        isCoordinatorSession(session)
      );
    } catch (err) {
      setSnapshot(null);
      setError(
        err instanceof Error ? err.message : "Could not load demand board."
      );
    } finally {
      setLoading(false);
    }
  }, [session, scopeQuery, scopeQueryKey, refreshKey]);

  useEffect(() => {
    void load();
  }, [load]);

  const submitPledge = useCallback(
    async (lineKey: string, unitsRaw: string) => {
      const line = parseDemandLineKey(lineKey);
      if (!line.standard_offer_id) {
        throw new Error("This demand line has no standard menu item.");
      }
      await createPledge(getAppConfig().apiBaseUrl, session, {
        locality_key: line.locality_key,
        standard_offer_id: line.standard_offer_id,
        meal_units: Math.max(1, Number(unitsRaw) || 1)
      });
    },
    [session]
  );

  const submitBid = useCallback(
    async (lineKey: string, vendor: string, portionsRaw: string) => {
      const line = parseDemandLineKey(lineKey);
      if (!line.standard_offer_id) {
        throw new Error("This demand line has no standard menu item.");
      }
      await createVendorBid(getAppConfig().apiBaseUrl, session, {
        locality_key: line.locality_key,
        standard_offer_id: line.standard_offer_id,
        vendor_name: vendor.trim(),
        portions: Math.max(1, Number(portionsRaw) || 1)
      });
    },
    [session]
  );

  const runForLine = useCallback(
    async (
      lineKey: string,
      action: "pledge" | "bid"
    ) => {
      const draft = getDraft(lineKey);
      setSubmitting(true);
      setError(null);
      try {
        if (action === "pledge") {
          await submitPledge(lineKey, draft.pledgeUnits);
        } else {
          await submitBid(lineKey, draft.bidVendor, draft.bidPortions);
        }
        await load();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not save.");
      } finally {
        setSubmitting(false);
      }
    },
    [getDraft, load, submitBid, submitPledge]
  );

  const runBulk = useCallback(
    async (action: "pledge" | "bid") => {
      if (selectedKeys.length === 0) {
        return;
      }
      setSubmitting(true);
      setError(null);
      try {
        for (const lineKey of selectedKeys) {
          if (action === "pledge") {
            await submitPledge(lineKey, bulkPledgeUnits);
          } else {
            await submitBid(lineKey, bulkBidVendor, bulkBidPortions);
          }
        }
        setSelectedKeys([]);
        await load();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Bulk action failed.");
      } finally {
        setSubmitting(false);
      }
    },
    [bulkBidPortions, bulkBidVendor, bulkPledgeUnits, load, selectedKeys, submitBid, submitPledge]
  );

  const pledgeableWindows =
    snapshot?.demand_windows.filter((row) => row.standard_offer_id) ?? [];

  return (
    <section
      className={embedded ? "demand-panel-embedded" : "panel demand-panel"}
      aria-labelledby="demand-heading"
    >
      <div className="panel-head">
        <h2 id="demand-heading">Supply — pledge &amp; bid</h2>
        {loading && !embedded ? <span className="badge">Loading…</span> : null}
        {!embedded ? (
          <div className="panel-head-actions">
            <button
              type="button"
              className="btn btn-secondary"
              disabled={loading}
              onClick={() => void load()}
            >
              Refresh demand
            </button>
          </div>
        ) : null}
      </div>
      {error ? (
        <div className="banner banner-error" role="alert">
          {error}
        </div>
      ) : null}
      {snapshot ? (
        <>
          {!embedded && snapshot.message ? (
            <p className="demand-lede">{snapshot.message}</p>
          ) : null}

          {pledgeableWindows.length > 0 ? (
            <>
              <h3 className="intent-group-title">Demand lines</h3>

              {selectedKeys.length > 0 ? (
                <div className="demand-bulk-bar" role="region" aria-label="Bulk pledge and bid">
                  <span className="demand-bulk-count">
                    {selectedKeys.length} line
                    {selectedKeys.length === 1 ? "" : "s"} selected
                  </span>
                  <div className="demand-inline-op">
                    <label>
                      Bulk pledge units
                      <input
                        type="number"
                        min={1}
                        value={bulkPledgeUnits}
                        disabled={submitting}
                        onChange={(event) =>
                          setBulkPledgeUnits(event.target.value)
                        }
                      />
                    </label>
                    <button
                      type="button"
                      className="btn btn-secondary btn-compact"
                      disabled={submitting}
                      onClick={() => void runBulk("pledge")}
                    >
                      Apply pledge to selected
                    </button>
                  </div>
                  {coordinator ? (
                    <div className="demand-inline-op">
                      <label>
                        Vendor
                        <input
                          type="text"
                          value={bulkBidVendor}
                          placeholder="Kitchen name"
                          disabled={submitting}
                          onChange={(event) =>
                            setBulkBidVendor(event.target.value)
                          }
                        />
                      </label>
                      <label>
                        Portions
                        <input
                          type="number"
                          min={1}
                          value={bulkBidPortions}
                          disabled={submitting}
                          onChange={(event) =>
                            setBulkBidPortions(event.target.value)
                          }
                        />
                      </label>
                      <button
                        type="button"
                        className="btn btn-secondary btn-compact"
                        disabled={submitting || !bulkBidVendor.trim()}
                        onClick={() => void runBulk("bid")}
                      >
                        Apply bid to selected
                      </button>
                    </div>
                  ) : null}
                  <button
                    type="button"
                    className="btn btn-secondary btn-compact"
                    disabled={submitting}
                    onClick={() => setSelectedKeys([])}
                  >
                    Clear selection
                  </button>
                </div>
              ) : null}

              <ul className="preset-list demand-bucket-list">
                {pledgeableWindows.map((row) => {
                  const key = demandLineKey(row);
                  return (
                    <DemandLineRow
                      key={key}
                      row={row}
                      coordinator={coordinator}
                      selected={selectedKeys.includes(key)}
                      draft={getDraft(key)}
                      submitting={submitting}
                      onToggleSelect={() => toggleSelected(key)}
                      onDraftChange={(draft) => setDraft(key, draft)}
                      onPledge={() => void runForLine(key, "pledge")}
                      onBid={() => void runForLine(key, "bid")}
                    />
                  );
                })}
              </ul>
            </>
          ) : (
            <p className="empty">
              No aggregated demand lines in this scope. Widen the area filter or
              record a meal need from mobile.
            </p>
          )}

          {(snapshot.orphan_pledges?.length ?? 0) > 0 ? (
            <>
              <h3 className="intent-group-title">Unmatched pledges</h3>
              <ul className="preset-list">
                {snapshot.orphan_pledges?.map((row) => (
                  <li key={row.pledge_id}>
                    <PledgeListItem row={row} coordinator={coordinator} orphan />
                  </li>
                ))}
              </ul>
            </>
          ) : null}

          {snapshot.pledges.filter((row) => row.matches_demand_bucket !== false)
            .length > 0 ? (
            <>
              <h3 className="intent-group-title">Meal pledges</h3>
              <ul className="preset-list">
                {snapshot.pledges
                  .filter((row) => row.matches_demand_bucket !== false)
                  .map((row) => (
                    <li key={row.pledge_id}>
                      <PledgeListItem row={row} coordinator={coordinator} />
                    </li>
                  ))}
              </ul>
            </>
          ) : null}

          {snapshot.vendor_bids.length > 0 ? (
            <>
              <h3 className="intent-group-title">Vendor capacity bids</h3>
              <ul className="preset-list">
                {snapshot.vendor_bids.map((row) => (
                  <li key={row.vendor_bid_id}>
                    <strong>{row.vendor_name}</strong> —{" "}
                    {row.menu_label ?? row.standard_offer_id ?? "item"} @{" "}
                    {row.locality_key} — {row.portions} portions · {row.status}
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </>
      ) : null}
    </section>
  );
}

function PledgeListItem({
  row,
  coordinator,
  orphan = false
}: {
  row: PledgeRow;
  coordinator: boolean;
  orphan?: boolean;
}) {
  return (
    <>
      <strong>{row.menu_label ?? row.standard_offer_id ?? row.locality_key}</strong>
      {orphan ? " (unmatched)" : ""} @ {row.locality_key} — {row.meal_units}{" "}
      units · {row.status} · {formatWhen(row.created_at)}
      {coordinator && row.pledged_by_user_id ? (
        <> · initiator {row.pledged_by_user_id}</>
      ) : null}
    </>
  );
}

