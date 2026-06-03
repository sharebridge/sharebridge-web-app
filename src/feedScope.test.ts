import { describe, expect, it } from "vitest";
import { donorFeedLede, feedScopeFromApi } from "./feedScope";

describe("feedScopeFromApi", () => {
  it("parses feed object from API", () => {
    const scope = feedScopeFromApi({
      since: "2h",
      feed: {
        since: "2h",
        window_hours: 2,
        radius_km: 5,
        location_mode: "near"
      },
      neighbourhood: { mode: "near", radius_km: 5 }
    });
    expect(scope).toEqual({
      windowHours: 2,
      radiusKm: 5,
      locationMode: "near"
    });
    expect(donorFeedLede(scope)).toBe(
      "Neighbourhood feed in the last 2 hours, within 5 km."
    );
  });

  it("handles own_only mode without radius in lede", () => {
    const scope = feedScopeFromApi({
      since: "2h",
      feed: {
        window_hours: 2,
        radius_km: 5,
        location_mode: "own_only"
      }
    });
    expect(donorFeedLede(scope)).toBe("Your initiations in the last 2 hours.");
  });
});
