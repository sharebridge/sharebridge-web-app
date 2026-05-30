export type AppConfig = {
  apiBaseUrl: string;
  userServiceBaseUrl: string;
  googleClientId: string;
  allowDevSignIn: boolean;
  /** Dev sign-in form pre-fill only; set via VITE_DEFAULT_USER_ID (no in-code default). */
  defaultUserId: string;
};

const DEFAULT_INTEGRATION =
  "https://sharingbridge-integration-service.onrender.com";
const DEFAULT_USER_SERVICE =
  "https://sharingbridge-user-service.onrender.com";

export function getAppConfig(): AppConfig {
  return {
    apiBaseUrl: (
      import.meta.env.VITE_API_BASE_URL?.trim() || DEFAULT_INTEGRATION
    ).replace(/\/$/, ""),
    userServiceBaseUrl: (
      import.meta.env.VITE_USER_SERVICE_BASE_URL?.trim() ||
      DEFAULT_USER_SERVICE
    ).replace(/\/$/, ""),
    googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim() || "",
    allowDevSignIn: import.meta.env.VITE_ALLOW_DEV_SIGN_IN === "true",
    defaultUserId: import.meta.env.VITE_DEFAULT_USER_ID?.trim() ?? ""
  };
}

export function integrationHost(config: AppConfig): string {
  try {
    return new URL(config.apiBaseUrl).host;
  } catch {
    return config.apiBaseUrl;
  }
}
