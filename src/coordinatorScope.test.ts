import { describe, expect, it } from "vitest";
import {
  coordinatorScopeCollapsedSummary,
  coordinatorScopedEmptyListMessage,
  DEFAULT_COORDINATOR_SCOPE,
  normalizeLocalityKey
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

  it("normalizeLocalityKey uppercases on apply", () => {
    expect(normalizeLocalityKey("IN:TN:600001")).toBe("IN:TN:600001");
    expect(normalizeLocalityKey(" in : tn : 600001 ")).toBe("IN:TN:600001");
  });

  it("coordinatorScopedEmptyListMessage reflects postal filter", () => {
    expect(
      coordinatorScopedEmptyListMessage({
        since: "24h",
        areaMode: "locality",
        localityKey: "IN:TN:600115"
      })
    ).toContain("IN:TN:600115");
  });
});
