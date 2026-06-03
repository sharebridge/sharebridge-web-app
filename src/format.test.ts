import { describe, expect, it } from "vitest";
import { formatDonorMeta, primaryRestaurant, statusLabel } from "./format";
import type { OrderInitiation } from "./types";

describe("format helpers", () => {
  it("formats status for display", () => {
    expect(statusLabel("instructions_copied")).toBe("instructions copied");
  });

  it("formats donor meta with email and id", () => {
    expect(formatDonorMeta("alice", "alice@example.com")).toBe(
      "alice@example.com · alice"
    );
    expect(formatDonorMeta("alice", null)).toBe("Donor alice");
  });

  it("picks restaurant from snapshot", () => {
    const intent: OrderInitiation = {
      order_intent_id: "oi-1",
      pack_id: "p1",
      status: "instructions_copied",
      has_reference_photo: false,
      verbal_handover_notes: "",
      presets_snapshot: [{ restaurant_name: "A2B" }],
      selected_preset: null,
      created_at: "",
      updated_at: ""
    };
    expect(primaryRestaurant(intent)).toBe("A2B");
  });
});
