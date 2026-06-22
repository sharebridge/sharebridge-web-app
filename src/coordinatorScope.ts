/** Coordinator-selected list filters (mapped to integration-service query params). */

export type CoordinatorSincePreset = "" | "2h" | "24h" | "7d" | "30d";

export type CoordinatorAreaMode = "all" | "near" | "locality";

export type CoordinatorScopeFilters = {
  since: CoordinatorSincePreset;
  areaMode: CoordinatorAreaMode;
  localityKey: string;
};

export const DEFAULT_COORDINATOR_SCOPE: CoordinatorScopeFilters = {
  since: "",
  areaMode: "all",
  localityKey: ""
};

export const COORDINATOR_SINCE_OPTIONS: {
  value: CoordinatorSincePreset;
  label: string;
}[] = [
  { value: "", label: "All time" },
  { value: "2h", label: "Last 2 hours" },
  { value: "24h", label: "Last 24 hours" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" }
];

export const COORDINATOR_AREA_OPTIONS: {
  value: CoordinatorAreaMode;
  label: string;
}[] = [
  { value: "all", label: "All areas" },
  { value: "near", label: "Near my location" },
  { value: "locality", label: "Postal area key" }
];

export function coordinatorScopeCollapsedSummary(
  filters: CoordinatorScopeFilters
): string {
  const timeLabel =
    COORDINATOR_SINCE_OPTIONS.find((option) => option.value === filters.since)
      ?.label ?? "All time";
  let areaLabel =
    COORDINATOR_AREA_OPTIONS.find((option) => option.value === filters.areaMode)
      ?.label ?? "All areas";
  if (filters.areaMode === "locality") {
    const key = normalizeLocalityKey(filters.localityKey);
    areaLabel = key ? `Postal area ${key}` : "Postal area key";
  }
  return `${timeLabel} · ${areaLabel}`;
}

export type OrderListQuery = {
  since?: string;
  near_lat?: number;
  near_lng?: number;
  locality_key?: string;
};

/** Stable empty query — avoids new `{}` references each render. */
export const EMPTY_ORDER_LIST_QUERY: OrderListQuery = {};

export function orderListQueryKey(query: OrderListQuery = EMPTY_ORDER_LIST_QUERY): string {
  const parts: string[] = [];
  if (query.since) {
    parts.push(`since=${query.since}`);
  }
  if (query.locality_key) {
    parts.push(`locality_key=${query.locality_key}`);
  }
  if (query.near_lat != null) {
    parts.push(`near_lat=${query.near_lat}`);
  }
  if (query.near_lng != null) {
    parts.push(`near_lng=${query.near_lng}`);
  }
  return parts.length > 0 ? parts.join("&") : "all";
}

export function normalizeLocalityKey(key: string): string {
  const trimmed = key.trim();
  if (!trimmed) {
    return "";
  }
  return trimmed
    .split(":")
    .map((part) => part.trim().toUpperCase())
    .filter(Boolean)
    .join(":");
}

export function coordinatorScopeToQuery(
  filters: CoordinatorScopeFilters,
  viewerCoords: { near_lat: number; near_lng: number } | null
): OrderListQuery {
  const query: OrderListQuery = {};
  if (filters.since) {
    query.since = filters.since;
  }
  if (filters.areaMode === "near" && viewerCoords) {
    query.near_lat = viewerCoords.near_lat;
    query.near_lng = viewerCoords.near_lng;
  } else if (filters.areaMode === "locality") {
    const key = normalizeLocalityKey(filters.localityKey);
    if (key) {
      query.locality_key = key;
    }
  }
  return query;
}

export function demandBoardQueryFromScope(
  filters: CoordinatorScopeFilters,
  viewerCoords: { near_lat: number; near_lng: number } | null
): OrderListQuery {
  return coordinatorScopeToQuery(filters, viewerCoords);
}
