import { describe, expect, it } from "vitest";
import {
  dashboardBoundariesFromApi,
  initiatorEmptyListMessage,
  initiatorFeedLede,
  initiatorLocationUnavailableNotice,
  feedScopeFromApi
} from "./feedScope";

describe("feedScopeFromApi", () => {
  it("parses feed object from API (radius_m)", () => {
    const scope = feedScopeFromApi({
      since: "2h",
      feed: {
        since: "2h",
        window_hours: 2,
        radius_m: 5000,
        location_mode: "near"
      },
      neighbourhood: { mode: "near", radius_m: 5000 }
    });
    expect(scope).toEqual({
      windowHours: 2,
      radiusM: 5000,
      locationMode: "near"
    });
    expect(initiatorFeedLede(scope)).toBe(
      "Showing data captured in the last 2 hours · within 5 km of your location."
    );
  });

  it("handles own_only mode without radius in lede", () => {
    const scope = feedScopeFromApi({
      since: "2h",
      feed: {
        window_hours: 2,
        radius_m: 5000,
        location_mode: "own_only"
      }
    });
    expect(initiatorFeedLede(scope)).toBe(
      "Showing data captured in the last 2 hours · Your initiations only — use By area for nearby orders from others."
    );
  });

  it("location notice explains permission not empty neighbourhood", () => {
    const scope = feedScopeFromApi({
      since: "2h",
      feed: { window_hours: 2, radius_m: 5000, location_mode: "own_only" }
    });
    expect(initiatorLocationUnavailableNotice(scope, "denied")).toContain(
      "permission"
    );
    expect(initiatorLocationUnavailableNotice(scope, "denied")).toContain(
      "only your initiations"
    );
  });

  it("coordinator boundaries describe all-time and scoped filters", () => {
    const all = dashboardBoundariesFromApi(
      {
        feed: {
          since: null,
          window_hours: null,
          location_mode: "all",
          max_rows: 100
        }
      },
      { coordinator: true }
    );
    expect(all?.timeLabel).toBe("All time");
    expect(all?.areaLabel).toBe("All areas");

    const scoped = dashboardBoundariesFromApi(
      {
        since: "24h",
        feed: {
          since: "24h",
          window_hours: 24,
          location_mode: "locality",
          locality_key: "IN:TN:600001",
          max_rows: 50
        },
        neighbourhood: {
          mode: "locality_key",
          locality_key: "IN:TN:600001"
        }
      },
      { coordinator: true }
    );
    expect(scoped?.timeLabel).toBe("the last 24 hours");
    expect(scoped?.areaLabel).toContain("IN:TN:600001");
    expect(scoped?.maxRowsLabel).toBe("Up to 50 rows");
  });

  it("empty list message distinguishes neighbourhood vs own-only", () => {
    const scope = feedScopeFromApi({
      since: "2h",
      feed: { window_hours: 2, radius_m: 5000, location_mode: "near" }
    });
    expect(initiatorEmptyListMessage(scope, true)).toContain("anyone");
    expect(initiatorEmptyListMessage(scope, false)).not.toContain("By area");
  });
});
