import type { AuthSession } from "../authSession";
import { sessionHeaderLabel } from "../sessionRole";

export type DashboardKind = "coordinator" | "donor";

const COPY: Record<DashboardKind, { eyebrow: string; roleLabel: string }> = {
  coordinator: {
    eyebrow: "Coordinator dashboard",
    roleLabel: "Coordinator"
  },
  donor: {
    eyebrow: "Donor dashboard (limited)",
    roleLabel: "Donor"
  }
};

type Props = {
  kind: DashboardKind;
  session: AuthSession;
  initiationCount: number;
  /** From API after load — describes the applied time/area window. */
  feedLede?: string;
};

/** Shared green banner header for coordinator and donor dashboards (same DOM + CSS). */
export function DashboardHero({
  kind,
  session,
  initiationCount,
  feedLede
}: Props) {
  const { eyebrow, roleLabel } = COPY[kind];
  const signedIn = sessionHeaderLabel(session);
  const countLabel =
    initiationCount === 1 ? "initiation" : "initiations";

  return (
    <section className="hero">
      <p className="hero-eyebrow">{eyebrow}</p>
      <div className="hero-headline-row">
        <h1>Order initiation history</h1>
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
