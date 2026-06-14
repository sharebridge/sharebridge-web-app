/**
 * Payment / fulfilment routes (mobile will expose all three; web Phase 1 uses two).
 *
 * - Direct order — initiator pays at a chosen vendor.
 * - For pledging — others fund the need.
 * - Community kitchens — open vendors commit to a standard menu (nutrition,
 *   hygiene, economical) for crowd-scale preparation; not auction/bidding UX.
 */
export const INITIATION_ROUTE_LABELS = {
  directOrder: "Direct order",
  forPledging: "For pledging",
  communityKitchens: "Community kitchens"
} as const;

export type InitiationRouteKey = keyof typeof INITIATION_ROUTE_LABELS;

export type InitiationFeedKind = "vendor_order" | "meal_need";

/** Future API kind: `community_kitchen` → communityKitchens label. */
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
