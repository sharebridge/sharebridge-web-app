/** @vitest-environment jsdom */

import { describe, expect, it } from "vitest";
import {
  clearLastGoogleEmailForGsiRevoke,
  isSessionExpired,
  readLastGoogleEmailForGsiRevoke,
  rememberLastGoogleEmailForGsiRevoke,
  sessionFromSignIn
} from "./authSession";

describe("authSession", () => {
  it("marks session expired near exp", () => {
    const session = {
      userId: "u1",
      role: "coordinator",
      token: "t",
      expiresAt: Date.now() + 10_000
    };
    expect(isSessionExpired(session)).toBe(false);
    session.expiresAt = Date.now() - 1;
    expect(isSessionExpired(session)).toBe(true);
  });

  it("sessionFromSignIn falls back to one hour when jwt unparsable", () => {
    const session = sessionFromSignIn({
      userId: "demo",
      token: "not-a-jwt",
      role: "coordinator"
    });
    expect(session.userId).toBe("demo");
    expect(session.role).toBe("coordinator");
    expect(session.expiresAt).toBeGreaterThan(Date.now());
  });

  it("persists last Google email for GSI revoke helpers", () => {
    localStorage.clear();
    rememberLastGoogleEmailForGsiRevoke("  a@b.co  ");
    expect(readLastGoogleEmailForGsiRevoke()).toBe("a@b.co");
    clearLastGoogleEmailForGsiRevoke();
    expect(readLastGoogleEmailForGsiRevoke()).toBeNull();
  });
});
