export type AuthMode = "modheader" | "env";

export type AppConfig = {
  apiBaseUrl: string;
  userId: string;
  authMode: AuthMode;
  /** Set only when authMode is env (local .env — never commit real tokens). */
  authToken?: string;
};

const DEFAULT_API =
  "https://sharingbridge-integration-service.onrender.com";

export function getAppConfig(): AppConfig {
  const apiBaseUrl = (
    import.meta.env.VITE_API_BASE_URL?.trim() || DEFAULT_API
  ).replace(/\/$/, "");
  const userId = import.meta.env.VITE_USER_ID?.trim() || "demo-user";
  const authMode: AuthMode =
    import.meta.env.VITE_AUTH_MODE === "env" ? "env" : "modheader";
  const envToken = import.meta.env.VITE_AUTH_TOKEN?.trim();
  return {
    apiBaseUrl,
    userId,
    authMode,
    authToken: authMode === "env" ? envToken : undefined
  };
}

export function integrationHost(config: AppConfig): string {
  try {
    return new URL(config.apiBaseUrl).host;
  } catch {
    return config.apiBaseUrl;
  }
}
