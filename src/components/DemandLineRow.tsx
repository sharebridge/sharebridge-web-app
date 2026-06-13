import { demandLineKey, type DemandWindowRow } from "../api/demandBoard";
import type { AllocationHint } from "../api/demandBoard";

export type DemandLineDraft = {
  pledgeUnits: string;
  bidVendor: string;
  bidPortions: string;
};

export const DEFAULT_LINE_DRAFT: DemandLineDraft = {
  pledgeUnits: "1",
  bidVendor: "",
  bidPortions: "10"
};

type Props = {
  row: DemandWindowRow;
  coordinator: boolean;
  selected: boolean;
  draft: DemandLineDraft;
  submitting: boolean;
  onToggleSelect: () => void;
  onDraftChange: (next: DemandLineDraft) => void;
  onPledge: () => void;
  onBid: () => void;
};

export function DemandLineRow({
  row,
  coordinator,
  selected,
  draft,
  submitting,
  onToggleSelect,
  onDraftChange,
  onPledge,
  onBid
}: Props) {
  const lineKey = demandLineKey(row);
  const canPledge = Boolean(row.standard_offer_id);

  return (
    <li className={`demand-bucket-row${selected ? " demand-bucket-row-selected" : ""}`}>
      <div className="demand-bucket-head">
        <label className="demand-line-select">
          <input
            type="checkbox"
            checked={selected}
            onChange={onToggleSelect}
            aria-label={`Select ${row.menu_label ?? lineKey}`}
          />
        </label>
        <div className="demand-bucket-summary">
          <strong>{row.menu_label ?? row.standard_offer_id ?? "Item"}</strong>
          {row.price_inr != null ? ` (₹${row.price_inr})` : ""} @ {row.locality_key} —
          demand {row.meal_units_total} units ({row.demand_count} record
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
              <span
                className={`allocation-hint allocation-hint-${row.allocation_hint}`}
              >
                {allocationHintLabel(row.allocation_hint)}
              </span>
            </>
          ) : null}
        </div>
      </div>
      <div className="demand-inline-ops">
        <div className="demand-inline-op">
          <label>
            Pledge units
            <input
              type="number"
              min={1}
              value={draft.pledgeUnits}
              disabled={submitting || !canPledge}
              onChange={(event) =>
                onDraftChange({ ...draft, pledgeUnits: event.target.value })
              }
            />
          </label>
          <button
            type="button"
            className="btn btn-secondary btn-compact"
            disabled={submitting || !canPledge}
            onClick={onPledge}
          >
            Pledge
          </button>
        </div>
        {coordinator ? (
          <div className="demand-inline-op">
            <label>
              Vendor
              <input
                type="text"
                value={draft.bidVendor}
                placeholder="Kitchen name"
                disabled={submitting || !canPledge}
                onChange={(event) =>
                  onDraftChange({ ...draft, bidVendor: event.target.value })
                }
              />
            </label>
            <label>
              Portions
              <input
                type="number"
                min={1}
                value={draft.bidPortions}
                disabled={submitting || !canPledge}
                onChange={(event) =>
                  onDraftChange({ ...draft, bidPortions: event.target.value })
                }
              />
            </label>
            <button
              type="button"
              className="btn btn-secondary btn-compact"
              disabled={
                submitting || !canPledge || !draft.bidVendor.trim()
              }
              onClick={onBid}
            >
              Bid
            </button>
          </div>
        ) : null}
      </div>
    </li>
  );
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
