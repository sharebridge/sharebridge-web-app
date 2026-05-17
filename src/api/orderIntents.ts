import type { AppConfig } from "../config";
import type { OrderInitiation } from "../types";

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

function buildRequestHeaders(config: AppConfig): HeadersInit {
  const headers: Record<string, string> = {
    accept: "application/json"
  };
  if (config.authMode === "env" && config.authToken) {
    headers.authorization = `Bearer ${config.authToken}`;
  }
  return headers;
}

export async function fetchOrderInitiations(
  config: AppConfig
): Promise<OrderInitiation[]> {
  const url = new URL(`${config.apiBaseUrl}/v1/donor-seeker/order-intents`);
  url.searchParams.set("user_id", config.userId);

  const response = await fetch(url, {
    headers: buildRequestHeaders(config)
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

  return list as OrderInitiation[];
}
