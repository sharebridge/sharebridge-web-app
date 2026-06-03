import type { AuthSession } from "./authSession";

export function isCoordinatorSession(session: AuthSession): boolean {
  return session.role === "coordinator";
}

/** Header label: coordinators see email; limited dashboard shows user id only. */
export function sessionHeaderLabel(session: AuthSession): string {
  if (isCoordinatorSession(session)) {
    const email = session.email?.trim();
    if (email) {
      return email;
    }
    const name = session.name?.trim();
    if (name) {
      return name;
    }
  }
  return session.userId;
}
