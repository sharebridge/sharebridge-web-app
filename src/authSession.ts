export type AuthSession = {
  userId: string;
  role: string;
  email?: string | null;
  name?: string | null;
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

export function sessionDisplayLabel(session: AuthSession): string {
  const email = session.email?.trim();
  if (email) {
    return email;
  }
  const name = session.name?.trim();
  if (name) {
    return name;
  }
  return session.userId;
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
      role: typeof parsed.role === "string" ? parsed.role.trim() : "coordinator",
      email: parsed.email ?? null,
      name: parsed.name ?? null,
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

export function sessionFromSignIn(result: {
  userId: string;
  token: string;
  role: string;
  user?: { email?: string | null; name?: string | null };
}): AuthSession {
  const expiresAt =
    jwtExpiresAtMs(result.token) ?? Date.now() + 3600 * 1000;
  return {
    userId: result.userId,
    role: result.role,
    email: result.user?.email ?? null,
    name: result.user?.name ?? null,
    token: result.token,
    expiresAt
  };
}
