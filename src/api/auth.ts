import { ApiError } from "./orderIntents";

export type MintTokenResult = {
  token: string;
  userId: string;
};

export async function mintDonorToken(
  userServiceBaseUrl: string,
  userId: string
): Promise<MintTokenResult> {
  const base = userServiceBaseUrl.replace(/\/$/, "");
  const response = await fetch(`${base}/v1/auth/token`, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json"
    },
    body: JSON.stringify({ user_id: userId.trim() })
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

  const user = body.user as { user_id?: string } | undefined;
  const resolvedUserId =
    (typeof user?.user_id === "string" && user.user_id.trim()) ||
    userId.trim();

  return { token: token.trim(), userId: resolvedUserId };
}
