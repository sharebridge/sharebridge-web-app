import { formatWhen } from "../format";
import {
  initiationSelectionId,
  type InitiationFeedItem
} from "../initiationFeed";
import type { OrderInitiation } from "../types";
import { OrderIntentDetail } from "./OrderIntentDetail";

type Props = {
  items: InitiationFeedItem[];
  selectedKey: string | null;
  showDonorInList: boolean;
  coordinatorView: boolean;
  showInlineDetail: boolean;
  viewerUserId: string;
  opsSaving?: boolean;
  onSelect: (key: string) => void;
  onMarkPaymentDone?: (orderIntentId: string) => void;
  onMarkDelivered?: (orderIntentId: string) => void;
};

function initiationKindLabel(kind: InitiationFeedItem["kind"]): string {
  return kind === "vendor_order" ? "Vendor order" : "Meal need";
}

function vendorOrderTitle(intent: OrderInitiation): string {
  const preset = intent.selected_preset;
  if (
    preset &&
    typeof preset.restaurant_name === "string" &&
    preset.restaurant_name.trim()
  ) {
    return preset.restaurant_name.trim();
  }
  const snapshot = intent.presets_snapshot[0];
  if (snapshot?.restaurant_name?.trim()) {
    return snapshot.restaurant_name.trim();
  }
  return intent.pack_id;
}

export function InitiationsList({
  items,
  selectedKey,
  showDonorInList,
  coordinatorView,
  showInlineDetail,
  viewerUserId,
  opsSaving,
  onSelect,
  onMarkPaymentDone,
  onMarkDelivered
}: Props) {
  if (items.length === 0) {
    return null;
  }

  return (
    <ul className="intent-list initiation-timeline">
      {items.map((row) => {
        const key = initiationSelectionId(row);
        const selected = selectedKey === key;
        if (row.kind === "vendor_order") {
          const intent = row.intent;
          return (
            <li key={key} className="intent-row-wrap">
              <button
                type="button"
                className={selected ? "intent-row active" : "intent-row"}
                onClick={() => onSelect(key)}
              >
                <span className="initiation-kind-chip">
                  {initiationKindLabel(row.kind)}
                </span>
                <strong>{vendorOrderTitle(intent)}</strong>
                <span className="intent-meta">
                  {showDonorInList && intent.initiator_email
                    ? `${intent.initiator_email} · `
                    : ""}
                  {intent.payment_status === "paid_externally"
                    ? "Paid"
                    : "Payment pending"}{" "}
                  · {formatWhen(intent.created_at)}
                </span>
              </button>
              {showInlineDetail && selected ? (
                <div className="intent-inline-detail">
                  <OrderIntentDetail
                    intent={intent}
                    coordinatorView={coordinatorView}
                    compact
                    canMarkPaymentDone={
                      !coordinatorView &&
                      intent.user_id === viewerUserId &&
                      intent.payment_status !== "paid_externally"
                    }
                    markingPayment={opsSaving}
                    onMarkPaymentDone={() =>
                      onMarkPaymentDone?.(intent.order_intent_id)
                    }
                    canMarkDelivered={
                      coordinatorView && intent.delivery_status !== "delivered"
                    }
                    markingDelivered={opsSaving}
                    onMarkDelivered={() =>
                      onMarkDelivered?.(intent.order_intent_id)
                    }
                  />
                </div>
              ) : null}
            </li>
          );
        }

        const demand = row.demand;
        return (
          <li key={key} className="intent-row-wrap">
            <button
              type="button"
              className={selected ? "intent-row active" : "intent-row"}
              onClick={() => onSelect(key)}
            >
              <span className="initiation-kind-chip">
                {initiationKindLabel(row.kind)}
              </span>
              <strong>{demand.menu_label ?? demand.need_description}</strong>
              {demand.price_inr != null ? ` · ₹${demand.price_inr}` : ""}
              <span className="intent-meta">
                {demand.meal_units} unit{demand.meal_units === 1 ? "" : "s"}
                {demand.locality_key ? ` · ${demand.locality_key}` : ""} ·{" "}
                {formatWhen(demand.created_at)} · pledge flow
              </span>
            </button>
            {showInlineDetail && selected ? (
              <div className="intent-inline-detail">
                    <p>
                      Recorded meal need — open the <strong>Supply</strong> tab for
                      pledges and vendor bids.
                    </p>
                {demand.verbal_notes?.trim() ? (
                  <p className="intent-meta">{demand.verbal_notes}</p>
                ) : null}
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
