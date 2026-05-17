export type AppConfig = {
  apiBaseUrl: string;
  userServiceBaseUrl: string;
  /** Optional default on the sign-in form only. */
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
    defaultUserId:
      import.meta.env.VITE_DEFAULT_USER_ID?.trim() || "demo-user"
  };
}

export function integrationHost(config: AppConfig): string {
  try {
    return new URL(config.apiBaseUrl).host;
  } catch {
    return config.apiBaseUrl;
  }
}
