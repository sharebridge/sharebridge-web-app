import type { AuthSession } from "./authSession";
import { sessionDisplayLabel } from "./authSession";

export function isCoordinatorSession(session: AuthSession): boolean {
  return session.role === "coordinator";
}

/** Signed-in user in the site header (your Google email when available). */
export function sessionHeaderLabel(session: AuthSession): string {
  return sessionDisplayLabel(session);
}
