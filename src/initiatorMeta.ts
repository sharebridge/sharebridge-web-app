import type { OrderInitiation } from "./types";

/** Email of the user who registered this intent (coordinator view). */
export function initiatorEmail(
  intent: Pick<OrderInitiation, "initiator_email" | "donor_email">
): string | null {
  const email =
    intent.initiator_email?.trim() || intent.donor_email?.trim() || "";
  return email || null;
}
