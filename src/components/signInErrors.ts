import { ApiError } from "../api/orderIntents";
import type { AppConfig } from "../config";

/** User-facing sign-in error text from user-service. */
export function formatSignInError(err: ApiError, config: AppConfig): string {
  const corsHint =
    err.status === 0 || err.message.includes("Failed to fetch")
      ? ` Check WEB_CORS_ORIGINS on user-service includes this site origin (API: ${config.userServiceBaseUrl}).`
      : "";

  if (err.message?.trim()) {
    return `${err.message}${corsHint}`;
  }

  return `Could not sign in.${corsHint}`;
}
