import { describe, expect, it } from "vitest";
import { mapEmptyMessage } from "./mapEmptyMessage";
import type { OrderInitiation } from "./types";

function intent(
  partial: Partial<OrderInitiation> & Pick<OrderInitiation, "order_intent_id">
): OrderInitiation {
  return {
    pack_id: "pack-1",
    status: "instructions_copied",
    has_reference_photo: false,
    verbal_handover_notes: "",
    presets_snapshot: [],
    selected_preset: null,
    created_at: "2026-06-10T00:00:00.000Z",
    updated_at: "2026-06-10T00:00:00.000Z",
    ...partial
  };
}

describe("mapEmptyMessage", () => {
  it("prompts coordinator when rows lack GPS", () => {
    const message = mapEmptyMessage(
      [intent({ order_intent_id: "oi-1", user_id: "alice" })],
      true,
      "coord"
    );
    expect(message).toMatch(/GPS coordinates/);
  });

  it("explains privacy when donor sees neighbours only", () => {
    const message = mapEmptyMessage(
      [
        intent({
          order_intent_id: "oi-bob",
          user_id: "bob",
          distance_m: 74
        })
      ],
      false,
      "alice"
    );
    expect(message).toMatch(/your own initiations only/);
    expect(message).toMatch(/distance \(m\)/);
  });

  it("prompts donor when own rows lack GPS", () => {
    const message = mapEmptyMessage(
      [intent({ order_intent_id: "oi-alice", user_id: "alice" })],
      false,
      "alice"
    );
    expect(message).toMatch(/None of your initiations include GPS/);
  });
});
