import { describe, expect, it } from "vitest";
import {
  formatDistanceM,
  formatInitiatorMeta,
  formatElapsedSince,
  primaryRestaurant,
  statusLabel
} from "./format";
import type { OrderInitiation } from "./types";

describe("format helpers", () => {
  it("formats status for display", () => {
    expect(statusLabel("instructions_copied")).toBe("instructions copied");
  });

  it("handles missing status without replaceAll", () => {
    expect(statusLabel(undefined)).toBe("unknown");
  });

  it("formats initiator meta with email and id", () => {
    expect(formatInitiatorMeta("alice", "alice@example.com")).toBe(
      "alice@example.com · alice"
    );
    expect(formatInitiatorMeta("alice", null)).toBe("Initiator alice");
  });

  it("formats distance in metres", () => {
    expect(formatDistanceM(1250)).toBe("1250 m");
    expect(formatDistanceM(null)).toBe("—");
  });

  it("formats elapsed since intent created", () => {
    const hourAgo = new Date(Date.now() - 3_600_000).toISOString();
    expect(formatElapsedSince(hourAgo)).toBe("1h ago");
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
