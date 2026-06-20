import type { DashboardNotification } from "../dashboardNotifications";
import { dashboardNotificationSummary } from "../dashboardNotifications";
import { CollapsiblePanel } from "./CollapsiblePanel";

type Props = {
  notifications: DashboardNotification[];
  onOpenConnection: (orderCode: string) => void;
};

const ROLE_LABELS: Record<DashboardNotification["viewerRole"], string> = {
  coordinator: "Coordinator",
  initiator: "Your order",
  pledger: "Your pledge",
  kitchen: "Your kitchen commit"
};

function updatesCollapsedSummary(
  notifications: DashboardNotification[]
): string {
  if (notifications.length === 0) {
    return "";
  }
  const latest = notifications[0];
  const preview = dashboardNotificationSummary(latest);
  const countLabel =
    notifications.length === 1
      ? "1 update"
      : `${notifications.length} updates`;
  const shortPreview =
    preview.length > 72 ? `${preview.slice(0, 69).trim()}…` : preview;
  return `${countLabel} · ${shortPreview}`;
}

function updatesArrivalSignature(
  notifications: DashboardNotification[]
): string | null {
  if (notifications.length === 0) {
    return null;
  }
  return notifications
    .map((row) => `${row.id}:${row.committedAt}`)
    .join("|");
}

export function DashboardNotificationsBanner({
  notifications,
  onOpenConnection
}: Props) {
  if (notifications.length === 0) {
    return null;
  }

  return (
    <CollapsiblePanel
      title="Updates"
      collapsedSummary={updatesCollapsedSummary(notifications)}
      highlightCollapsed
      arrivalSignature={updatesArrivalSignature(notifications)}
      defaultExpanded
      storageKey="dashboard-updates"
      className="dashboard-notifications"
      ariaLabel="Dashboard updates"
    >
      <ul className="dashboard-notifications-list">
        {notifications.map((row) => (
          <li key={row.id} className="dashboard-notification-item">
            <div className="dashboard-notification-copy">
              <span className="dashboard-notification-badge">
                {ROLE_LABELS[row.viewerRole]}
              </span>
              <p>{dashboardNotificationSummary(row)}</p>
            </div>
            <button
              type="button"
              className="btn btn-secondary btn-compact dashboard-notification-action"
              onClick={() => onOpenConnection(row.orderCode)}
            >
              <span className="dashboard-notification-action-label">
                View contacts
              </span>
              <span className="dashboard-notification-action-hint">
                View contacts on Actions
              </span>
            </button>
          </li>
        ))}
      </ul>
    </CollapsiblePanel>
  );
}
