import type { AuthSession } from "../authSession";
import { sessionHeaderLabel } from "../sessionRole";
import { CollapsiblePanel } from "./CollapsiblePanel";
import {
  DashboardHero,
  type DashboardKind
} from "./DashboardHero";

type Props = {
  kind: DashboardKind;
  session: AuthSession;
  initiationCount: number;
  feedLede?: string;
  defaultExpanded?: boolean;
};

function heroCollapsedSummary(
  kind: DashboardKind,
  session: AuthSession,
  initiationCount: number
): string {
  const roleLabel = kind === "coordinator" ? "Coordinator" : "Initiator";
  const countLabel =
    initiationCount === 1 ? "1 initiation" : `${initiationCount} initiations`;
  const signedIn = sessionHeaderLabel(session);
  return `${countLabel} · ${roleLabel} · ${signedIn}`;
}

/** Compact, collapsible replacement for the full-width hero on Initiations. */
export function DashboardHeroPanel({
  kind,
  session,
  initiationCount,
  feedLede,
  defaultExpanded = false
}: Props) {
  return (
    <CollapsiblePanel
      title="Initiations overview"
      collapsedSummary={heroCollapsedSummary(kind, session, initiationCount)}
      defaultExpanded={defaultExpanded}
      storageKey="dashboard-initiations-hero"
      className="dashboard-hero-panel"
      ariaLabel="Initiations overview"
    >
      <DashboardHero
        kind={kind}
        session={session}
        initiationCount={initiationCount}
        feedLede={feedLede}
        compact
      />
    </CollapsiblePanel>
  );
}
