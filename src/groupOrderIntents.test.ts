import { describe, expect, it } from "vitest";
import { groupOrderIntents } from "./groupOrderIntents";
import type { OrderInitiation } from "./types";

function intent(
  partial: Partial<OrderInitiation> & Pick<OrderInitiation, "order_intent_id">
): OrderInitiation {
  return {
    pack_id: "p1",
    status: "instructions_copied",
    has_reference_photo: false,
    verbal_handover_notes: "",
    presets_snapshot: [],
    selected_preset: null,
    created_at: "2026-06-01T10:00:00.000Z",
    updated_at: "2026-06-01T10:00:00.000Z",
    ...partial
  };
}

describe("groupOrderIntents", () => {
  const rows = [
    intent({
      order_intent_id: "a",
      user_id: "alice",
      created_at: "2026-06-02T12:00:00.000Z",
      updated_at: "2026-06-02T12:00:00.000Z"
    }),
    intent({
      order_intent_id: "b",
      user_id: "bob",
      created_at: "2026-06-01T09:00:00.000Z",
      updated_at: "2026-06-01T09:00:00.000Z"
    }),
    intent({
      order_intent_id: "c",
      user_id: "alice",
      created_at: "2026-06-01T15:00:00.000Z",
      updated_at: "2026-06-01T15:00:00.000Z"
    })
  ];

  it("groups by donor", () => {
    const groups = groupOrderIntents(rows, "donor");
    expect(groups).toHaveLength(2);
    expect(groups.find((g) => g.key === "alice")?.intents).toHaveLength(2);
    expect(groups.find((g) => g.key === "bob")?.intents).toHaveLength(1);
  });

  it("groups by day", () => {
    const groups = groupOrderIntents(rows, "day");
    expect(groups.length).toBeGreaterThanOrEqual(2);
    const total = groups.reduce((n, g) => n + g.intents.length, 0);
    expect(total).toBe(3);
  });

  it("city mode returns a single placeholder bucket", () => {
    const groups = groupOrderIntents(rows, "city");
    expect(groups).toHaveLength(1);
    expect(groups[0].label).toMatch(/coming soon/i);
    expect(groups[0].intents).toHaveLength(3);
  });
});
