import {
  demandLineKey,
  parseDemandLineKey,
  type DemandWindowRow,
  type PledgeRow,
  type VendorBidRow
} from "./api/demandBoard";

export type SupplyStatusFilter =
  | "all"
  | "pending_pledge"
  | "pending_bid"
  | "my_pledges";

export const SUPPLY_STATUS_FILTER_LABELS: Record<SupplyStatusFilter, string> = {
  all: "All lines",
  pending_pledge: "Needs pledge",
  pending_bid: "Needs kitchen commit",
  my_pledges: "My pledges"
};

export function filterDemandLines(
  rows: DemandWindowRow[],
  filter: SupplyStatusFilter,
  viewerUserId: string,
  pledges: PledgeRow[]
): DemandWindowRow[] {
  const pledgeable = rows.filter((row) => row.standard_offer_id);
  if (filter === "all") {
    return pledgeable;
  }
  if (filter === "pending_pledge") {
    return pledgeable.filter((row) => (row.unmet_demand_units ?? 0) > 0);
  }
  if (filter === "pending_bid") {
    return pledgeable.filter((row) => (row.supply_gap_units ?? 0) > 0);
  }
  const myKeys = new Set(
    pledges
      .filter((row) => row.pledged_by_user_id === viewerUserId)
      .map((row) =>
        demandLineKey({
          locality_key: row.locality_key,
          standard_offer_id: row.standard_offer_id ?? ""
        } as DemandWindowRow)
      )
  );
  return pledgeable.filter((row) => myKeys.has(demandLineKey(row)));
}

export function pledgesForLine(
  pledges: PledgeRow[],
  lineKey: string | null
): PledgeRow[] {
  if (!lineKey) {
    return pledges;
  }
  const { locality_key, standard_offer_id } = parseDemandLineKey(lineKey);
  return pledges.filter(
    (row) =>
      row.locality_key === locality_key &&
      (row.standard_offer_id ?? "") === (standard_offer_id ?? "")
  );
}

export function bidsForLine(
  bids: VendorBidRow[],
  lineKey: string | null
): VendorBidRow[] {
  if (!lineKey) {
    return bids;
  }
  const { locality_key, standard_offer_id } = parseDemandLineKey(lineKey);
  return bids.filter(
    (row) =>
      row.locality_key === locality_key &&
      (row.standard_offer_id ?? "") === (standard_offer_id ?? "")
  );
}

export function filterPledgesLedger(
  pledges: PledgeRow[],
  orphanPledges: PledgeRow[],
  filter: SupplyStatusFilter,
  viewerUserId: string,
  lineKey: string | null
): PledgeRow[] {
  const combined = [...pledges, ...orphanPledges];
  let rows = lineKey ? pledgesForLine(combined, lineKey) : combined;

  if (filter === "my_pledges") {
    return rows.filter((row) => row.pledged_by_user_id === viewerUserId);
  }
  if (filter === "pending_pledge") {
    return rows.filter((row) => row.status === "pledged");
  }
  return rows;
}

export function filterBidsLedger(
  bids: VendorBidRow[],
  filter: SupplyStatusFilter,
  lineKey: string | null
): VendorBidRow[] {
  let rows = lineKey ? bidsForLine(bids, lineKey) : bids;
  if (filter === "pending_bid") {
    return rows.filter((row) => row.status === "submitted");
  }
  return rows;
}

export function lineLabelFromKey(
  lineKey: string,
  rows: DemandWindowRow[]
): string {
  const row = rows.find((entry) => demandLineKey(entry) === lineKey);
  if (!row) {
    return lineKey;
  }
  return `${row.menu_label ?? row.standard_offer_id} @ ${row.locality_key}`;
}
