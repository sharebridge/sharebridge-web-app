import {
  COORDINATOR_AREA_OPTIONS,
  COORDINATOR_SINCE_OPTIONS,
  DEFAULT_COORDINATOR_SCOPE,
  normalizeLocalityKey,
  type CoordinatorAreaMode,
  type CoordinatorScopeFilters,
  type CoordinatorSincePreset
} from "../coordinatorScope";

type Props = {
  draft: CoordinatorScopeFilters;
  onDraftChange: (next: CoordinatorScopeFilters) => void;
  onApply: () => void;
  applying?: boolean;
  variant?: "coordinator" | "initiator";
};

export function CoordinatorScopeToolbar({
  draft,
  onDraftChange,
  onApply,
  applying = false,
  variant = "coordinator"
}: Props) {
  const leadCopy =
    variant === "initiator"
      ? "Choose the time window and area for Initiations, Actions, and Map — then tap Apply scope."
      : "Choose the time window and geographic boundaries for List, Map, and Demand views.";

  return (
    <section
      className="coordinator-scope-toolbar"
      aria-label={
        variant === "initiator"
          ? "Initiator dashboard scope"
          : "Coordinator dashboard scope"
      }
    >
      <p className="coordinator-scope-lead">{leadCopy}</p>
      <div className="coordinator-scope-fields">
        <label className="coordinator-scope-field">
          <span>Time window</span>
          <select
            value={draft.since}
            onChange={(event) =>
              onDraftChange({
                ...draft,
                since: event.target.value as CoordinatorSincePreset
              })
            }
          >
            {COORDINATOR_SINCE_OPTIONS.map((option) => (
              <option key={option.value || "all"} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="coordinator-scope-field">
          <span>Area</span>
          <select
            value={draft.areaMode}
            onChange={(event) =>
              onDraftChange({
                ...draft,
                areaMode: event.target.value as CoordinatorAreaMode
              })
            }
          >
            {COORDINATOR_AREA_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        {draft.areaMode === "locality" ? (
          <label className="coordinator-scope-field coordinator-scope-locality">
            <span>Postal key (e.g. IN:TN:600001)</span>
            <input
              type="text"
              value={draft.localityKey}
              placeholder="IN:TN:600001"
              onChange={(event) =>
                onDraftChange({
                  ...draft,
                  localityKey: normalizeLocalityKey(event.target.value)
                })
              }
            />
          </label>
        ) : null}

        <div className="coordinator-scope-actions">
          <button
            type="button"
            className="coordinator-scope-apply"
            onClick={onApply}
            disabled={applying}
          >
            {applying ? "Applying…" : "Apply scope"}
          </button>
          <button
            type="button"
            className="coordinator-scope-reset"
            onClick={() => onDraftChange({ ...DEFAULT_COORDINATOR_SCOPE })}
          >
            Reset
          </button>
        </div>
      </div>
    </section>
  );
}
