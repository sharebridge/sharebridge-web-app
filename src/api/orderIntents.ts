import type { AuthSession } from "../authSession";
import type { OrderFeedMeta } from "../feedScope";
import type { OrderInitiation } from "../types";
import { ORDER_INTENTS_PATH } from "./paths";

export class ApiError extends Error {
  status: number;
  code?: string;
  reason?: string;

  constructor(message: string, status: number, code?: string, reason?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.reason = reason;
  }
}

export type ViewerLocation = {
  near_lat: number;
  near_lng: number;
};

export type OrderIntentsLoadResult = {
  intents: OrderInitiation[];
  /** From API — drives coordinator vs limited UI. */
  dashboard: "coordinator" | "limited";
  role: string;
  feedMeta: OrderFeedMeta;
};

/**
 * List order intents. Window and radius are enforced server-side for initiators;
 * pass viewer coordinates only when available (limited dashboard).
 */
export async function fetchOrderInitiations(
  apiBaseUrl: string,
  session: AuthSession,
  viewerLocation: ViewerLocation | null = null
): Promise<OrderIntentsLoadResult> {
  const url = new URL(`${apiBaseUrl}${ORDER_INTENTS_PATH}`);
  if (viewerLocation) {
    url.searchParams.set("near_lat", String(viewerLocation.near_lat));
    url.searchParams.set("near_lng", String(viewerLocation.near_lng));
  }

  const response = await fetch(url, {
    headers: {
      accept: "application/json",
      authorization: `Bearer ${session.token}`
    }
  });

  const text = await response.text();
  let body: Record<string, unknown> = {};
  if (text) {
    try {
      body = JSON.parse(text) as Record<string, unknown>;
    } catch {
      throw new ApiError("Response was not valid JSON.", response.status);
    }
  }

  if (!response.ok) {
    throw new ApiError(
      (body.message as string) || `HTTP ${response.status}`,
      response.status,
      body.code as string | undefined
    );
  }

  const list = body.order_intents;
  if (!Array.isArray(list)) {
    throw new ApiError("order_intents must be an array.", response.status);
  }

  const dashboard =
    body.dashboard === "coordinator" ? "coordinator" : "limited";

  const feedMeta: OrderFeedMeta = {
    since: typeof body.since === "string" ? body.since : undefined,
    neighbourhood:
      body.neighbourhood && typeof body.neighbourhood === "object"
        ? (body.neighbourhood as Record<string, unknown>)
        : undefined,
    feed:
      body.feed && typeof body.feed === "object"
        ? (body.feed as OrderFeedMeta["feed"])
        : undefined
  };

  return {
    intents: list as OrderInitiation[],
    dashboard,
    role: typeof body.role === "string" ? body.role.trim() : "",
    feedMeta
  };
}

export async function patchOrderIntent(
  apiBaseUrl: string,
  session: AuthSession,
  orderIntentId: string,
  patch: { payment_status?: string; delivery_status?: string }
): Promise<OrderInitiation> {
  const response = await fetch(
    `${apiBaseUrl}${ORDER_INTENTS_PATH}/${encodeURIComponent(orderIntentId)}`,
    {
      method: "PATCH",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${session.token}`,
        "content-type": "application/json"
      },
      body: JSON.stringify(patch)
    }
  );
  const text = await response.text();
  let body: Record<string, unknown> = {};
  if (text) {
    try {
      body = JSON.parse(text) as Record<string, unknown>;
    } catch {
      throw new ApiError("Response was not valid JSON.", response.status);
    }
  }
  if (!response.ok) {
    throw new ApiError(
      (body.message as string) || `HTTP ${response.status}`,
      response.status,
      body.code as string | undefined
    );
  }
  const intent = body.order_intent;
  if (!intent || typeof intent !== "object") {
    throw new ApiError("order_intent missing from response.", response.status);
  }
  return intent as OrderInitiation;
}
