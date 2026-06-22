import type { DashboardBoundaries } from "../feedScope";
import {
  coordinatorScopeCollapsedSummary,
  type CoordinatorScopeFilters
} from "../coordinatorScope";
import { CoordinatorScopeToolbar } from "./CoordinatorScopeToolbar";
import { DashboardBoundariesBanner } from "./DashboardBoundariesBanner";
import { CollapsiblePanel } from "./CollapsiblePanel";

type Props = {
  variant: "coordinator" | "initiator";
  draft: CoordinatorScopeFilters;
  applied: CoordinatorScopeFilters;
  onDraftChange: (next: CoordinatorScopeFilters) => void;
  onApply: () => void;
  applying?: boolean;
  boundaries: DashboardBoundaries | null;
  viewLabel: string;
  defaultExpanded?: boolean;
};

/** Scope filters + data boundaries — collapsible so Actions content keeps room. */
export function DashboardScopePanel({
  variant,
  draft,
  applied,
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
      collapsedSummary={coordinatorScopeCollapsedSummary(applied)}
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
