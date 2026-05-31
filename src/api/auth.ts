import { ApiError } from "./orderIntents";

export type AuthUser = {
  user_id: string;
  email?: string | null;
  name?: string | null;
  role: string;
};

export type SignInResult = {
  token: string;
  userId: string;
  role: string;
  user: AuthUser;
};

async function parseSignInResponse(
  response: Response
): Promise<SignInResult> {
  const text = await response.text();
  let body: Record<string, unknown> = {};
  if (text) {
    try {
      body = JSON.parse(text) as Record<string, unknown>;
    } catch {
      throw new ApiError("Sign-in response was not valid JSON.", response.status);
    }
  }

  if (!response.ok) {
    throw new ApiError(
      (body.message as string) || `Sign-in failed (HTTP ${response.status}).`,
      response.status,
      body.code as string | undefined
    );
  }

  const token = body.token;
  if (typeof token !== "string" || !token.trim()) {
    throw new ApiError("Sign-in response missing token.", response.status);
  }

  const user = body.user as AuthUser | undefined;
  const resolvedUserId =
    (typeof user?.user_id === "string" && user.user_id.trim()) ||
    ((user as { id?: string } | undefined)?.id?.trim()) ||
    "";
  const role =
    (typeof user?.role === "string" && user.role.trim()) || "coordinator";

  if (!resolvedUserId) {
    throw new ApiError("Sign-in response missing user id.", response.status);
  }

  return {
    token: token.trim(),
    userId: resolvedUserId,
    role,
    user: {
      user_id: resolvedUserId,
      email: user?.email ?? null,
      name: user?.name ?? null,
      role
    }
  };
}

export async function signInWithGoogle(
  userServiceBaseUrl: string,
  idToken: string
): Promise<SignInResult> {
  const base = userServiceBaseUrl.replace(/\/$/, "");
  const response = await fetch(`${base}/v1/auth/google`, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json"
    },
    body: JSON.stringify({
      id_token: idToken,
      client_type: "web"
    })
  });

  return parseSignInResponse(response);
}

/** Opens Google's account picker (OAuth access token) for switching Gmail accounts. */
export async function signInWithGoogleAccessToken(
  userServiceBaseUrl: string,
  accessToken: string
): Promise<SignInResult> {
  const base = userServiceBaseUrl.replace(/\/$/, "");
  const response = await fetch(`${base}/v1/auth/google`, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json"
    },
    body: JSON.stringify({
      access_token: accessToken,
      client_type: "web"
    })
  });

  return parseSignInResponse(response);
}

/** Dev-only fallback when VITE_ALLOW_DEV_SIGN_IN=true */
export async function mintDevCoordinatorToken(
  userServiceBaseUrl: string,
  userId: string
): Promise<SignInResult> {
  const base = userServiceBaseUrl.replace(/\/$/, "");
  const response = await fetch(`${base}/v1/auth/token`, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json"
    },
    body: JSON.stringify({ user_id: userId.trim(), role: "coordinator" })
  });

  const text = await response.text();
  let body: Record<string, unknown> = {};
  if (text) {
    try {
      body = JSON.parse(text) as Record<string, unknown>;
    } catch {
      throw new ApiError("Sign-in response was not valid JSON.", response.status);
    }
  }

  if (!response.ok) {
    throw new ApiError(
      (body.message as string) || `Sign-in failed (HTTP ${response.status}).`,
      response.status,
      body.code as string | undefined
    );
  }

  const token = body.token;
  if (typeof token !== "string" || !token.trim()) {
    throw new ApiError("Sign-in response missing token.", response.status);
  }

  const user = body.user as AuthUser | undefined;
  const resolvedUserId =
    (typeof user?.user_id === "string" && user.user_id.trim()) ||
    userId.trim();

  return {
    token: token.trim(),
    userId: resolvedUserId,
    role: "coordinator",
    user: {
      user_id: resolvedUserId,
      email: user?.email ?? null,
      name: user?.name ?? null,
      role: "coordinator"
    }
  };
}
