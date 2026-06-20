import type { DemandBoardSnapshot, SeekerDemandRow } from "./api/demandBoard";
import type { OrderConnection } from "./api/connections";
import { demandLineKey } from "./api/demandBoard";
import { initiationApiRouteLabel } from "./initiationLabels";

export function findSeekerDemandOnBoard(
  snapshot: DemandBoardSnapshot | null,
  orderCode: string,
  seekerDemandId?: string | null
): SeekerDemandRow | undefined {
  const code = orderCode.trim();
  const id = seekerDemandId?.trim();
  const rows = snapshot?.seeker_demands ?? [];
  if (id) {
    const byId = rows.find((row) => row.seeker_demand_id === id);
    if (byId) {
      return byId;
    }
  }
  if (code) {
    return rows.find((row) => row.order_code?.trim() === code);
  }
  return undefined;
}

export function orderContactChipLabel(
  orderCode: string,
  snapshot: DemandBoardSnapshot | null
): string {
  const demand = findSeekerDemandOnBoard(snapshot, orderCode);
  const menu = demand?.menu_label?.trim() || demand?.need_description?.trim();
  return menu ? `${orderCode} · ${menu}` : orderCode;
}

export function formatDemandStatus(status: string | null | undefined): string {
  switch (String(status ?? "").trim().toLowerCase()) {
    case "fulfilled":
      return "Delivered";
    case "cancelled":
      return "Cancelled";
    case "aggregated":
      return "Aggregated";
    case "recorded":
    default:
      return "Open";
  }
}

export function formatRecordedAt(iso: string | null | undefined): string {
  if (!iso?.trim()) {
    return "";
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  });
}

export function demandAreaLabel(connection: OrderConnection): string {
  const location = connection.demand?.location_label?.trim();
  const locality = connection.locality_key?.trim();
  if (location && locality) {
    return `${location} (${locality})`;
  }
  return location || locality || "";
}

export function actionsDemandLineKey(connection: OrderConnection): string | null {
  const locality = connection.locality_key?.trim();
  const offerId = connection.demand?.standard_offer_id?.trim();
  if (!locality || !offerId) {
    return null;
  }
  return demandLineKey({
    locality_key: locality,
    standard_offer_id: offerId,
    demand_count: 0,
    meal_units_total: 0,
    latest_at: ""
  });
}

export function connectionInitiationSummary(connection: OrderConnection): {
  routeLabel: string;
  headline: string;
  statusLabel: string;
  recordedAt: string;
  area: string;
  notes: string;
} {
  const routeLabel = initiationApiRouteLabel(connection.initiation_route);
  const need =
    connection.demand?.need_description?.trim() ||
    connection.menu_label?.trim() ||
    "Meal need";
  const headline =
    connection.menu_label?.trim() &&
    connection.menu_label.trim() !== need
      ? `${connection.menu_label.trim()} — ${need}`
      : need;

  return {
    routeLabel,
    headline,
    statusLabel: formatDemandStatus(connection.demand?.status),
    recordedAt: formatRecordedAt(connection.demand?.recorded_at),
    area: demandAreaLabel(connection),
    notes: connection.demand?.verbal_notes?.trim() ?? ""
  };
}
