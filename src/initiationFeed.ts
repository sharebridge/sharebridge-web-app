import type { SeekerDemandRow } from "./api/demandBoard";
import type { OrderInitiation } from "./types";

export type InitiationFeedItem =
  | {
      kind: "vendor_order";
      id: string;
      createdAt: string;
      intent: OrderInitiation;
    }
  | {
      kind: "meal_need";
      id: string;
      createdAt: string;
      demand: SeekerDemandRow;
    };

export function initiationSelectionId(item: InitiationFeedItem): string {
  return `${item.kind}:${item.id}`;
}

export function mergeInitiationFeed(
  intents: OrderInitiation[],
  demands: SeekerDemandRow[]
): InitiationFeedItem[] {
  const items: InitiationFeedItem[] = [
    ...intents.map((intent) => ({
      kind: "vendor_order" as const,
      id: intent.order_intent_id,
      createdAt: intent.created_at,
      intent
    })),
    ...demands.map((demand) => ({
      kind: "meal_need" as const,
      id: demand.seeker_demand_id,
      createdAt: demand.created_at,
      demand
    }))
  ];
  return items.sort(
    (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)
  );
}
