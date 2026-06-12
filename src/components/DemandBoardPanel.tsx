import { useCallback, useEffect, useRef, useState } from "react";
import type { AuthSession } from "../authSession";
import { getAppConfig } from "../config";
import { formatWhen } from "../format";
import {
  createPledge,
  createVendorBid,
  demandLineKey,
  fetchDemandBoard,
  parseDemandLineKey,
  type AllocationHint,
  type DemandBoardSnapshot,
  type DemandWindowRow,
  type PledgeRow,
  type SeekerDemandRow
} from "../api/demandBoard";
import { isCoordinatorSession } from "../sessionRole";

type Props = {
  session: AuthSession;
  /** Bumped by header Refresh while Demand tab is active. */
  refreshKey?: number;
};

export function DemandBoardPanel({ session, refreshKey = 0 }: Props) {
  const [snapshot, setSnapshot] = useState<DemandBoardSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pledgeLineKey, setPledgeLineKey] = useState("");
  const [pledgeUnits, setPledgeUnits] = useState("1");
  const [bidLineKey, setBidLineKey] = useState("");
  const [bidVendor, setBidVendor] = useState("");
  const [bidPortions, setBidPortions] = useState("10");
  const [submitting, setSubmitting] = useState(false);
  const pledgeFormRef = useRef<HTMLDivElement>(null);
  const bidFormRef = useRef<HTMLDivElement>(null);
  const coordinator = isCoordinatorSession(session);

  const selectDemandLineForPledge = useCallback((lineKey: string) => {
    setPledgeLineKey(lineKey);
    requestAnimationFrame(() => {
      pledgeFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, []);

  const selectDemandLineForBid = useCallback((lineKey: string) => {
    setBidLineKey(lineKey);
    requestAnimationFrame(() => {
      bidFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchDemandBoard(getAppConfig().apiBaseUrl, session);
      setSnapshot(data);
    } catch (err) {
      setSnapshot(null);
      setError(
        err instanceof Error ? err.message : "Could not load demand board."
      );
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  return (
    <section className="panel demand-panel" aria-labelledby="demand-heading">
      <div className="panel-head">
        <h2 id="demand-heading">Demand &amp; vendor bids</h2>
        <div className="panel-head-actions">
          {loading ? <span className="badge">Loading…</span> : null}
          <button
            type="button"
            className="btn btn-secondary"
            disabled={loading}
            onClick={() => void load()}
          >
            Refresh demand
          </button>
        </div>
      </div>
      {error ? (
        <div className="banner banner-error" role="alert">
          {error}
        </div>
      ) : null}
      {snapshot ? (
        <>
          <p className="demand-lede">{snapshot.message}</p>
          <dl className="detail-grid">
            <div>
              <dt>Status</dt>
              <dd>{snapshot.status}</dd>
            </div>
            <div>
              <dt>Demand lines</dt>
              <dd>{snapshot.demand_windows.length}</dd>
            </div>
            <div>
              <dt>Standard menu items</dt>
              <dd>{snapshot.standard_offers.length}</dd>
            </div>
            <div>
              <dt>Recent demands</dt>
              <dd>{snapshot.seeker_demands.length}</dd>
            </div>
            <div>
              <dt>Vendor bids</dt>
              <dd>{snapshot.vendor_bids.length}</dd>
            </div>
          </dl>

          {snapshot.demand_windows.length > 0 ? (
            <>
              <h3 className="intent-group-title">
                Aggregated by menu item (demand vs pledge vs bid)
              </h3>
              <p className="demand-lede">
                Each line is one standard menu item in one area (e.g.{" "}
                <code>IN:TN:600115</code>). Tap <strong>Pick this for pledge</strong>{" "}
                or <strong>Pick this for bid</strong> to jump to the form below
                with that line pre-selected — then enter units and submit.
              </p>
              <ul className="preset-list demand-bucket-list">
                {snapshot.demand_windows.map((row) => (
                  <li key={demandLineKey(row)} className="demand-bucket-row">
                    <div>
                      <strong>{row.menu_label ?? row.standard_offer_id ?? "Item"}</strong>
                      {row.price_inr != null ? ` (₹${row.price_inr})` : ""} @{" "}
                      {row.locality_key} — demand {row.meal_units_total} units (
                      {row.demand_count} record
                      {row.demand_count === 1 ? "" : "s"}) · pledged{" "}
                      {row.pledged_units_total ?? 0} · vendor capacity{" "}
                      {row.bid_portions_total ?? 0}
                      {(row.unmet_demand_units ?? 0) > 0 ? (
                        <>
                          {" "}
                          · <span className="demand-gap">
                            {row.unmet_demand_units} units still unpledged
                          </span>
                        </>
                      ) : (
                        " · pledges cover demand"
                      )}
                      {(row.supply_gap_units ?? 0) > 0 ? (
                        <>
                          {" "}
                          · <span className="demand-gap">
                            {row.supply_gap_units} units short on vendor bids
                          </span>
                        </>
                      ) : null}
                      {row.allocation_hint ? (
                        <>
                          {" "}
                          ·{" "}
                          <span className={`allocation-hint allocation-hint-${row.allocation_hint}`}>
                            {allocationHintLabel(row.allocation_hint)}
                          </span>
                        </>
                      ) : null}
                    </div>
                    <div className="demand-bucket-actions">
                      <button
                        type="button"
                        className="btn btn-secondary"
                        aria-pressed={pledgeLineKey === demandLineKey(row)}
                        onClick={() =>
                          selectDemandLineForPledge(demandLineKey(row))
                        }
                      >
                        Pick this for pledge
                      </button>
                      {coordinator ? (
                        <button
                          type="button"
                          className="btn btn-secondary"
                          aria-pressed={bidLineKey === demandLineKey(row)}
                          onClick={() =>
                            selectDemandLineForBid(demandLineKey(row))
                          }
                        >
                          Pick this for bid
                        </button>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            </>
          ) : null}

          {snapshot.seeker_demands.length > 0 ? (
            <>
              <h3 className="intent-group-title">Recent seeker demands</h3>
              <ul className="intent-list">
                {snapshot.seeker_demands.map((row) => (
                  <SeekerDemandCard key={row.seeker_demand_id} row={row} />
                ))}
              </ul>
            </>
          ) : (
            <p className="empty">
              No meal needs yet. Initiators and coordinators can record from the
              mobile app hub → Record seeker demand.
            </p>
          )}

          {(snapshot.orphan_pledges?.length ?? 0) > 0 ? (
            <>
              <h3 className="intent-group-title">Unmatched pledges</h3>
              <p className="demand-lede demand-gap">
                These use a place name, old key, or wrong menu item — they do
                not count toward aggregated totals.
              </p>
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
          ) : snapshot.pledges.length === 0 ? null : (
            <p className="empty">No pledges matched to active demand buckets yet.</p>
          )}

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

          <div ref={pledgeFormRef} className="demand-form-block">
          <h3 className="intent-group-title">Pledge meals (initiator)</h3>
          {pledgeLineKey ? (
            <p className="demand-selection-banner" role="status">
              Selected:{" "}
              <strong>
                {demandLineLabel(
                  findDemandWindow(snapshot.demand_windows, pledgeLineKey)
                )}
              </strong>{" "}
              — enter meal units, then <strong>Submit pledge</strong>.
            </p>
          ) : (
            <p className="demand-lede">
              Choose a demand line from the list above or from the dropdown.
            </p>
          )}
          <div className="detail-grid">
            <label htmlFor="pledge-line-select">
              Demand line (menu item + area)
              <DemandLineSelect
                id="pledge-line-select"
                windows={snapshot.demand_windows}
                value={pledgeLineKey}
                onChange={setPledgeLineKey}
              />
            </label>
            <label>
              Meal units
              <input
                className="sign-in-google-btn"
                value={pledgeUnits}
                onChange={(e) => setPledgeUnits(e.target.value)}
              />
            </label>
          </div>
          <button
            type="button"
            className="btn btn-secondary"
            disabled={submitting || !pledgeLineKey.trim()}
            onClick={() => {
              void (async () => {
                setSubmitting(true);
                try {
                  const line = parseDemandLineKey(pledgeLineKey.trim());
                  await createPledge(getAppConfig().apiBaseUrl, session, {
                    locality_key: line.locality_key,
                    standard_offer_id: line.standard_offer_id,
                    meal_units: Number(pledgeUnits) || 1
                  });
                  await load();
                } catch (err) {
                  setError(
                    err instanceof Error ? err.message : "Could not pledge."
                  );
                } finally {
                  setSubmitting(false);
                }
              })();
            }}
          >
            Submit pledge
          </button>
          </div>

          {coordinator ? (
            <div ref={bidFormRef} className="demand-form-block">
              <h3 className="intent-group-title">Vendor bid (coordinator)</h3>
              <p className="demand-lede">
                Kitchen or vendor capacity for a demand line (MVP manual entry
                until fulfiller accounts bid on their own).
              </p>
              {bidLineKey ? (
                <p className="demand-selection-banner" role="status">
                  Selected:{" "}
                  <strong>
                    {demandLineLabel(
                      findDemandWindow(snapshot.demand_windows, bidLineKey)
                    )}
                  </strong>{" "}
                  — enter vendor name and portions, then{" "}
                  <strong>Submit vendor bid</strong>.
                </p>
              ) : null}
              <div className="detail-grid">
                <label htmlFor="bid-line-select">
                  Demand line (menu item + area)
                  <DemandLineSelect
                    id="bid-line-select"
                    windows={snapshot.demand_windows}
                    value={bidLineKey}
                    onChange={setBidLineKey}
                  />
                </label>
                <label>
                  Vendor name
                  <input
                    className="sign-in-google-btn"
                    value={bidVendor}
                    onChange={(e) => setBidVendor(e.target.value)}
                  />
                </label>
                <label>
                  Portions
                  <input
                    className="sign-in-google-btn"
                    value={bidPortions}
                    onChange={(e) => setBidPortions(e.target.value)}
                  />
                </label>
              </div>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={
                  submitting || !bidLineKey.trim() || !bidVendor.trim()
                }
                onClick={() => {
                  void (async () => {
                    setSubmitting(true);
                    try {
                      const line = parseDemandLineKey(bidLineKey.trim());
                      await createVendorBid(getAppConfig().apiBaseUrl, session, {
                        locality_key: line.locality_key,
                        standard_offer_id: line.standard_offer_id,
                        vendor_name: bidVendor.trim(),
                        portions: Number(bidPortions) || 1
                      });
                      await load();
                    } catch (err) {
                      setError(
                        err instanceof Error
                          ? err.message
                          : "Could not submit vendor bid."
                      );
                    } finally {
                      setSubmitting(false);
                    }
                  })();
                }}
              >
                Submit vendor bid
              </button>
            </div>
          ) : null}
        </>
      ) : null}
    </section>
  );
}

function DemandLineSelect({
  id,
  windows,
  value,
  onChange
}: {
  id: string;
  windows: DemandWindowRow[];
  value: string;
  onChange: (lineKey: string) => void;
}) {
  if (windows.length === 0) {
    return (
      <p className="demand-lede">
        No demand lines yet. Record seeker demand with a standard item on
        mobile first.
      </p>
    );
  }
  return (
    <select
      id={id}
      className="sign-in-google-btn demand-locality-select"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">Choose menu item + area…</option>
      {windows
        .filter((row) => row.standard_offer_id)
        .map((row) => (
          <option key={demandLineKey(row)} value={demandLineKey(row)}>
            {row.menu_label ?? row.standard_offer_id} @ {row.locality_key} —{" "}
            {row.meal_units_total} units demand (
            {row.unmet_demand_units ?? 0} unpledged)
          </option>
        ))}
    </select>
  );
}

function findDemandWindow(
  windows: DemandWindowRow[],
  lineKey: string
): DemandWindowRow | undefined {
  return windows.find((row) => demandLineKey(row) === lineKey);
}

function demandLineLabel(row: DemandWindowRow | undefined): string {
  if (!row) {
    return "demand line";
  }
  const menu = row.menu_label ?? row.standard_offer_id ?? "Item";
  return `${menu} @ ${row.locality_key}`;
}

function allocationHintLabel(hint: AllocationHint): string {
  switch (hint) {
    case "needs_pledges":
      return "Needs more pledges";
    case "needs_vendor_bids":
      return "Needs vendor capacity";
    case "balanced":
      return "Balanced — coordinator can plan handoff";
    default:
      return hint;
  }
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
      units · {row.status} ·{" "}
      {formatWhen(row.created_at)}
      {coordinator && row.pledged_by_user_id ? (
        <> · initiator {row.pledged_by_user_id}</>
      ) : null}
    </>
  );
}

function SeekerDemandCard({ row }: { row: SeekerDemandRow }) {
  return (
    <li className="intent-row-wrap">
      <div className="intent-inline-detail">
        <p>
          <strong>{row.menu_label ?? row.need_description}</strong>
          {row.price_inr != null ? ` · ₹${row.price_inr}` : ""}
        </p>
        <p className="intent-metrics">
          {row.meal_units} meal unit{row.meal_units === 1 ? "" : "s"}
          {row.locality_key ? ` · ${row.locality_key}` : ""} ·{" "}
          {formatWhen(row.created_at)}
        </p>
        {row.verbal_notes?.trim() ? (
          <p className="intent-meta">{row.verbal_notes}</p>
        ) : null}
      </div>
    </li>
  );
}
