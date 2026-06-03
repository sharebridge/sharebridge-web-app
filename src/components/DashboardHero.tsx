import type { AuthSession } from "../authSession";
import { sessionHeaderLabel } from "../sessionRole";

export type DashboardKind = "coordinator" | "donor";

const COPY: Record<
  DashboardKind,
  { eyebrow: string; roleLabel: string; lede?: string }
> = {
  coordinator: {
    eyebrow: "Coordinator dashboard",
    roleLabel: "Coordinator"
  },
  donor: {
    eyebrow: "Donor dashboard (limited)",
    roleLabel: "Donor",
    lede: "Neighbourhood feed in the last hour."
  }
};

type Props = {
  kind: DashboardKind;
  session: AuthSession;
  initiationCount: number;
};

/** Shared green banner header for coordinator and donor dashboards (same DOM + CSS). */
export function DashboardHero({ kind, session, initiationCount }: Props) {
  const { eyebrow, roleLabel, lede } = COPY[kind];
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
      {lede ? <p className="hero-lede">{lede}</p> : null}
    </section>
  );
}
