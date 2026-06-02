import { describe, expect, it } from "vitest";
import { ApiError } from "../api/orderIntents";
import type { AppConfig } from "../config";
import { formatSignInError } from "./signInErrors";

const baseConfig: AppConfig = {
  apiBaseUrl: "http://localhost:8080",
  userServiceBaseUrl: "https://sharingbridge-user-service.onrender.com",
  googleClientId: "x",
  allowGoogleSignInBypass: false,
  allowAnyUserWebDashboard: true,
  defaultUserId: ""
};

describe("formatSignInError", () => {
  it("passes through user-service message with reason", () => {
    const err = new ApiError(
      "Donor web dashboard is disabled on production.",
      403,
      "wrong_client_role",
      "mvp_disabled_production"
    );
    expect(formatSignInError(err, baseConfig)).toBe(
      "Donor web dashboard is disabled on production."
    );
  });

  it("explains web/API MVP mismatch when message empty", () => {
    const err = new ApiError("", 403, "wrong_client_role");
    const text = formatSignInError(err, baseConfig);
    expect(text).toMatch(/VITE_ALLOW_ANY_USER_WEB_DASHBOARD/);
    expect(text).toMatch(/ALLOW_WEB_DASHBOARD_ANY_USER/);
    expect(text).toMatch(/onrender\.com/);
  });
});
