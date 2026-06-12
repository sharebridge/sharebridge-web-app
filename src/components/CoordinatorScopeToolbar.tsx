import {
  DEFAULT_COORDINATOR_SCOPE,
  type CoordinatorAreaMode,
  type CoordinatorScopeFilters,
  type CoordinatorSincePreset
} from "../coordinatorScope";

type Props = {
  draft: CoordinatorScopeFilters;
  onDraftChange: (next: CoordinatorScopeFilters) => void;
  onApply: () => void;
  applying?: boolean;
};

const SINCE_OPTIONS: { value: CoordinatorSincePreset; label: string }[] = [
  { value: "", label: "All time" },
  { value: "2h", label: "Last 2 hours" },
  { value: "24h", label: "Last 24 hours" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" }
];

const AREA_OPTIONS: { value: CoordinatorAreaMode; label: string }[] = [
  { value: "all", label: "All areas" },
  { value: "near", label: "Near my location" },
  { value: "locality", label: "Postal area key" }
];

export function CoordinatorScopeToolbar({
  draft,
  onDraftChange,
  onApply,
  applying = false
}: Props) {
  return (
    <section
      className="coordinator-scope-toolbar"
      aria-label="Coordinator dashboard scope"
    >
      <p className="coordinator-scope-lead">
        Choose the time window and geographic boundaries for List, Map, and
        Demand views.
      </p>
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
            {SINCE_OPTIONS.map((option) => (
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
            {AREA_OPTIONS.map((option) => (
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
                onDraftChange({ ...draft, localityKey: event.target.value })
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
