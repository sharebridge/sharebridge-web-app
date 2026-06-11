import { describe, expect, it } from "vitest";
import { ApiError } from "../api/orderIntents";
import type { AppConfig } from "../config";
import { formatSignInError } from "./signInErrors";

const baseConfig: AppConfig = {
  apiBaseUrl: "http://localhost:8080",
  userServiceBaseUrl: "https://sharingbridge-user-service.onrender.com",
  googleClientId: "x",
  googleMapsApiKey: ""
};

describe("formatSignInError", () => {
  it("passes through user-service message", () => {
    const err = new ApiError(
      "This account cannot use the mobile app.",
      403,
      "wrong_client_role",
      "no_initiator_role"
    );
    expect(formatSignInError(err, baseConfig)).toBe(
      "This account cannot use the mobile app."
    );
  });

  it("falls back when message empty", () => {
    const err = new ApiError("", 403, "wrong_client_role");
    expect(formatSignInError(err, baseConfig)).toBe("Could not sign in.");
  });

  it("adds CORS hint on network failure", () => {
    const err = new ApiError("Failed to fetch", 0);
    const text = formatSignInError(err, baseConfig);
    expect(text).toMatch(/WEB_CORS_ORIGINS/);
    expect(text).toMatch(/onrender\.com/);
  });
});
