import type { AuthSession } from "../authSession";
import type { OrderInitiation } from "../types";

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

export type OrderIntentsLoadResult = {
  intents: OrderInitiation[];
  /** From API — drives coordinator vs limited UI (must match deployed integration-service). */
  dashboard: "coordinator" | "limited";
  role: string;
};

export async function fetchOrderInitiations(
  apiBaseUrl: string,
  session: AuthSession
): Promise<OrderIntentsLoadResult> {
  const url = new URL(`${apiBaseUrl}/v1/donor-seeker/order-intents`);

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

  return {
    intents: list as OrderInitiation[],
    dashboard,
    role: typeof body.role === "string" ? body.role.trim() : ""
  };
}
