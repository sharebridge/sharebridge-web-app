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
    const key = filters.localityKey.trim();
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
