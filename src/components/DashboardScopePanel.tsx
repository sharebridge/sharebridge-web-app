import type { DashboardBoundaries } from "../feedScope";
import type { CoordinatorScopeFilters } from "../coordinatorScope";
import { CoordinatorScopeToolbar } from "./CoordinatorScopeToolbar";
import { DashboardBoundariesBanner } from "./DashboardBoundariesBanner";
import { CollapsiblePanel } from "./CollapsiblePanel";

type Props = {
  variant: "coordinator" | "initiator";
  draft: CoordinatorScopeFilters;
  onDraftChange: (next: CoordinatorScopeFilters) => void;
  onApply: () => void;
  applying?: boolean;
  boundaries: DashboardBoundaries | null;
  viewLabel: string;
  defaultExpanded?: boolean;
};

function scopeCollapsedSummary(boundaries: DashboardBoundaries | null): string {
  if (!boundaries) {
    return "Time window and geographic area";
  }
  return `${boundaries.timeLabel} · ${boundaries.areaLabel}`;
}

/** Scope filters + data boundaries — collapsible so Actions content keeps room. */
export function DashboardScopePanel({
  variant,
  draft,
  onDraftChange,
  onApply,
  applying = false,
  boundaries,
  viewLabel,
  defaultExpanded = true
}: Props) {
  return (
    <CollapsiblePanel
      title="Scope & filters"
      collapsedSummary={scopeCollapsedSummary(boundaries)}
      defaultExpanded={defaultExpanded}
      storageKey="dashboard-scope"
      className="dashboard-scope-panel"
      ariaLabel="Dashboard scope and filters"
    >
      <CoordinatorScopeToolbar
        variant={variant}
        draft={draft}
        onDraftChange={onDraftChange}
        onApply={onApply}
        applying={applying}
      />
      <DashboardBoundariesBanner boundaries={boundaries} viewLabel={viewLabel} />
    </CollapsiblePanel>
  );
}
