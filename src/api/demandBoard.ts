import { ApiError } from "./orderIntents";
import type { AuthSession } from "../authSession";

export type AllocationHint =
  | "needs_pledges"
  | "needs_vendor_bids"
  | "balanced";

export type DemandWindowRow = {
  locality_key: string;
  demand_count: number;
  meal_units_total: number;
  latest_at: string;
  pledged_units_total?: number;
  bid_portions_total?: number;
  unmet_demand_units?: number;
  supply_gap_units?: number;
  allocation_hint?: AllocationHint;
};

export type SeekerDemandRow = {
  seeker_demand_id: string;
  reported_by_user_id?: string | null;
  status: string;
  meal_units: number;
  need_description: string;
  verbal_notes?: string;
  location_lat?: number | null;
  location_lng?: number | null;
  locality_key?: string;
  created_at: string;
  updated_at: string;
};

export type PledgeRow = {
  pledge_id: string;
  pledged_by_user_id?: string;
  locality_key: string;
  meal_units: number;
  status: string;
  created_at: string;
  matches_demand_bucket?: boolean;
};

export type VendorBidRow = {
  vendor_bid_id: string;
  submitted_by_user_id?: string;
  locality_key: string;
  vendor_name: string;
  portions: number;
  status: string;
  notes?: string;
  created_at: string;
  matches_demand_bucket?: boolean;
};

export type DemandBoardSnapshot = {
  status: string;
  role?: string | null;
  message: string;
  standard_offers: unknown[];
  demand_windows: DemandWindowRow[];
  active_locality_keys?: string[];
  seeker_demands: SeekerDemandRow[];
  pledges: PledgeRow[];
  vendor_bids: VendorBidRow[];
  orphan_pledges?: PledgeRow[];
  orphan_vendor_bids?: VendorBidRow[];
  generated_at: string;
};

async function readApiErrorMessage(
  response: Response,
  fallback: string
): Promise<string> {
  try {
    const body = (await response.json()) as { message?: string };
    if (body.message?.trim()) {
      return body.message;
    }
  } catch {
    // ignore
  }
  return fallback;
}

export async function createPledge(
  apiBaseUrl: string,
  session: AuthSession,
  body: { locality_key: string; meal_units: number }
): Promise<PledgeRow> {
  const response = await fetch(`${apiBaseUrl}/v1/pledges`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${session.token}`,
      "content-type": "application/json"
    },
    body: JSON.stringify(body)
  });
  if (!response.ok) {
    throw new ApiError(
      await readApiErrorMessage(response, "Pledge request failed."),
      response.status
    );
  }
  const data = (await response.json()) as { pledge: PledgeRow };
  return data.pledge;
}

export async function createVendorBid(
  apiBaseUrl: string,
  session: AuthSession,
  body: {
    locality_key: string;
    vendor_name: string;
    portions: number;
    notes?: string;
  }
): Promise<VendorBidRow> {
  const response = await fetch(`${apiBaseUrl}/v1/vendor-bids`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${session.token}`,
      "content-type": "application/json"
    },
    body: JSON.stringify(body)
  });
  if (!response.ok) {
    throw new ApiError(
      await readApiErrorMessage(response, "Vendor bid request failed."),
      response.status
    );
  }
  const data = (await response.json()) as { vendor_bid: VendorBidRow };
  return data.vendor_bid;
}

export async function fetchDemandBoard(
  apiBaseUrl: string,
  session: AuthSession
): Promise<DemandBoardSnapshot> {
  const response = await fetch(`${apiBaseUrl}/v1/demand/board`, {
    headers: {
      authorization: `Bearer ${session.token}`,
      "content-type": "application/json"
    }
  });
  if (!response.ok) {
    let message = "Demand board request failed.";
    try {
      const body = (await response.json()) as { message?: string };
      if (body.message) {
        message = body.message;
      }
    } catch {
      // ignore
    }
    throw new ApiError(message, response.status);
  }
  return (await response.json()) as DemandBoardSnapshot;
}
