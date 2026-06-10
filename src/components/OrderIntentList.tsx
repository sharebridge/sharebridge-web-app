import {
  formatDistanceM,
  formatDonorMeta,
  formatElapsedSince,
  formatWhen,
  primaryRestaurant,
  statusLabel
} from "../format";
import { groupOrderIntents, type OrderGroupMode } from "../groupOrderIntents";
import type { OrderInitiation } from "../types";
import { ReferencePhotoDisplay } from "../ReferencePhotoDisplay";
import { OrderIntentDetail } from "./OrderIntentDetail";

type Props = {
  intents: OrderInitiation[];
  groupMode: OrderGroupMode;
  selectedId: string | null;
  showDonorInList: boolean;
  coordinatorView: boolean;
  showInlineDetail: boolean;
  viewerUserId: string;
  onSelect: (orderIntentId: string) => void;
  onMarkPaymentDone?: (orderIntentId: string) => void;
  onMarkDelivered?: (orderIntentId: string) => void;
  opsSaving?: boolean;
};

export function OrderIntentList({
  intents,
  groupMode,
  selectedId,
  showDonorInList,
  coordinatorView,
  showInlineDetail,
  viewerUserId,
  onSelect,
  onMarkPaymentDone,
  onMarkDelivered,
  opsSaving = false
}: Props) {
  const groups = groupOrderIntents(intents, groupMode);

  return (
    <ul className="intent-list">
      {groups.map((group) => (
        <li key={group.key} className="intent-group">
          <div
            className="intent-group-head"
            title={group.title}
          >
            <h3 className="intent-group-title">{group.label}</h3>
            <span className="intent-group-count">
              {group.intents.length}{" "}
              {group.intents.length === 1 ? "order" : "orders"}
            </span>
          </div>
          <ul className="intent-group-items">
            {group.intents.map((intent) => {
              const selected = selectedId === intent.order_intent_id;
              return (
                <li key={intent.order_intent_id} className="intent-row-wrap">
                  <IntentRow
                    intent={intent}
                    showDonorInList={showDonorInList}
                    selected={selected}
                    onSelect={() => onSelect(intent.order_intent_id)}
                  />
                  {showInlineDetail && selected ? (
                    <div className="intent-inline-detail">
                      <h3 className="intent-inline-detail-title">
                        Initiation detail
                      </h3>
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
                          coordinatorView &&
                          intent.delivery_status !== "delivered"
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
            })}
          </ul>
        </li>
      ))}
    </ul>
  );
}

function IntentRow({
  intent,
  showDonorInList,
  selected,
  onSelect
}: {
  intent: OrderInitiation;
  showDonorInList: boolean;
  selected: boolean;
  onSelect: () => void;
}) {
  const restaurant = primaryRestaurant(intent);
  const meta = [
    showDonorInList
      ? formatDonorMeta(intent.user_id, intent.donor_email)
      : null,
    statusLabel(intent.status),
    restaurant
  ]
    .filter(Boolean)
    .join(" · ");
  const metrics = [
    `Intent taken ${formatWhen(intent.created_at)} (${formatElapsedSince(intent.created_at)})`,
    `Delivered ${intent.delivered_at ? formatWhen(intent.delivered_at) : "—"}`,
    `Distance ${formatDistanceM(intent.distance_m)}`
  ].join(" · ");
  const hasThumb = Boolean(
    intent.reference_photo_thumbnail_url?.trim() &&
      (intent.reference_photo_view_url?.trim() ||
        intent.reference_photo_thumbnail_url?.trim())
  );

  return (
    <>
      <button
        type="button"
        className={selected ? "intent-row active" : "intent-row"}
        onClick={onSelect}
      >
        {hasThumb ? (
          <ReferencePhotoDisplay
            compact
            thumbnailUrl={intent.reference_photo_thumbnail_url}
            viewUrl={intent.reference_photo_view_url}
          />
        ) : intent.has_reference_photo ? (
          <span className="intent-photo-placeholder" aria-hidden>
            📷
          </span>
        ) : null}
        <span className="intent-row-text">
          <span className="intent-id">{intent.order_intent_id}</span>
          <span className="intent-meta">{meta}</span>
          <span className="intent-metrics">{metrics}</span>
        </span>
      </button>
    </>
  );
}
