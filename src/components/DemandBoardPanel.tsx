import { useCallback, useEffect, useState } from "react";
import type { AuthSession } from "../authSession";
import { getAppConfig } from "../config";
import { formatWhen } from "../format";
import {
  createPledge,
  createVendorBid,
  fetchDemandBoard,
  type DemandBoardSnapshot,
  type DemandWindowRow,
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
  const [pledgeLocality, setPledgeLocality] = useState("");
  const [pledgeUnits, setPledgeUnits] = useState("1");
  const [bidLocality, setBidLocality] = useState("");
  const [bidVendor, setBidVendor] = useState("");
  const [bidPortions, setBidPortions] = useState("10");
  const [submitting, setSubmitting] = useState(false);
  const coordinator = isCoordinatorSession(session);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchDemandBoard(getAppConfig().apiBaseUrl, session);
      setSnapshot(data);
    } catch (err) {
      setSnapshot(null);
      setError(err instanceof Error ? err.message : "Could not load demand board.");
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
              <dt>Locality buckets</dt>
              <dd>{snapshot.demand_windows.length}</dd>
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
                Aggregated by area (demand vs pledge vs bid)
              </h3>
              <p className="demand-lede">
                Choose an area bucket below for pledges and vendor bids. Keys
                come from GPS (server km grid), not place names.
              </p>
              <ul className="preset-list demand-bucket-list">
                {snapshot.demand_windows.map((row) => (
                  <li key={row.locality_key} className="demand-bucket-row">
                    <div>
                      <strong>{row.locality_key}</strong> — demand{" "}
                      {row.meal_units_total} units ({row.demand_count} record
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
                    </div>
                    <div className="demand-bucket-actions">
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => setPledgeLocality(row.locality_key)}
                      >
                        Use for pledge
                      </button>
                      {coordinator ? (
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => setBidLocality(row.locality_key)}
                        >
                          Use for bid
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
              No seeker demands yet. Donors and coordinators can record from the
              mobile app hub → Record seeker demand.
            </p>
          )}

          {snapshot.pledges.length > 0 ? (
            <>
              <h3 className="intent-group-title">Meal pledges</h3>
              <ul className="preset-list">
                {snapshot.pledges.map((row) => (
                  <li key={row.pledge_id}>
                    <strong>{row.locality_key}</strong> — {row.meal_units} units ·{" "}
                    {row.status} · {formatWhen(row.created_at)}
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
                    <strong>{row.vendor_name}</strong> ({row.locality_key}) —{" "}
                    {row.portions} portions · {row.status}
                  </li>
                ))}
              </ul>
            </>
          ) : null}

          <h3 className="intent-group-title">Pledge meals (donor)</h3>
          <div className="detail-grid">
            <label htmlFor="pledge-locality-select">
              Area bucket
              <LocalityBucketSelect
                id="pledge-locality-select"
                windows={snapshot.demand_windows}
                value={pledgeLocality}
                onChange={setPledgeLocality}
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
            disabled={submitting || !pledgeLocality.trim()}
            onClick={() => {
              void (async () => {
                setSubmitting(true);
                try {
                  await createPledge(getAppConfig().apiBaseUrl, session, {
                    locality_key: pledgeLocality.trim(),
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

          {coordinator ? (
            <>
              <h3 className="intent-group-title">Vendor bid (coordinator)</h3>
              <p className="demand-lede">
                Temporary MVP entry until fulfiller accounts bid on their own.
              </p>
              <div className="detail-grid">
                <label htmlFor="bid-locality-select">
                  Area bucket
                  <LocalityBucketSelect
                    id="bid-locality-select"
                    windows={snapshot.demand_windows}
                    value={bidLocality}
                    onChange={setBidLocality}
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
                  submitting || !bidLocality.trim() || !bidVendor.trim()
                }
                onClick={() => {
                  void (async () => {
                    setSubmitting(true);
                    try {
                      await createVendorBid(getAppConfig().apiBaseUrl, session, {
                        locality_key: bidLocality.trim(),
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
            </>
          ) : null}
        </>
      ) : null}
    </section>
  );
}

function LocalityBucketSelect({
  id,
  windows,
  value,
  onChange
}: {
  id: string;
  windows: DemandWindowRow[];
  value: string;
  onChange: (localityKey: string) => void;
}) {
  if (windows.length === 0) {
    return (
      <p className="demand-lede">
        No buckets yet. Record seeker demand with GPS on mobile first.
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
      <option value="">Choose area bucket…</option>
      {windows.map((row) => (
        <option key={row.locality_key} value={row.locality_key}>
          {row.locality_key} — {row.meal_units_total} units demand (
          {row.unmet_demand_units ?? 0} unpledged)
        </option>
      ))}
    </select>
  );
}

function SeekerDemandCard({ row }: { row: SeekerDemandRow }) {
  return (
    <li className="intent-row-wrap">
      <div className="intent-inline-detail">
        <p>
          <strong>{row.need_description}</strong>
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
