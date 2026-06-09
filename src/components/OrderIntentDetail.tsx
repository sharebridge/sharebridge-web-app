import {
  formatDistanceM,
  formatElapsedSince,
  formatWhen,
  statusLabel
} from "../format";
import type { OrderInitiation } from "../types";
import { ReferencePhotoDisplay } from "../ReferencePhotoDisplay";

type Props = {
  intent: OrderInitiation;
  coordinatorView: boolean;
  /** Shorter layout when expanded under a list row on mobile. */
  compact?: boolean;
};

export function OrderIntentDetail({
  intent,
  coordinatorView,
  compact = false
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
            <dt>Donor email</dt>
            <dd>{intent.donor_email?.trim() || "—"}</dd>
          </div>
          {!compact ? (
            <div>
              <dt>Donor user id</dt>
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
      {intent.verbal_handover_notes.trim() ? (
        <div className="detail-block">
          <dt>Handover notes</dt>
          <dd>{intent.verbal_handover_notes}</dd>
        </div>
      ) : null}
      {intent.presets_snapshot.length > 0 && !compact ? (
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
