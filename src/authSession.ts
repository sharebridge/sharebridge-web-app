export type AuthSession = {
  userId: string;
  token: string;
  expiresAt: number;
};

const STORAGE_KEY = "sharingbridge_web_session_v1";

export function jwtExpiresAtMs(token: string): number | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      return null;
    }
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(base64)) as { exp?: number };
    if (typeof payload.exp === "number") {
      return payload.exp * 1000;
    }
  } catch {
    return null;
  }
  return null;
}

export function isSessionExpired(session: AuthSession): boolean {
  return Date.now() >= session.expiresAt;
}

export function loadSession(): AuthSession | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as AuthSession;
    if (!parsed.userId?.trim() || !parsed.token?.trim() || !parsed.expiresAt) {
      return null;
    }
    const session: AuthSession = {
      userId: parsed.userId.trim(),
      token: parsed.token.trim(),
      expiresAt: parsed.expiresAt
    };
    if (isSessionExpired(session)) {
      sessionStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function saveSession(session: AuthSession): void {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearSession(): void {
  sessionStorage.removeItem(STORAGE_KEY);
}

export function sessionFromToken(userId: string, token: string): AuthSession {
  const expiresAt =
    jwtExpiresAtMs(token) ?? Date.now() + 3600 * 1000;
  return { userId, token, expiresAt };
}
