/** Parsed from integration-service list response (`feed` or `since` + `neighbourhood`). */
export type FeedScope = {
  windowHours: number;
  radiusKm: number;
  locationMode: "near" | "locality" | "own_only";
};

export type OrderFeedMeta = {
  since?: string;
  neighbourhood?: Record<string, unknown>;
  feed?: {
    since?: string;
    window_hours?: number;
    radius_km?: number;
    location_mode?: string;
  };
};

function parseSinceHours(since: string | undefined): number | null {
  if (!since?.trim()) {
    return null;
  }
  const match = /^(\d+(?:\.\d+)?)h$/i.exec(since.trim());
  if (!match) {
    return null;
  }
  const hours = Number(match[1]);
  return Number.isFinite(hours) && hours > 0 ? Math.round(hours) : null;
}

function hoursPhrase(hours: number): string {
  return hours === 1 ? "the last hour" : `the last ${hours} hours`;
}

function radiusPhrase(km: number): string {
  return km === 1 ? "within 1 km" : `within ${km} km`;
}

export function feedScopeFromApi(meta: OrderFeedMeta): FeedScope | null {
  const feed = meta.feed;
  const hours =
    typeof feed?.window_hours === "number" && feed.window_hours > 0
      ? Math.round(feed.window_hours)
      : parseSinceHours(
          typeof feed?.since === "string" ? feed.since : meta.since
        );
  if (hours == null) {
    return null;
  }
  const radiusKm =
    typeof feed?.radius_km === "number" && feed.radius_km > 0
      ? feed.radius_km
      : typeof meta.neighbourhood?.radius_km === "number"
        ? (meta.neighbourhood.radius_km as number)
        : 0;
  const modeRaw =
    (typeof feed?.location_mode === "string" && feed.location_mode) ||
    (typeof meta.neighbourhood?.mode === "string" && meta.neighbourhood.mode) ||
    "own_only";
  const locationMode =
    modeRaw === "near" || modeRaw === "locality" ? modeRaw : "own_only";

  return {
    windowHours: hours,
    radiusKm,
    locationMode
  };
}

export function donorFeedLede(scope: FeedScope | null): string | undefined {
  if (!scope) {
    return undefined;
  }
  const time = hoursPhrase(scope.windowHours);
  if (scope.locationMode === "near" && scope.radiusKm > 0) {
    return `Neighbourhood feed in ${time}, ${radiusPhrase(scope.radiusKm)}.`;
  }
  if (scope.locationMode === "locality") {
    return `Neighbourhood feed in ${time} (same area grid).`;
  }
  return `Your initiations in ${time}.`;
}

export function donorFeedWindowPhrase(scope: FeedScope | null): string {
  return scope ? hoursPhrase(scope.windowHours) : "the configured time window";
}
