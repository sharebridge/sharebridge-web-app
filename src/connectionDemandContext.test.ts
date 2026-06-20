import { describe, expect, it } from "vitest";
import {
  connectionInitiationSummary,
  formatDemandStatus,
  orderContactChipLabel
} from "./connectionDemandContext";
import type { DemandBoardSnapshot } from "./api/demandBoard";
import type { OrderConnection } from "./api/connections";

function connection(overrides: Partial<OrderConnection> = {}): OrderConnection {
  return {
    order_code: "SB-TEST-001",
    status: "ready",
    initiation_route: "eco_kitchen_pledge",
    viewer_role: "coordinator",
    safety_copy: "",
    menu_label: "Standard lunch",
    meal_units: 2,
    price_inr: 120,
    locality_key: "IN:TN:600115",
    seeker_demand_id: "sd-1",
    demand: {
      seeker_demand_id: "sd-1",
      status: "recorded",
      need_description: "Lunch for two",
      verbal_notes: "Vegetarian only",
      location_label: "Near main gate",
      standard_offer_id: "so-lunch",
      recorded_at: "2026-06-01T10:00:00.000Z"
    },
    ...overrides
  };
}

describe("connectionDemandContext", () => {
  it("formats chip label with menu from board snapshot", () => {
    const snapshot: DemandBoardSnapshot = {
      status: "ok",
      message: "",
      standard_offers: [],
      demand_windows: [],
      seeker_demands: [
        {
          seeker_demand_id: "sd-1",
          order_code: "SB-CHIP-1",
          status: "recorded",
          meal_units: 1,
          need_description: "Dinner tray",
          menu_label: "Dinner tray",
          created_at: "2026-06-01T10:00:00Z",
          updated_at: "2026-06-01T10:00:00Z"
        }
      ],
      pledges: [],
      vendor_bids: [],
      generated_at: "2026-06-01T12:00:00Z"
    };
    expect(orderContactChipLabel("SB-CHIP-1", snapshot)).toBe(
      "SB-CHIP-1 · Dinner tray"
    );
  });

  it("summarizes initiation context for the detail panel", () => {
    const summary = connectionInitiationSummary(connection());
    expect(summary.routeLabel).toBe("Eco kitchen · open for pledging");
    expect(summary.headline).toContain("Standard lunch");
    expect(summary.statusLabel).toBe("Open");
    expect(summary.area).toContain("Near main gate");
    expect(summary.notes).toBe("Vegetarian only");
  });

  it("maps fulfilled status to Delivered", () => {
    expect(formatDemandStatus("fulfilled")).toBe("Delivered");
  });
});
