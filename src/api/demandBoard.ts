import { ApiError } from "./orderIntents";
import type { AuthSession } from "../authSession";

export type DemandWindowRow = {
  locality_key: string;
  demand_count: number;
  meal_units_total: number;
  latest_at: string;
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

export type DemandBoardSnapshot = {
  status: string;
  role?: string | null;
  message: string;
  standard_offers: unknown[];
  demand_windows: DemandWindowRow[];
  seeker_demands: SeekerDemandRow[];
  pledges: unknown[];
  vendor_bids: unknown[];
  generated_at: string;
};

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
