import { useCallback, useEffect, useState } from "react";
import type { AuthSession } from "../authSession";
import { getAppConfig } from "../config";
import { formatWhen } from "../format";
import {
  fetchDemandBoard,
  type DemandBoardSnapshot,
  type SeekerDemandRow
} from "../api/demandBoard";

type Props = {
  session: AuthSession;
};

export function DemandBoardPanel({ session }: Props) {
  const [snapshot, setSnapshot] = useState<DemandBoardSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
              <h3 className="intent-group-title">Aggregated by area</h3>
              <ul className="preset-list">
                {snapshot.demand_windows.map((row) => (
                  <li key={row.locality_key}>
                    <strong>{row.locality_key}</strong> — {row.meal_units_total}{" "}
                    meal units · {row.demand_count} demand
                    {row.demand_count === 1 ? "" : "s"}
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
