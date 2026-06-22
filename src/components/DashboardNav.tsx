import {
  dashboardViewLabel,
  navigateDashboardView,
  type DashboardView
} from "../dashboardNavigation";

type Props = {
  activeView: DashboardView;
};

export function DashboardNav({ activeView }: Props) {
  const views: DashboardView[] = ["initiations", "actions", "map"];

  return (
    <nav
      className="dashboard-nav view-mode-toolbar"
      role="tablist"
      aria-label="Dashboard views"
    >
      {views.map((view) => (
        <button
          key={view}
          type="button"
          role="tab"
          aria-selected={activeView === view}
          className={
            activeView === view ? "view-mode-btn active" : "view-mode-btn"
          }
          onClick={() => navigateDashboardView(view)}
        >
          {dashboardViewLabel(view)}
        </button>
      ))}
    </nav>
  );
}
