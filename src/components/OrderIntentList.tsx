import { formatWhen, primaryRestaurant, statusLabel } from "../format";
import { groupOrderIntents, type OrderGroupMode } from "../groupOrderIntents";
import type { OrderInitiation } from "../types";
import { ReferencePhotoDisplay } from "../ReferencePhotoDisplay";

type Props = {
  intents: OrderInitiation[];
  groupMode: OrderGroupMode;
  selectedId: string | null;
  onSelect: (orderIntentId: string) => void;
};

export function OrderIntentList({
  intents,
  groupMode,
  selectedId,
  onSelect
}: Props) {
  const groups = groupOrderIntents(intents, groupMode);

  return (
    <ul className="intent-list">
      {groups.map((group) => (
        <li key={group.key} className="intent-group">
          <div className="intent-group-head">
            <h3 className="intent-group-title">{group.label}</h3>
            <span className="intent-group-count">{group.intents.length}</span>
          </div>
          <ul className="intent-group-items">
            {group.intents.map((intent) => (
              <IntentRow
                key={intent.order_intent_id}
                intent={intent}
                selected={selectedId === intent.order_intent_id}
                onSelect={() => onSelect(intent.order_intent_id)}
              />
            ))}
          </ul>
        </li>
      ))}
    </ul>
  );
}

function IntentRow({
  intent,
  selected,
  onSelect
}: {
  intent: OrderInitiation;
  selected: boolean;
  onSelect: () => void;
}) {
  const restaurant = primaryRestaurant(intent);
  const meta = [
    intent.user_id ? `Donor ${intent.user_id}` : null,
    statusLabel(intent.status),
    restaurant,
    formatWhen(intent.updated_at || intent.created_at)
  ]
    .filter(Boolean)
    .join(" · ");
  const hasThumb = Boolean(
    intent.reference_photo_thumbnail_url?.trim() &&
      (intent.reference_photo_view_url?.trim() ||
        intent.reference_photo_thumbnail_url?.trim())
  );

  return (
    <li>
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
        </span>
      </button>
    </li>
  );
}
