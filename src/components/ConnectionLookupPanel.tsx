import { useCallback, useEffect, useMemo, useState } from "react";
import type { AuthSession } from "../authSession";
import { fetchOrderConnection, type OrderConnection } from "../api/connections";
import type { DemandBoardSnapshot } from "../api/demandBoard";
import { getAppConfig } from "../config";
import { CONNECTION_SAFETY_COPY } from "../connectionCopy";
import { formatUserFacingApiError } from "../apiUserMessage";
import { isSessionExpired } from "../authSession";
import { CollapsiblePanel } from "./CollapsiblePanel";
import {
  orderContactsArrivalSignature,
  orderContactsCollapsedSummary,
  orderContactsHighlightCollapsed,
  summarizeOrderContactsFromSnapshot
} from "../orderContactBoardSummary";

type Props = {
  session: AuthSession;
  snapshot: DemandBoardSnapshot | null;
  onSessionInvalid?: () => void;
  autoLoadOrderCode?: string | null;
};

export function ConnectionLookupPanel({
  session,
  snapshot,
  onSessionInvalid,
  autoLoadOrderCode = null
}: Props) {
  const [orderCodeInput, setOrderCodeInput] = useState("");
  const [connection, setConnection] = useState<OrderConnection | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const contactBoard = useMemo(
    () => summarizeOrderContactsFromSnapshot(snapshot),
    [snapshot]
  );
  const knownCodes = useMemo(
    () => [...contactBoard.readyCodes, ...contactBoard.waitingCodes],
    [contactBoard]
  );
  const arrivalSignature = orderContactsArrivalSignature(contactBoard);

  const loadConnection = useCallback(
    async (orderCode: string) => {
      const trimmed = orderCode.trim();
      if (!trimmed) {
        setError("Enter an order code (for example SB-7K2M-9F3).");
        return;
      }
      if (isSessionExpired(session)) {
        setError("Your sign-in has expired. Please sign out and sign in again.");
        onSessionInvalid?.();
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const data = await fetchOrderConnection(
          getAppConfig().apiBaseUrl,
          session,
          trimmed
        );
        setConnection(data);
        setOrderCodeInput(trimmed);
      } catch (err) {
        setConnection(null);
        setError(
          formatUserFacingApiError(
            err,
            "Could not load order contacts for this order."
          )
        );
      } finally {
        setLoading(false);
      }
    },
    [session, onSessionInvalid]
  );

  useEffect(() => {
    const code = autoLoadOrderCode?.trim();
    if (!code) {
      return;
    }
    void loadConnection(code);
  }, [autoLoadOrderCode, loadConnection]);

  return (
    <CollapsiblePanel
      title="Order contacts"
      collapsedSummary={orderContactsCollapsedSummary(contactBoard, loading)}
      highlightCollapsed={orderContactsHighlightCollapsed(contactBoard)}
      arrivalSignature={arrivalSignature}
      expandedRevision={autoLoadOrderCode}
      defaultExpanded={Boolean(autoLoadOrderCode?.trim())}
      storageKey="actions-connection"
      className="connection-panel panel"
      ariaLabel="Order contacts"
    >
      <p className="connection-panel-lede">
        After an eco kitchen commits, look up the order code here to see login
        emails for off-platform payment and delivery. We never send payment links
        or QR codes by email.
      </p>

      <div className="connection-lookup-row">
        <label className="connection-lookup-field">
          Order code
          <input
            type="text"
            value={orderCodeInput}
            placeholder="SB-7K2M-9F3"
            disabled={loading}
            onChange={(event) => setOrderCodeInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                void loadConnection(orderCodeInput);
              }
            }}
          />
        </label>
        <button
          type="button"
          className="btn btn-secondary btn-compact"
          disabled={loading || !orderCodeInput.trim()}
          onClick={() => void loadConnection(orderCodeInput)}
        >
          {loading ? "Loading…" : "View contacts"}
        </button>
      </div>

      {knownCodes.length > 0 ? (
        <div className="connection-quick-codes">
          <span className="connection-quick-label">Recent orders:</span>
          {knownCodes.map((code) => (
            <button
              key={code}
              type="button"
              className="connection-code-chip"
              disabled={loading}
              onClick={() => void loadConnection(code)}
            >
              {code}
            </button>
          ))}
        </div>
      ) : null}

      {error ? (
        <div className="banner banner-error" role="alert">
          {error}
        </div>
      ) : null}

      {connection ? (
        <div className="connection-detail" role="status">
          <p className="connection-detail-code">
            <strong>{connection.order_code}</strong>
            <span className="badge">
              {connection.status === "ready"
                ? "Contacts ready"
                : "Waiting for kitchen"}
            </span>
          </p>
          {connection.menu_label ? (
            <p>
              {connection.menu_label}
              {connection.meal_units != null
                ? ` · ${connection.meal_units} unit${connection.meal_units === 1 ? "" : "s"}`
                : ""}
              {connection.price_inr != null
                ? ` · ₹${connection.price_inr}`
                : ""}
            </p>
          ) : null}

          {connection.status === "ready" ? (
            <>
              {connection.kitchen?.display_name ? (
                <p>
                  <strong>Eco kitchen:</strong> {connection.kitchen.display_name}
                </p>
              ) : null}
              {connection.counterparty_email ? (
                <p>
                  <strong>Kitchen login email:</strong>{" "}
                  <a href={`mailto:${connection.counterparty_email}`}>
                    {connection.counterparty_email}
                  </a>
                </p>
              ) : null}
              {connection.initiator?.login_email ? (
                <p>
                  <strong>Initiator login email:</strong>{" "}
                  <a href={`mailto:${connection.initiator.login_email}`}>
                    {connection.initiator.login_email}
                  </a>
                </p>
              ) : null}
              {connection.pledgers && connection.pledgers.length > 0 ? (
                <div>
                  <strong>Pledgers</strong>
                  <ul className="connection-pledger-list">
                    {connection.pledgers.map((row) => (
                      <li key={`${row.pledged_by_user_id}-${row.meal_units}`}>
                        {row.login_email ?? "—"} · {row.meal_units} unit
                        {row.meal_units === 1 ? "" : "s"}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </>
          ) : (
            <p>
              No eco kitchen has committed to this order yet. You will see
              contact emails here once a kitchen commitment is recorded.
            </p>
          )}

          <p className="connection-safety">{CONNECTION_SAFETY_COPY}</p>
        </div>
      ) : null}
    </CollapsiblePanel>
  );
}
