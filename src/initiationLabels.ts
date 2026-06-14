/** Payment / fulfilment routes (mobile will expose all three; web Phase 1 uses two). */
export const INITIATION_ROUTE_LABELS = {
  directOrder: "Direct order",
  forPledging: "For pledging",
  forVendorBidding: "For vendor bidding"
} as const;

export type InitiationFeedKind = "vendor_order" | "meal_need";

export function initiationKindLabel(kind: InitiationFeedKind): string {
  switch (kind) {
    case "vendor_order":
      return INITIATION_ROUTE_LABELS.directOrder;
    case "meal_need":
      return INITIATION_ROUTE_LABELS.forPledging;
    default:
      return kind;
  }
}
