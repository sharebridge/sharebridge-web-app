import {
  formatDistanceM,
  formatElapsedSince,
  formatWhen,
  paymentStatusLabel,
  statusLabel
} from "../format";
import type { OrderInitiation } from "../types";
import { ReferencePhotoDisplay } from "../ReferencePhotoDisplay";

type Props = {
  intent: OrderInitiation;
  coordinatorView: boolean;
  /** Shorter layout when expanded under a list row on mobile. */
  compact?: boolean;
  canMarkPaymentDone?: boolean;
  markingPayment?: boolean;
  onMarkPaymentDone?: () => void;
  canMarkDelivered?: boolean;
  markingDelivered?: boolean;
  onMarkDelivered?: () => void;
};

export function OrderIntentDetail({
  intent,
  coordinatorView,
  compact = false,
  canMarkPaymentDone = false,
  markingPayment = false,
  onMarkPaymentDone,
  canMarkDelivered = false,
  markingDelivered = false,
  onMarkDelivered
}: Props) {
  const locationText =
    intent.location_description?.trim() ||
    intent.location_label?.trim() ||
    intent.locality_key?.trim() ||
    null;

  return (
    <dl className={compact ? "detail-grid detail-grid-compact" : "detail-grid"}>
      {!compact ? (
        <div>
          <dt>Reference</dt>
          <dd>{intent.order_intent_id}</dd>
        </div>
      ) : null}
      {coordinatorView ? (
        <>
          <div>
            <dt>Initiator email</dt>
            <dd>
              {intent.initiator_email?.trim() ||
                intent.donor_email?.trim() ||
                "—"}
            </dd>
          </div>
          {!compact ? (
            <div>
              <dt>Initiator user id</dt>
              <dd>{intent.user_id?.trim() || "—"}</dd>
            </div>
          ) : null}
        </>
      ) : null}
      {!compact ? (
        <>
          <div>
            <dt>Instruction pack</dt>
            <dd>{intent.pack_id}</dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>{statusLabel(intent.status)}</dd>
          </div>
          <div>
            <dt>Payment</dt>
            <dd>
              {paymentStatusLabel(intent.payment_status)}
              {canMarkPaymentDone &&
              intent.payment_status !== "paid_externally" ? (
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ marginLeft: 8 }}
                  disabled={markingPayment}
                  onClick={onMarkPaymentDone}
                >
                  {markingPayment ? "Saving…" : "Mark payment done"}
                </button>
              ) : null}
            </dd>
          </div>
          <div>
            <dt>Delivery</dt>
            <dd>
              {paymentStatusLabel(intent.delivery_status)}
              {canMarkDelivered &&
              intent.delivery_status !== "delivered" ? (
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ marginLeft: 8 }}
                  disabled={markingDelivered}
                  onClick={onMarkDelivered}
                >
                  {markingDelivered ? "Saving…" : "Mark delivered"}
                </button>
              ) : null}
            </dd>
          </div>
        </>
      ) : null}
      {locationText ? (
        <div className="detail-block">
          <dt>Location</dt>
          <dd>{locationText}</dd>
        </div>
      ) : null}
      {intent.image_description?.trim() ? (
        <div className="detail-block">
          <dt>Image description</dt>
          <dd>{intent.image_description}</dd>
        </div>
      ) : null}
      {intent.seeker_appearance_hints?.trim() ? (
        <div className="detail-block">
          <dt>Appearance hints</dt>
          <dd>{intent.seeker_appearance_hints}</dd>
        </div>
      ) : null}
      {intent.seeker_handover_hints?.trim() ? (
        <div className="detail-block">
          <dt>Handover hints</dt>
          <dd>{intent.seeker_handover_hints}</dd>
        </div>
      ) : null}
      <div
        className={
          intent.reference_photo_view_url ||
          intent.reference_photo_thumbnail_url
            ? "detail-block"
            : undefined
        }
      >
        <dt>Reference photo</dt>
        <dd>
          <ReferencePhotoDisplay
            thumbnailUrl={intent.reference_photo_thumbnail_url}
            viewUrl={intent.reference_photo_view_url}
            artifactId={intent.reference_photo_artifact_id}
            hasReferencePhoto={intent.has_reference_photo}
          />
        </dd>
      </div>
      <div>
        <dt>Order intent taken</dt>
        <dd>
          {formatWhen(intent.created_at)}
          <span className="detail-sub">
            {" "}
            ({formatElapsedSince(intent.created_at)})
          </span>
        </dd>
      </div>
      {!compact ? (
        <>
          <div>
            <dt>Delivered at</dt>
            <dd>
              {intent.delivered_at?.trim()
                ? formatWhen(intent.delivered_at)
                : "—"}
            </dd>
          </div>
          <div>
            <dt>Last updated</dt>
            <dd>{formatWhen(intent.updated_at)}</dd>
          </div>
        </>
      ) : null}
      <div>
        <dt>Distance</dt>
        <dd>{formatDistanceM(intent.distance_m)}</dd>
      </div>
      {intent.verbal_handover_notes?.trim() ? (
        <div className="detail-block">
          <dt>Handover notes</dt>
          <dd>{intent.verbal_handover_notes}</dd>
        </div>
      ) : null}
      {Array.isArray(intent.presets_snapshot) &&
      intent.presets_snapshot.length > 0 &&
      !compact ? (
        <div className="detail-block">
          <dt>
            Presets at registration ({intent.presets_snapshot.length})
          </dt>
          <dd>
            <ul className="preset-list">
              {intent.presets_snapshot.map((row, index) => (
                <li key={`${row.restaurant_name}-${index}`}>
                  <strong>{row.restaurant_name || "Vendor"}</strong>
                  {row.app_name ? ` · ${row.app_name}` : ""}
                </li>
              ))}
            </ul>
          </dd>
        </div>
      ) : null}
    </dl>
  );
}
