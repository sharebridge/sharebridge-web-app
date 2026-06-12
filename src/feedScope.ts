/** Parsed from integration-service list response (`feed` or `since` + `neighbourhood`). */
export type FeedScope = {
  windowHours: number;
  radiusM: number;
  locationMode: "near" | "locality" | "own_only" | "all";
};

/** Human-readable dashboard capture boundaries shown in the header banner. */
export type DashboardBoundaries = {
  timeLabel: string;
  areaLabel: string;
  sortLabel: string;
  maxRowsLabel: string;
};

export type OrderFeedMeta = {
  since?: string;
  neighbourhood?: Record<string, unknown>;
  feed?: {
    since?: string | null;
    window_hours?: number | null;
    radius_m?: number | null;
    location_mode?: string;
    locality_key?: string | null;
    max_rows?: number;
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
    modeRaw === "near" || modeRaw === "locality"
      ? modeRaw
      : modeRaw === "all"
        ? "all"
        : "own_only";

  return {
    windowHours: hours,
    radiusM: resolveRadiusM(meta),
    locationMode
  };
}

function parseFeedWindowHours(meta: OrderFeedMeta): number | null {
  const feed = meta.feed;
  if (typeof feed?.window_hours === "number" && feed.window_hours > 0) {
    return Math.round(feed.window_hours);
  }
  return parseSinceHours(
    typeof feed?.since === "string" && feed.since
      ? feed.since
      : meta.since
  );
}

function formatSinceLabel(since: string | undefined): string | null {
  const hours = parseSinceHours(since);
  if (hours == null) {
    return null;
  }
  return hoursPhrase(hours);
}

function areaLabelFromNeighbourhood(
  neighbourhood: Record<string, unknown> | undefined,
  feed: OrderFeedMeta["feed"]
): string | null {
  const mode =
    (typeof feed?.location_mode === "string" && feed.location_mode) ||
    (typeof neighbourhood?.mode === "string" && neighbourhood.mode) ||
    "";
  if (mode === "all") {
    return "All areas";
  }
  if (mode === "locality_key" || mode === "locality") {
    const key =
      (typeof feed?.locality_key === "string" && feed.locality_key) ||
      (typeof neighbourhood?.locality_key === "string" &&
        neighbourhood.locality_key) ||
      "";
    return key
      ? `Postal area ${key} (includes sub-areas)`
      : "Postal area filter";
  }
  if (mode === "near") {
    const radiusM =
      typeof feed?.radius_m === "number" && feed.radius_m > 0
        ? Math.round(feed.radius_m)
        : typeof neighbourhood?.radius_m === "number"
          ? Math.round(neighbourhood.radius_m as number)
          : 0;
    const viewerKey =
      typeof neighbourhood?.viewer_locality_key === "string"
        ? neighbourhood.viewer_locality_key
        : "";
    const radius = radiusM > 0 ? radiusPhraseMetres(radiusM) : "near your position";
    return viewerKey
      ? `${radius} of your location (≈ ${viewerKey})`
      : `${radius} of your location`;
  }
  return null;
}

/** Boundaries banner for coordinator and initiator dashboards. */
export function dashboardBoundariesFromApi(
  meta: OrderFeedMeta,
  { coordinator }: { coordinator: boolean }
): DashboardBoundaries | null {
  const feed = meta.feed;
  const neighbourhood = meta.neighbourhood;
  const hours = parseFeedWindowHours(meta);
  const modeRaw =
    (typeof feed?.location_mode === "string" && feed.location_mode) || "";
  const scope =
    coordinator && !feed
      ? null
      : feedScopeFromApi(meta) ??
        (coordinator
          ? {
              windowHours: hours ?? 0,
              radiusM:
                typeof feed?.radius_m === "number" ? Math.round(feed.radius_m) : 0,
              locationMode:
                modeRaw === "near" || modeRaw === "locality" || modeRaw === "all"
                  ? modeRaw
                  : "all"
            }
          : null);

  if (!coordinator && !scope) {
    if (feed?.location_mode === "all") {
      const maxRows =
        typeof feed.max_rows === "number" && feed.max_rows > 0
          ? Math.round(feed.max_rows)
          : 100;
      return {
        timeLabel: "All time",
        areaLabel: "All areas",
        sortLabel: "Sorted by most recently updated",
        maxRowsLabel: `Up to ${maxRows} rows`
      };
    }
    return null;
  }

  let timeLabel: string;
  if (coordinator) {
    const fromSince = formatSinceLabel(
      typeof feed?.since === "string" ? feed.since : meta.since
    );
    timeLabel = fromSince ?? "All time";
  } else if (scope) {
    timeLabel = hoursPhrase(scope.windowHours);
  } else {
    return null;
  }

  let areaLabel =
    areaLabelFromNeighbourhood(neighbourhood, feed) ??
    (coordinator ? "All areas" : null);
  if (!areaLabel && scope) {
    if (scope.locationMode === "near" && scope.radiusM > 0) {
      areaLabel = `${radiusPhraseMetres(scope.radiusM)} of your location`;
    } else if (scope.locationMode === "locality") {
      areaLabel = "Same postal area grid";
    } else {
      areaLabel =
        "Your initiations only (tap By area + allow location for neighbourhood)";
    }
  }
  if (!areaLabel) {
    return null;
  }

  const maxRows =
    typeof feed?.max_rows === "number" && feed.max_rows > 0
      ? Math.round(feed.max_rows)
      : 100;
  const sortLabel =
    scope?.locationMode === "near" ||
    modeRaw === "near" ||
    (typeof neighbourhood?.mode === "string" && neighbourhood.mode === "near")
      ? "Sorted nearest first when handover GPS is present"
      : coordinator
        ? "Sorted by most recently updated"
        : "Sorted by distance when location is shared";

  return {
    timeLabel,
    areaLabel,
    sortLabel,
    maxRowsLabel: `Up to ${maxRows} rows`
  };
}

export function donorFeedLede(scope: FeedScope | null): string | undefined {
  const boundaries = scope
    ? dashboardBoundariesFromApi(
        {
          since: `${scope.windowHours}h`,
          feed: {
            since: `${scope.windowHours}h`,
            window_hours: scope.windowHours,
            radius_m: scope.radiusM,
            location_mode: scope.locationMode
          }
        },
        { coordinator: false }
      )
    : null;
  if (!boundaries) {
    return undefined;
  }
  return `Showing data captured in ${boundaries.timeLabel} · ${boundaries.areaLabel}.`;
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
  return `${reasonText} Other initiators nearby are hidden until location is available — only your initiations from ${time} are listed below. Allow location for this site and click Refresh for the full neighbourhood feed.`;
}

/** Empty list — separate from location errors. */
export function donorEmptyListMessage(
  scope: FeedScope | null,
  viewerLocationShared: boolean
): string {
  const time = donorFeedWindowPhrase(scope);
  if (viewerLocationShared && scope?.radiusM) {
    const radius = radiusPhraseMetres(scope.radiusM);
    return `No order initiations from anyone ${time} ${radius}.`;
  }
  if (viewerLocationShared) {
    return `No order initiations from anyone ${time} near you.`;
  }
  return `No initiations you registered ${time}. Tap By area and allow location to see neighbourhood orders from other initiators.`;
}

/** Shown when neighbourhood rows lack handover GPS (distance unknown). */
export function donorNoHandoverLocationNotice(): string {
  return "Orders without handover GPS from the mobile app appear here without distance; they are not filtered by the neighbourhood radius. Enable location on Help a seeker so new orders sort by distance.";
}
