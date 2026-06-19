import type { DashboardNotification } from "../dashboardNotifications";
import { dashboardNotificationSummary } from "../dashboardNotifications";

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

export function DashboardNotificationsBanner({
  notifications,
  onOpenConnection
}: Props) {
  if (notifications.length === 0) {
    return null;
  }

  return (
    <section
      className="dashboard-notifications"
      aria-label="Connection updates"
    >
      <p className="dashboard-notifications-title">
        Updates ({notifications.length})
      </p>
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
              className="btn btn-secondary btn-compact"
              onClick={() => onOpenConnection(row.orderCode)}
            >
              Open Connection
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
