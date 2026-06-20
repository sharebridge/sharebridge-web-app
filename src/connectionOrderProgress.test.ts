import { describe, expect, it } from "vitest";
import { isConnectionOrderInProgress } from "./connectionOrderProgress";
import type { SeekerDemandRow } from "./api/demandBoard";

function demand(
  overrides: Partial<SeekerDemandRow> = {}
): SeekerDemandRow {
  return {
    seeker_demand_id: "d1",
    status: "recorded",
    meal_units: 1,
    need_description: "Meal",
    created_at: "2026-06-01T10:00:00Z",
    updated_at: "2026-06-01T10:00:00Z",
    ...overrides
  };
}

describe("isConnectionOrderInProgress", () => {
  it("treats open recorded demand as in progress", () => {
    expect(isConnectionOrderInProgress(demand({ status: "recorded" }))).toBe(
      true
    );
  });

  it("hides fulfilled and cancelled demands", () => {
    expect(isConnectionOrderInProgress(demand({ status: "fulfilled" }))).toBe(
      false
    );
    expect(isConnectionOrderInProgress(demand({ status: "cancelled" }))).toBe(
      false
    );
  });

  it("hides when delivered_at is set", () => {
    expect(
      isConnectionOrderInProgress(
        demand({ status: "recorded", delivered_at: "2026-06-02T12:00:00Z" })
      )
    ).toBe(false);
  });
});
