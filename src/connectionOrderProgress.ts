import type { SeekerDemandRow } from "./api/demandBoard";

/** Connection updates stay visible only while the eco-kitchen order is still open. */
export function isConnectionOrderInProgress(
  demand: SeekerDemandRow | undefined
): boolean {
  if (!demand) {
    return true;
  }
  const status = String(demand.status ?? "").trim().toLowerCase();
  if (status === "fulfilled" || status === "cancelled") {
    return false;
  }
  if (demand.delivered_at?.trim()) {
    return false;
  }
  return true;
}
