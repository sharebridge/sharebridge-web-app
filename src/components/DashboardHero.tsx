import type { AuthSession } from "../authSession";
import { sessionHeaderLabel } from "../sessionRole";

export type DashboardKind = "coordinator" | "initiator";

const COPY: Record<DashboardKind, { eyebrow: string; roleLabel: string }> = {
  coordinator: {
    eyebrow: "Coordinator dashboard",
    roleLabel: "Coordinator"
  },
  initiator: {
    eyebrow: "Initiator dashboard (limited)",
    roleLabel: "Initiator"
  }
};

type Props = {
  kind: DashboardKind;
  session: AuthSession;
  initiationCount: number;
  /** From API after load — describes the applied time/area window. */
  feedLede?: string;
  /** Slimmer padding when nested in a collapsible panel. */
  compact?: boolean;
};

/** Shared green banner header for coordinator and initiator dashboards (same DOM + CSS). */
export function DashboardHero({
  kind,
  session,
  initiationCount,
  feedLede,
  compact = false
}: Props) {
  const { eyebrow, roleLabel } = COPY[kind];
  const signedIn = sessionHeaderLabel(session);
  const countLabel =
    initiationCount === 1 ? "initiation" : "initiations";

  return (
    <section className={compact ? "hero hero-compact" : "hero"}>
      <p className="hero-eyebrow">{eyebrow}</p>
      <div className="hero-headline-row">
        <h1>Initiations</h1>
        <div className="hero-stats" aria-live="polite">
          <span className="hero-stat-pill">
            <span className="hero-stat-value">{initiationCount}</span>
            <span className="hero-stat-label">{countLabel}</span>
          </span>
          <span className="hero-stat-pill hero-stat-pill-role" title={signedIn}>
            <span className="hero-stat-label">{roleLabel}</span>
            <span className="hero-stat-value hero-stat-value-sm">{signedIn}</span>
          </span>
        </div>
      </div>
      {feedLede ? <p className="hero-lede">{feedLede}</p> : null}
    </section>
  );
}
