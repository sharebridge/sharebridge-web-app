import { useCallback, useEffect, useState } from "react";
import type { AuthSession } from "../authSession";
import { getAppConfig } from "../config";
import { formatWhen } from "../format";
import {
  createPledge,
  createVendorBid,
  fetchDemandBoard,
  type DemandBoardSnapshot,
  type SeekerDemandRow
} from "../api/demandBoard";
import { isCoordinatorSession } from "../sessionRole";

type Props = {
  session: AuthSession;
};

export function DemandBoardPanel({ session }: Props) {
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
  }, [load]);

  return (
    <section className="panel demand-panel" aria-labelledby="demand-heading">
      <div className="panel-head">
        <h2 id="demand-heading">Demand &amp; vendor bids</h2>
        {loading ? <span className="badge">Loading…</span> : null}
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
                Pledge and bid forms must use the same locality key as a row
                below so totals line up. Auto-assignment to vendors is not live
                yet — gaps are for coordinator planning only.
              </p>
              <ul className="preset-list">
                {snapshot.demand_windows.map((row) => (
                  <li key={row.locality_key}>
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
            <label>
              Locality key
              <input
                className="sign-in-google-btn"
                list="demand-locality-keys"
                value={pledgeLocality}
                onChange={(e) => setPledgeLocality(e.target.value)}
                placeholder="Pick from aggregated list above"
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
                <label>
                  Locality key
                  <input
                    className="sign-in-google-btn"
                    list="demand-locality-keys"
                    value={bidLocality}
                    onChange={(e) => setBidLocality(e.target.value)}
                    placeholder="Pick from aggregated list above"
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
          <datalist id="demand-locality-keys">
            {snapshot.demand_windows.map((row) => (
              <option key={row.locality_key} value={row.locality_key} />
            ))}
          </datalist>
        </>
      ) : null}
    </section>
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
