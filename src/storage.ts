import type { ConnectionSettings } from "./types";

const STORAGE_KEY = "sharingbridge_web_connection_v1";

export function loadConnection(): ConnectionSettings | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as ConnectionSettings;
    if (!parsed.apiBaseUrl?.trim() || !parsed.authToken?.trim()) {
      return null;
    }
    return {
      apiBaseUrl: parsed.apiBaseUrl.trim().replace(/\/$/, ""),
      authToken: parsed.authToken.trim(),
      userId: (parsed.userId || "demo-user").trim()
    };
  } catch {
    return null;
  }
}

export function saveConnection(settings: ConnectionSettings): void {
  sessionStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      apiBaseUrl: settings.apiBaseUrl.trim().replace(/\/$/, ""),
      authToken: settings.authToken.trim(),
      userId: settings.userId.trim() || "demo-user"
    })
  );
}

export function clearConnection(): void {
  sessionStorage.removeItem(STORAGE_KEY);
}
