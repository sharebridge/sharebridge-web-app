import { ApiError } from "../api/orderIntents";
import type { AppConfig } from "../config";

/** User-facing sign-in error text from user-service + local config. */
export function formatSignInError(err: ApiError, config: AppConfig): string {
  const corsHint =
    err.status === 0 || err.message.includes("Failed to fetch")
      ? ` Check WEB_CORS_ORIGINS on user-service includes this site origin (API: ${config.userServiceBaseUrl}).`
      : "";

  if (err.code !== "wrong_client_role") {
    return `${err.message}${corsHint}`;
  }

  if (err.message?.trim()) {
    return `${err.message}${corsHint}`;
  }

  if (config.allowAnyUserWebDashboard) {
    return (
      `This donor account was rejected by user-service (${config.userServiceBaseUrl}). ` +
      "The web build has MVP mode on (VITE_ALLOW_ANY_USER_WEB_DASHBOARD), but the API must also allow it: " +
      "ALLOW_WEB_DASHBOARD_ANY_USER=true and DEPLOYMENT_ENV=staging or development (not production). " +
      "Redeploy user-service after changing env." +
      corsHint
    );
  }

  return (
    "This Google account cannot use the web coordinator dashboard. " +
    "Use the mobile app as a donor, or sign in with a coordinator account." +
    corsHint
  );
}
