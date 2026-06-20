import type { DemandBoardSnapshot } from "./api/demandBoard";
import { isConnectionOrderInProgress } from "./connectionOrderProgress";

export type OrderContactBoardStatus = {
  readyCodes: string[];
  waitingCodes: string[];
};

function committedKitchenOrderCodes(
  snapshot: DemandBoardSnapshot | null
): Set<string> {
  const ready = new Set<string>();
  for (const row of snapshot?.vendor_bids ?? []) {
    const code = row.order_code?.trim();
    if (code && row.commitment_status === "committed") {
      ready.add(code);
    }
  }
  return ready;
}

function isTrackedOrderCode(
  snapshot: DemandBoardSnapshot | null,
  orderCode: string
): boolean {
  const demands = (snapshot?.seeker_demands ?? []).filter(
    (row) => row.order_code?.trim() === orderCode
  );
  if (demands.length === 0) {
    return committedKitchenOrderCodes(snapshot).has(orderCode);
  }
  return demands.some((row) => isConnectionOrderInProgress(row));
}

/** In-progress order codes from the demand board (not the last opened contact). */
export function summarizeOrderContactsFromSnapshot(
  snapshot: DemandBoardSnapshot | null
): OrderContactBoardStatus {
  const committed = committedKitchenOrderCodes(snapshot);
  const tracked = new Set<string>();

  for (const row of snapshot?.seeker_demands ?? []) {
    if (!isConnectionOrderInProgress(row)) {
      continue;
    }
    const code = row.order_code?.trim();
    if (code) {
      tracked.add(code);
    }
  }

  for (const code of committed) {
    if (isTrackedOrderCode(snapshot, code)) {
      tracked.add(code);
    }
  }

  const readyCodes: string[] = [];
  const waitingCodes: string[] = [];

  for (const code of [...tracked].sort()) {
    if (committed.has(code)) {
      readyCodes.push(code);
    } else {
      waitingCodes.push(code);
    }
  }

  return { readyCodes, waitingCodes };
}

function formatCodePreview(codes: string[], maxShown = 2): string {
  if (codes.length === 0) {
    return "";
  }
  if (codes.length === 1) {
    return codes[0];
  }
  const preview = codes.slice(0, maxShown).join(", ");
  const extra = codes.length > maxShown ? ` +${codes.length - maxShown}` : "";
  return `${preview}${extra}`;
}

export function orderContactsCollapsedSummary(
  board: OrderContactBoardStatus,
  loading: boolean
): string {
  if (loading) {
    return "Loading contacts…";
  }

  const { readyCodes, waitingCodes } = board;
  const total = readyCodes.length + waitingCodes.length;

  if (total === 0) {
    return "Look up an order code after eco kitchen commit";
  }

  const parts: string[] = [];

  if (readyCodes.length === 1) {
    parts.push(`Contacts ready · ${readyCodes[0]}`);
  } else if (readyCodes.length > 1) {
    parts.push(
      `${readyCodes.length} contacts ready · ${formatCodePreview(readyCodes)}`
    );
  }

  if (waitingCodes.length === 1) {
    parts.push(`Waiting for kitchen · ${waitingCodes[0]}`);
  } else if (waitingCodes.length > 1) {
    parts.push(`${waitingCodes.length} waiting for kitchen`);
  }

  return parts.join(" · ");
}

export function orderContactsHighlightCollapsed(
  board: OrderContactBoardStatus
): boolean {
  return board.readyCodes.length > 0 || board.waitingCodes.length > 0;
}

export function orderContactsArrivalSignature(
  board: OrderContactBoardStatus
): string | null {
  const all = [...board.readyCodes, ...board.waitingCodes];
  return all.length > 0 ? all.join("|") : null;
}
