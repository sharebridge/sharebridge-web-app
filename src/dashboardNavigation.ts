export type DashboardView = "initiations" | "actions" | "map";

const VIEWS: DashboardView[] = ["initiations", "actions", "map"];

export function isDashboardView(value: string): value is DashboardView {
  return VIEWS.includes(value as DashboardView);
}

export function readDashboardViewFromHash(): DashboardView {
  if (typeof window === "undefined") {
    return "initiations";
  }
  const raw = window.location.hash.replace(/^#\/?/, "").split("?")[0].trim();
  return isDashboardView(raw) ? raw : "initiations";
}

export function dashboardViewHref(view: DashboardView): string {
  return `#/${view}`;
}

export function navigateDashboardView(view: DashboardView): void {
  const next = dashboardViewHref(view);
  if (window.location.hash !== next) {
    window.location.hash = next;
  }
}

export function dashboardViewLabel(view: DashboardView): string {
  switch (view) {
    case "initiations":
      return "Initiations";
    case "actions":
      return "Actions";
    case "map":
      return "Map";
    default:
      return view;
  }
}
