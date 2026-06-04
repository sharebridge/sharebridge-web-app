import type { OrderGroupMode } from "../groupOrderIntents";

type Props = {
  coordinatorView: boolean;
  groupMode: OrderGroupMode;
  areaLoading: boolean;
  onSelect: (mode: OrderGroupMode) => void;
};

/** Day / area (and coordinator: donor) controls — always shown for donor dashboard. */
export function GroupModeToolbar({
  coordinatorView,
  groupMode,
  areaLoading,
  onSelect
}: Props) {
  return (
    <div
      className="feed-toolbar"
      role="region"
      aria-label="How to group the feed"
    >
      <p className="feed-toolbar-label">View by</p>
      <div
        className="group-mode-toggle"
        role="group"
        aria-label="Group order initiations"
      >
        {coordinatorView ? (
          <button
            type="button"
            className={
              groupMode === "donor"
                ? "group-mode-btn active"
                : "group-mode-btn"
            }
            onClick={() => onSelect("donor")}
          >
            By donor
          </button>
        ) : null}
        <button
          type="button"
          className={
            groupMode === "day" ? "group-mode-btn active" : "group-mode-btn"
          }
          onClick={() => onSelect("day")}
        >
          By day
        </button>
        <button
          type="button"
          className={
            groupMode === "locality"
              ? "group-mode-btn active"
              : "group-mode-btn"
          }
          disabled={areaLoading}
          onClick={() => onSelect("locality")}
        >
          {areaLoading ? "By area…" : "By area"}
        </button>
      </div>
    </div>
  );
}
