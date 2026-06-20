import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";

const EXPANDED_PREF_PREFIX = "sb_panel_expanded_";

function readExpandedPreference(
  storageKey: string | undefined,
  defaultExpanded: boolean
): boolean {
  if (!storageKey) {
    return defaultExpanded;
  }
  try {
    const raw = sessionStorage.getItem(`${EXPANDED_PREF_PREFIX}${storageKey}`);
    if (raw === "0") {
      return false;
    }
    if (raw === "1") {
      return true;
    }
  } catch {
    /* private mode */
  }
  return defaultExpanded;
}

function writeExpandedPreference(storageKey: string | undefined, expanded: boolean) {
  if (!storageKey) {
    return;
  }
  try {
    sessionStorage.setItem(
      `${EXPANDED_PREF_PREFIX}${storageKey}`,
      expanded ? "1" : "0"
    );
  } catch {
    /* ignore */
  }
}

type Props = {
  title: string;
  /** Shown beside the title when collapsed. */
  collapsedSummary?: string | null;
  /** Emphasize collapsed summary (e.g. action needed, new items). */
  highlightCollapsed?: boolean;
  /** When this value changes while collapsed, show a "New" badge until expanded. */
  arrivalSignature?: string | null;
  /** When this value changes, expand the panel (e.g. deep-link to Connection). */
  expandedRevision?: string | null;
  defaultExpanded?: boolean;
  /** Remember expand/collapse in sessionStorage for this browser tab session. */
  storageKey?: string;
  className?: string;
  bodyClassName?: string;
  ariaLabel?: string;
  children: ReactNode;
};

export function CollapsiblePanel({
  title,
  collapsedSummary,
  highlightCollapsed = false,
  arrivalSignature = null,
  expandedRevision = null,
  defaultExpanded = true,
  storageKey,
  className,
  bodyClassName,
  ariaLabel,
  children
}: Props) {
  const headingId = useId();
  const [expanded, setExpanded] = useState(() =>
    readExpandedPreference(storageKey, defaultExpanded)
  );
  const [hasNewArrival, setHasNewArrival] = useState(false);
  const lastArrivalRef = useRef<string | null>(null);

  useEffect(() => {
    const signature = arrivalSignature?.trim() || null;
    if (!signature) {
      lastArrivalRef.current = null;
      setHasNewArrival(false);
      return;
    }
    if (
      lastArrivalRef.current &&
      lastArrivalRef.current !== signature &&
      !expanded
    ) {
      setHasNewArrival(true);
    }
    lastArrivalRef.current = signature;
  }, [arrivalSignature, expanded]);

  useEffect(() => {
    const revision = expandedRevision?.trim();
    if (!revision) {
      return;
    }
    setExpanded(true);
    setHasNewArrival(false);
    writeExpandedPreference(storageKey, true);
  }, [expandedRevision, storageKey]);

  const toggle = useCallback(() => {
    setExpanded((prev) => {
      const next = !prev;
      writeExpandedPreference(storageKey, next);
      if (next) {
        setHasNewArrival(false);
      }
      return next;
    });
  }, [storageKey]);

  const showSummary =
    !expanded && Boolean(collapsedSummary?.trim());
  const showHighlight = showSummary && (highlightCollapsed || hasNewArrival);

  return (
    <section
      className={[
        "collapsible-panel",
        expanded ? "is-expanded" : "is-collapsed",
        className
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label={ariaLabel}
    >
      <button
        type="button"
        className="collapsible-panel-header"
        aria-expanded={expanded}
        aria-controls={`${headingId}-body`}
        onClick={toggle}
      >
        <span className="collapsible-panel-heading">
          <span className="collapsible-panel-title">{title}</span>
          {showSummary ? (
            <span
              className={
                showHighlight
                  ? "collapsible-panel-summary collapsible-panel-summary-highlight"
                  : "collapsible-panel-summary"
              }
            >
              {collapsedSummary}
            </span>
          ) : null}
          {hasNewArrival && !expanded ? (
            <span className="collapsible-panel-new">New</span>
          ) : null}
        </span>
        <span className="collapsible-panel-chevron" aria-hidden="true">
          {expanded ? "−" : "+"}
        </span>
      </button>
      {expanded ? (
        <div
          id={`${headingId}-body`}
          className={["collapsible-panel-body", bodyClassName]
            .filter(Boolean)
            .join(" ")}
        >
          {children}
        </div>
      ) : null}
    </section>
  );
}
