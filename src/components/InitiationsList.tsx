import { formatWhen } from "../format";
import {
  initiationSelectionId,
  type InitiationFeedItem
} from "../initiationFeed";
import type { OrderInitiation } from "../types";
import { OrderIntentList } from "./OrderIntentList";
import type { OrderGroupMode } from "../groupOrderIntents";

type Props = {
  items: InitiationFeedItem[];
  intents: OrderInitiation[];
  groupMode: OrderGroupMode;
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

export function InitiationsList({
  items,
  intents,
  groupMode,
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
  const mealNeeds = items.filter((row) => row.kind === "meal_need");

  if (items.length === 0) {
    return null;
  }

  return (
    <>
      {intents.length > 0 ? (
        <OrderIntentList
          intents={intents}
          groupMode={groupMode}
          selectedId={
            selectedKey?.startsWith("vendor_order:")
              ? selectedKey.slice("vendor_order:".length)
              : null
          }
          showDonorInList={showDonorInList}
          coordinatorView={coordinatorView}
          showInlineDetail={showInlineDetail}
          viewerUserId={viewerUserId}
          opsSaving={opsSaving}
          onSelect={(orderIntentId) =>
            onSelect(`vendor_order:${orderIntentId}`)
          }
          onMarkPaymentDone={onMarkPaymentDone}
          onMarkDelivered={onMarkDelivered}
        />
      ) : null}
      {mealNeeds.length > 0 ? (
        <ul className="intent-list initiation-meal-needs">
          {mealNeeds.map((row) => {
            const key = initiationSelectionId(row);
            const demand = row.demand;
            const selected = selectedKey === key;
            return (
              <li key={key} className="intent-row-wrap">
                <button
                  type="button"
                  className={selected ? "intent-row active" : "intent-row"}
                  onClick={() => onSelect(key)}
                >
                  <span className="initiation-kind-chip">Meal need</span>
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
                      Recorded meal need — payment is handled through pledges and
                      vendor bids below, not direct checkout by the initiator.
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
      ) : null}
    </>
  );
}
