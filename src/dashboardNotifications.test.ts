import { describe, expect, it } from "vitest";
import {
  buildDashboardNotifications,
  dashboardNotificationSummary
} from "./dashboardNotifications";
import type { DemandBoardSnapshot } from "./api/demandBoard";

function baseSnapshot(
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

describe("buildDashboardNotifications", () => {
  it("returns connection-ready rows for initiator and pledgers", () => {
    const snapshot = baseSnapshot({
      seeker_demands: [
        {
          seeker_demand_id: "d1",
          order_code: "SB-TEST-1",
          reported_by_user_id: "alice",
          status: "open",
          meal_units: 2,
          standard_offer_id: "offer-1",
          menu_label: "Meals",
          need_description: "need",
          locality_key: "IN:TN:600115",
          created_at: "2026-06-01T10:00:00Z",
          updated_at: "2026-06-01T10:00:00Z"
        }
      ],
      pledges: [
        {
          pledge_id: "p1",
          pledged_by_user_id: "bob",
          locality_key: "IN:TN:600115",
          standard_offer_id: "offer-1",
          meal_units: 1,
          status: "active",
          created_at: "2026-06-01T11:00:00Z"
        }
      ],
      vendor_bids: [
        {
          vendor_bid_id: "b1",
          submitted_by_user_id: "kitchen-1",
          locality_key: "IN:TN:600115",
          standard_offer_id: "offer-1",
          vendor_name: "Eco Kitchen A",
          portions: 2,
          status: "active",
          commitment_status: "committed",
          order_code: "SB-TEST-1",
          seeker_demand_id: "d1",
          created_at: "2026-06-01T12:00:00Z"
        }
      ]
    });

    const alice = buildDashboardNotifications(snapshot, "alice", {
      coordinator: false
    });
    expect(alice).toHaveLength(1);
    expect(alice[0]?.viewerRole).toBe("initiator");

    const bob = buildDashboardNotifications(snapshot, "bob", {
      coordinator: false
    });
    expect(bob).toHaveLength(1);
    expect(bob[0]?.viewerRole).toBe("pledger");

    const kitchen = buildDashboardNotifications(snapshot, "kitchen-1", {
      coordinator: false
    });
    expect(kitchen[0]?.viewerRole).toBe("kitchen");
  });

  it("shows all committed orders for coordinators", () => {
    const snapshot = baseSnapshot({
      seeker_demands: [
        {
          seeker_demand_id: "d1",
          order_code: "SB-A",
          reported_by_user_id: "alice",
          status: "open",
          meal_units: 1,
          standard_offer_id: "o1",
          need_description: "x",
          locality_key: "IN:TN:600115",
          created_at: "2026-06-01T10:00:00Z",
          updated_at: "2026-06-01T10:00:00Z"
        }
      ],
      vendor_bids: [
        {
          vendor_bid_id: "b1",
          submitted_by_user_id: "k1",
          locality_key: "IN:TN:600115",
          standard_offer_id: "o1",
          vendor_name: "Kitchen",
          portions: 1,
          status: "active",
          commitment_status: "committed",
          order_code: "SB-A",
          seeker_demand_id: "d1",
          created_at: "2026-06-01T12:00:00Z"
        }
      ]
    });

    const rows = buildDashboardNotifications(snapshot, "coord-1", {
      coordinator: true
    });
    expect(rows).toHaveLength(1);
    expect(rows[0]?.viewerRole).toBe("coordinator");
  });

  it("ignores uncommitted kitchen bids", () => {
    const snapshot = baseSnapshot({
      vendor_bids: [
        {
          vendor_bid_id: "b1",
          submitted_by_user_id: "k1",
          locality_key: "IN:TN:600115",
          standard_offer_id: "o1",
          vendor_name: "Kitchen",
          portions: 1,
          status: "active",
          order_code: "SB-A",
          created_at: "2026-06-01T12:00:00Z"
        }
      ]
    });

    expect(
      buildDashboardNotifications(snapshot, "k1", { coordinator: false })
    ).toEqual([]);
  });
});

describe("dashboardNotificationSummary", () => {
  it("mentions order code", () => {
    const text = dashboardNotificationSummary({
      id: "connection-SB-1",
      orderCode: "SB-1",
      menuLabel: "Lunch",
      viewerRole: "initiator",
      committedAt: "2026-06-01T12:00:00Z"
    });
    expect(text).toContain("SB-1");
    expect(text).toContain("Lunch");
  });
});
