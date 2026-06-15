import { formatWhen } from "../format";
import type { PledgeRow, VendorBidRow } from "../api/demandBoard";

type LedgerTab = "pledges" | "bids";

type Props = {
  ledgerTab: LedgerTab;
  onLedgerTabChange: (tab: LedgerTab) => void;
  pledges: PledgeRow[];
  bids: VendorBidRow[];
  coordinator: boolean;
  selectedLineLabel: string | null;
};

export function SupplyLedgerPanel({
  ledgerTab,
  onLedgerTabChange,
  pledges,
  bids,
  coordinator,
  selectedLineLabel
}: Props) {
  return (
    <section className="panel supply-ledger-panel" aria-labelledby="supply-ledger-heading">
      <div className="panel-head">
        <h2 id="supply-ledger-heading">Pledges &amp; kitchen commits</h2>
      </div>
      {selectedLineLabel ? (
        <p className="panel-lede">Showing entries for {selectedLineLabel}</p>
      ) : (
        <p className="panel-lede">
          Select a demand line to focus this ledger, or browse all entries below.
        </p>
      )}
      <div
        className="supply-ledger-tabs"
        role="tablist"
        aria-label="Pledge and kitchen commit ledger"
      >
        <button
          type="button"
          role="tab"
          aria-selected={ledgerTab === "pledges"}
          className={
            ledgerTab === "pledges" ? "view-mode-btn active" : "view-mode-btn"
          }
          onClick={() => onLedgerTabChange("pledges")}
        >
          Meal pledges ({pledges.length})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={ledgerTab === "bids"}
          className={
            ledgerTab === "bids" ? "view-mode-btn active" : "view-mode-btn"
          }
          onClick={() => onLedgerTabChange("bids")}
        >
          Kitchen commits ({bids.length})
        </button>
      </div>
      {ledgerTab === "pledges" ? (
        pledges.length === 0 ? (
          <p className="empty">No pledges match this filter.</p>
        ) : (
          <ul className="supply-ledger-list">
            {pledges.map((row) => (
              <li key={row.pledge_id} className="supply-ledger-item">
                <strong>
                  {row.menu_label ?? row.standard_offer_id ?? row.locality_key}
                </strong>
                <span className="intent-meta">
                  {row.meal_units} unit{row.meal_units === 1 ? "" : "s"} @{" "}
                  {row.locality_key} · {row.status} · {formatWhen(row.created_at)}
                  {coordinator && row.pledged_by_user_id
                    ? ` · ${row.pledged_by_user_id}`
                    : ""}
                  {row.matches_demand_bucket === false ? " · unmatched" : ""}
                </span>
              </li>
            ))}
          </ul>
        )
      ) : bids.length === 0 ? (
        <p className="empty">No kitchen commits match this filter.</p>
      ) : (
        <ul className="supply-ledger-list">
          {bids.map((row) => (
            <li key={row.vendor_bid_id} className="supply-ledger-item">
              <strong>{row.vendor_name}</strong>
              <span className="intent-meta">
                {row.menu_label ?? row.standard_offer_id ?? "item"} @{" "}
                {row.locality_key} · {row.portions} portions · {row.status} ·{" "}
                {formatWhen(row.created_at)}
                {coordinator && row.submitted_by_user_id
                  ? ` · ${row.submitted_by_user_id}`
                  : ""}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
