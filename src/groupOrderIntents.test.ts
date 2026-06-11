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

  it("groups by initiator", () => {
    const groups = groupOrderIntents(rows, "initiator");
    expect(groups).toHaveLength(2);
    expect(groups.find((g) => g.key === "alice")?.intents).toHaveLength(2);
    expect(groups.find((g) => g.key === "bob")?.intents).toHaveLength(1);
  });

  it("initiator group label is email-only with full line in title", () => {
    const withEmail = groupOrderIntents(
      [
        intent({
          order_intent_id: "x",
          user_id: "alice",
          donor_email: "alice@example.com"
        })
      ],
      "initiator"
    );
    expect(withEmail[0].label).toBe("alice@example.com");
    expect(withEmail[0].title).toBe("alice@example.com (alice)");
  });

  it("groups by day", () => {
    const groups = groupOrderIntents(rows, "day");
    expect(groups.length).toBeGreaterThanOrEqual(2);
    const total = groups.reduce((n, g) => n + g.intents.length, 0);
    expect(total).toBe(3);
  });

  it("locality mode buckets rows without locality_key", () => {
    const groups = groupOrderIntents(
      [
        intent({
          order_intent_id: "oi-1",
          pack_id: "p1",
          created_at: "2026-05-28T10:00:00Z"
        })
      ],
      "locality"
    );
    expect(groups).toHaveLength(1);
    expect(groups[0].label).toBe("No location on record");
  });

  it("locality mode groups by locality_key", () => {
    const located = [
      intent({
        order_intent_id: "a",
        locality_key: "12.97,80.22",
        location_label: "Adyar"
      }),
      intent({
        order_intent_id: "b",
        locality_key: "12.97,80.22",
        location_label: "Adyar"
      }),
      intent({
        order_intent_id: "c",
        locality_key: "13.00,80.30",
        location_label: "Other"
      })
    ];
    const groups = groupOrderIntents(located, "locality");
    expect(groups).toHaveLength(2);
    expect(groups.find((g) => g.label === "Adyar")?.intents).toHaveLength(2);
  });
});
