import type {
  DemandBoardSnapshot,
  PledgeRow,
  SeekerDemandRow,
  VendorBidRow
} from "./api/demandBoard";
import { isConnectionOrderInProgress } from "./connectionOrderProgress";

export type DashboardNotificationRole =
  | "coordinator"
  | "initiator"
  | "pledger"
  | "kitchen";

export type DashboardNotification = {
  id: string;
  orderCode: string;
  menuLabel: string;
  viewerRole: DashboardNotificationRole;
  committedAt: string;
};

function pledgesForDemand(
  snapshot: DemandBoardSnapshot,
  demand: SeekerDemandRow
): PledgeRow[] {
  const locality = String(demand.locality_key ?? "").trim();
  const offerId = String(demand.standard_offer_id ?? "").trim();
  return snapshot.pledges.filter(
    (row) =>
      String(row.locality_key ?? "").trim() === locality &&
      String(row.standard_offer_id ?? "").trim() === offerId
  );
}

function findSeekerDemand(
  snapshot: DemandBoardSnapshot,
  bid: VendorBidRow
): SeekerDemandRow | undefined {
  const demandId = bid.seeker_demand_id?.trim();
  if (demandId) {
    return snapshot.seeker_demands.find(
      (row) => row.seeker_demand_id === demandId
    );
  }
  const orderCode = bid.order_code?.trim();
  if (orderCode) {
    const byCode = snapshot.seeker_demands.find(
      (row) => row.order_code?.trim() === orderCode
    );
    if (byCode) {
      return byCode;
    }
  }
  const locality = String(bid.locality_key ?? "").trim();
  const offerId = String(bid.standard_offer_id ?? "").trim();
  return snapshot.seeker_demands.find(
    (row) =>
      String(row.locality_key ?? "").trim() === locality &&
      String(row.standard_offer_id ?? "").trim() === offerId &&
      Boolean(row.order_code?.trim())
  );
}

function resolveViewerRole(
  userId: string,
  coordinator: boolean,
  demand: SeekerDemandRow | undefined,
  bid: VendorBidRow,
  pledges: PledgeRow[]
): DashboardNotificationRole | null {
  if (coordinator) {
    return "coordinator";
  }
  if (demand?.reported_by_user_id === userId) {
    return "initiator";
  }
  if (bid.submitted_by_user_id === userId) {
    return "kitchen";
  }
  if (pledges.some((row) => row.pledged_by_user_id === userId)) {
    return "pledger";
  }
  return null;
}

export function buildDashboardNotifications(
  snapshot: DemandBoardSnapshot | null,
  userId: string,
  options: { coordinator: boolean }
): DashboardNotification[] {
  if (!snapshot || !userId.trim()) {
    return [];
  }

  const byOrderCode = new Map<string, DashboardNotification>();

  for (const bid of snapshot.vendor_bids) {
    if (bid.commitment_status !== "committed") {
      continue;
    }
    const orderCode = bid.order_code?.trim();
    if (!orderCode) {
      continue;
    }
    const demand = findSeekerDemand(snapshot, bid);
    if (!isConnectionOrderInProgress(demand)) {
      continue;
    }
    const pledges = demand ? pledgesForDemand(snapshot, demand) : [];
    const viewerRole = resolveViewerRole(
      userId,
      options.coordinator,
      demand,
      bid,
      pledges
    );
    if (!viewerRole) {
      continue;
    }

    const committedAt = bid.created_at;
    const existing = byOrderCode.get(orderCode);
    if (
      existing &&
      Date.parse(existing.committedAt) >= Date.parse(committedAt)
    ) {
      continue;
    }

    byOrderCode.set(orderCode, {
      id: `connection-${orderCode}`,
      orderCode,
      menuLabel: bid.menu_label ?? demand?.menu_label ?? "",
      viewerRole,
      committedAt
    });
  }

  return [...byOrderCode.values()].sort(
    (a, b) => Date.parse(b.committedAt) - Date.parse(a.committedAt)
  );
}

export function dashboardNotificationSummary(
  notification: DashboardNotification
): string {
  const menu = notification.menuLabel.trim();
  const menuSuffix = menu ? ` (${menu})` : "";
  switch (notification.viewerRole) {
    case "coordinator":
      return `Order ${notification.orderCode}${menuSuffix} — kitchen committed; connection ready on Actions.`;
    case "initiator":
      return `Order ${notification.orderCode}${menuSuffix} — your initiation has a kitchen commitment. Open Connection for emails.`;
    case "pledger":
      return `Order ${notification.orderCode}${menuSuffix} — kitchen committed on a demand you pledged. Open Connection for emails.`;
    case "kitchen":
      return `Order ${notification.orderCode}${menuSuffix} — your kitchen commitment is live. Open Connection for payer emails.`;
    default:
      return `Order ${notification.orderCode} — connection ready.`;
  }
}
