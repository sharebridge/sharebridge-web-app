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
