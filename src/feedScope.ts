/** Parsed from integration-service list response (`feed` or `since` + `neighbourhood`). */
export type FeedScope = {
  windowHours: number;
  radiusM: number;
  locationMode: "near" | "locality" | "own_only";
};

export type OrderFeedMeta = {
  since?: string;
  neighbourhood?: Record<string, unknown>;
  feed?: {
    since?: string;
    window_hours?: number;
    radius_m?: number;
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

function radiusPhraseMetres(m: number): string {
  if (m < 1000) {
    return m === 1 ? "within 1 m" : `within ${m} m`;
  }
  const km = m / 1000;
  return km === 1 ? "within 1 km" : `within ${km} km`;
}

function resolveRadiusM(meta: OrderFeedMeta): number {
  const feed = meta.feed;
  if (typeof feed?.radius_m === "number" && feed.radius_m > 0) {
    return Math.round(feed.radius_m);
  }
  if (typeof meta.neighbourhood?.radius_m === "number") {
    const n = meta.neighbourhood.radius_m as number;
    if (n > 0) {
      return Math.round(n);
    }
  }
  return 0;
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
  const modeRaw =
    (typeof feed?.location_mode === "string" && feed.location_mode) ||
    (typeof meta.neighbourhood?.mode === "string" && meta.neighbourhood.mode) ||
    "own_only";
  const locationMode =
    modeRaw === "near" || modeRaw === "locality" ? modeRaw : "own_only";

  return {
    windowHours: hours,
    radiusM: resolveRadiusM(meta),
    locationMode
  };
}

export function donorFeedLede(scope: FeedScope | null): string | undefined {
  if (!scope) {
    return undefined;
  }
  const time = hoursPhrase(scope.windowHours);
  if (scope.locationMode === "near" && scope.radiusM > 0) {
    return `Neighbourhood feed in ${time}, ${radiusPhraseMetres(scope.radiusM)}.`;
  }
  if (scope.locationMode === "locality") {
    return `Neighbourhood feed in ${time} (same area grid).`;
  }
  return `Your initiations in ${time}.`;
}

export function donorFeedWindowPhrase(scope: FeedScope | null): string {
  return scope ? hoursPhrase(scope.windowHours) : "the configured time window";
}

/** Why the neighbourhood feed could not be loaded (browser location, not missing orders). */
export function donorLocationUnavailableNotice(
  scope: FeedScope | null,
  reason: "unsupported" | "denied" | "timeout" | "error"
): string {
  const time = donorFeedWindowPhrase(scope);
  const reasonText =
    reason === "denied"
      ? "This page does not have permission to use your location."
      : reason === "timeout"
        ? "Your location took too long to respond."
        : reason === "unsupported"
          ? "This browser cannot provide location."
          : "Your location could not be read.";
  return `${reasonText} Other donors nearby are hidden until location is available — only your initiations from ${time} are listed below. Allow location for this site and click Refresh for the full neighbourhood feed.`;
}

/** Empty list — separate from location errors. */
export function donorEmptyListMessage(
  scope: FeedScope | null,
  viewerLocationShared: boolean
): string {
  const time = donorFeedWindowPhrase(scope);
  if (viewerLocationShared && scope?.radiusM) {
    const radius = radiusPhraseMetres(scope.radiusM);
    return `No order initiations from any donor ${time} ${radius}.`;
  }
  if (viewerLocationShared) {
    return `No order initiations from any donor ${time} near you.`;
  }
  return `No initiations you registered ${time}. Tap By area and allow location to see neighbourhood orders from other donors.`;
}

/** Shown when neighbourhood rows lack handover GPS (distance unknown). */
export function donorNoHandoverLocationNotice(): string {
  return "Orders without handover GPS from the mobile app appear here without distance; they are not filtered by the 5 km radius. Enable location on Help a seeker so new orders sort by distance.";
}
