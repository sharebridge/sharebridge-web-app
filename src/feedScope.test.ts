import { describe, expect, it } from "vitest";
import {
  donorEmptyListMessage,
  donorFeedLede,
  donorLocationUnavailableNotice,
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
    expect(donorFeedLede(scope)).toBe(
      "Neighbourhood feed in the last 2 hours, within 5 km."
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
    expect(donorFeedLede(scope)).toBe("Your initiations in the last 2 hours.");
  });

  it("location notice explains permission not empty neighbourhood", () => {
    const scope = feedScopeFromApi({
      since: "2h",
      feed: { window_hours: 2, radius_m: 5000, location_mode: "own_only" }
    });
    expect(donorLocationUnavailableNotice(scope, "denied")).toContain(
      "permission"
    );
    expect(donorLocationUnavailableNotice(scope, "denied")).toContain(
      "only your initiations"
    );
  });

  it("empty list message distinguishes neighbourhood vs own-only", () => {
    const scope = feedScopeFromApi({
      since: "2h",
      feed: { window_hours: 2, radius_m: 5000, location_mode: "near" }
    });
    expect(donorEmptyListMessage(scope, true)).toContain("any donor");
    expect(donorEmptyListMessage(scope, false)).toContain("By area");
  });
});
