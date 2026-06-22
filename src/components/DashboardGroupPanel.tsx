import type { OrderGroupMode } from "../groupOrderIntents";
import { CollapsiblePanel } from "./CollapsiblePanel";
import { GroupModeToolbar } from "./GroupModeToolbar";

type Props = {
  coordinatorView: boolean;
  groupMode: OrderGroupMode;
  areaLoading: boolean;
  onSelect: (mode: OrderGroupMode) => void;
  defaultExpanded?: boolean;
};

function groupModeLabel(mode: OrderGroupMode): string {
  switch (mode) {
    case "initiator":
      return "By initiator";
    case "locality":
      return "By area";
    default:
      return "By day";
  }
}

export function DashboardGroupPanel({
  coordinatorView,
  groupMode,
  areaLoading,
  onSelect,
  defaultExpanded = false
}: Props) {
  return (
    <CollapsiblePanel
      title="Group initiations"
      collapsedSummary={groupModeLabel(groupMode)}
      defaultExpanded={defaultExpanded}
      storageKey="dashboard-initiations-group"
      className="dashboard-group-panel"
      ariaLabel="How to group initiations"
    >
      <GroupModeToolbar
        coordinatorView={coordinatorView}
        groupMode={groupMode}
        areaLoading={areaLoading}
        onSelect={onSelect}
      />
    </CollapsiblePanel>
  );
}
