/**
 * Payment / fulfilment routes (mobile will expose all three; web Phase 1 uses two).
 *
 * - Direct order — initiator pays at a chosen vendor.
 * - For pledging — others fund the need.
 * - Eco kitchens — crowd-sourced kitchens commit to a standard menu (nutrition,
 *   hygiene, eco-friendly packaging, economical) for crowd-scale preparation.
 */
export const INITIATION_ROUTE_LABELS = {
  directOrder: "Direct order",
  forPledging: "For pledging",
  ecoKitchens: "Eco kitchens",
  ecoKitchenSelfPay: "Eco kitchen · I pay",
  ecoKitchenPledge: "Eco kitchen · open for pledging"
} as const;

export type InitiationRouteKey = keyof typeof INITIATION_ROUTE_LABELS;

export type InitiationFeedKind = "vendor_order" | "meal_need";

/** User-facing label from API `initiation_route` on seeker demands. */
export function initiationApiRouteLabel(
  route: string | null | undefined
): string {
  switch (route) {
    case "eco_kitchen_self_pay":
      return INITIATION_ROUTE_LABELS.ecoKitchenSelfPay;
    case "eco_kitchen_pledge":
      return INITIATION_ROUTE_LABELS.ecoKitchenPledge;
    default:
      return INITIATION_ROUTE_LABELS.ecoKitchenPledge;
  }
}

/** Future API route: `eco_kitchen_self_pay` | `eco_kitchen_pledge` → eco kitchen labels. */
export function initiationKindLabel(kind: InitiationFeedKind): string {
  switch (kind) {
    case "vendor_order":
      return INITIATION_ROUTE_LABELS.directOrder;
    case "meal_need":
      return INITIATION_ROUTE_LABELS.ecoKitchenPledge;
    default:
      return kind;
  }
}

