export type AppConfig = {
  apiBaseUrl: string;
  userServiceBaseUrl: string;
  googleClientId: string;
  /** Maps JavaScript API — optional; list view works without it. */
  googleMapsApiKey: string;
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
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.trim() || ""
  };
}

export function integrationHost(config: AppConfig): string {
  try {
    return new URL(config.apiBaseUrl).host;
  } catch {
    return config.apiBaseUrl;
  }
}
