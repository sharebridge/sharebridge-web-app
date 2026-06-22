import { describe, expect, it } from "vitest";
import {
  coordinatorScopeCollapsedSummary,
  DEFAULT_COORDINATOR_SCOPE
} from "./coordinatorScope";

describe("coordinatorScopeCollapsedSummary", () => {
  it("describes default all-time all-areas scope", () => {
    expect(coordinatorScopeCollapsedSummary(DEFAULT_COORDINATOR_SCOPE)).toBe(
      "All time · All areas"
    );
  });

  it("reflects applied time and area presets", () => {
    expect(
      coordinatorScopeCollapsedSummary({
        since: "24h",
        areaMode: "near",
        localityKey: ""
      })
    ).toBe("Last 24 hours · Near my location");
  });

  it("includes postal key when locality mode is applied", () => {
    expect(
      coordinatorScopeCollapsedSummary({
        since: "7d",
        areaMode: "locality",
        localityKey: "in:tn:600001"
      })
    ).toBe("Last 7 days · Postal area IN:TN:600001");
  });
});
