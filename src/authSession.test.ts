import { describe, expect, it } from "vitest";
import { isSessionExpired, sessionFromToken } from "./authSession";

describe("authSession", () => {
  it("marks session expired near exp", () => {
    const session = {
      userId: "u1",
      token: "t",
      expiresAt: Date.now() + 10_000
    };
    expect(isSessionExpired(session)).toBe(false);
    session.expiresAt = Date.now() - 1;
    expect(isSessionExpired(session)).toBe(true);
  });

  it("sessionFromToken falls back to one hour when jwt unparsable", () => {
    const session = sessionFromToken("demo", "not-a-jwt");
    expect(session.userId).toBe("demo");
    expect(session.expiresAt).toBeGreaterThan(Date.now());
  });
});
