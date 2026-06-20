import { describe, expect, it } from "vitest";
import {
  orderContactsArrivalSignature,
  orderContactsCollapsedSummary,
  summarizeOrderContactsFromSnapshot
} from "./orderContactBoardSummary";
import type { DemandBoardSnapshot } from "./api/demandBoard";

function snapshot(
  overrides: Partial<DemandBoardSnapshot> = {}
): DemandBoardSnapshot {
  return {
    status: "ok",
    message: "",
    standard_offers: [],
    demand_windows: [],
    seeker_demands: [],
    pledges: [],
    vendor_bids: [],
    generated_at: new Date().toISOString(),
    ...overrides
  };
}

describe("summarizeOrderContactsFromSnapshot", () => {
  it("counts ready and waiting orders from the board", () => {
    const board = summarizeOrderContactsFromSnapshot(
      snapshot({
        seeker_demands: [
          {
            seeker_demand_id: "d1",
            order_code: "SB-READY-1",
            status: "recorded",
            meal_units: 1,
            need_description: "a",
            created_at: "2026-06-01T10:00:00Z",
            updated_at: "2026-06-01T10:00:00Z"
          },
          {
            seeker_demand_id: "d2",
            order_code: "SB-WAIT-1",
            status: "recorded",
            meal_units: 1,
            need_description: "b",
            created_at: "2026-06-01T10:00:00Z",
            updated_at: "2026-06-01T10:00:00Z"
          }
        ],
        vendor_bids: [
          {
            vendor_bid_id: "b1",
            locality_key: "IN:TN:600115",
            vendor_name: "Kitchen",
            portions: 1,
            status: "active",
            commitment_status: "committed",
            order_code: "SB-READY-1",
            created_at: "2026-06-01T12:00:00Z"
          }
        ]
      })
    );

    expect(board.readyCodes).toEqual(["SB-READY-1"]);
    expect(board.waitingCodes).toEqual(["SB-WAIT-1"]);
  });

  it("ignores fulfilled seeker demands", () => {
    const board = summarizeOrderContactsFromSnapshot(
      snapshot({
        seeker_demands: [
          {
            seeker_demand_id: "d1",
            order_code: "SB-DONE-1",
            status: "fulfilled",
            meal_units: 1,
            need_description: "a",
            created_at: "2026-06-01T10:00:00Z",
            updated_at: "2026-06-02T12:00:00Z"
          }
        ],
        vendor_bids: [
          {
            vendor_bid_id: "b1",
            locality_key: "IN:TN:600115",
            vendor_name: "Kitchen",
            portions: 1,
            status: "active",
            commitment_status: "committed",
            order_code: "SB-DONE-1",
            created_at: "2026-06-01T12:00:00Z"
          }
        ]
      })
    );

    expect(board.readyCodes).toEqual([]);
    expect(board.waitingCodes).toEqual([]);
  });
});

describe("orderContactsCollapsedSummary", () => {
  it("shows both ready and waiting counts when mixed", () => {
    const text = orderContactsCollapsedSummary(
      {
        readyCodes: ["SB-A", "SB-B"],
        waitingCodes: ["SB-C"]
      },
      false
    );
    expect(text).toContain("2 contacts ready");
    expect(text).toContain("SB-A, SB-B");
    expect(text).toContain("Waiting for kitchen · SB-C");
  });

  it("does not depend on the last opened order", () => {
    const text = orderContactsCollapsedSummary(
      {
        readyCodes: ["SB-READY-1", "SB-READY-2"],
        waitingCodes: []
      },
      false
    );
    expect(text).toBe("2 contacts ready · SB-READY-1, SB-READY-2");
  });
});

describe("orderContactsArrivalSignature", () => {
  it("includes all tracked order codes", () => {
    expect(
      orderContactsArrivalSignature({
        readyCodes: ["SB-A"],
        waitingCodes: ["SB-B"]
      })
    ).toBe("SB-A|SB-B");
  });
});
