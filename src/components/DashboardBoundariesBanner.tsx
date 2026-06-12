import type { DashboardBoundaries } from "../feedScope";

type Props = {
  boundaries: DashboardBoundaries | null;
  viewLabel?: string;
};

export function DashboardBoundariesBanner({ boundaries, viewLabel }: Props) {
  if (!boundaries) {
    return null;
  }

  const title = viewLabel
    ? `Data boundaries — ${viewLabel}`
    : "Data boundaries";

  return (
    <section
      className="dashboard-boundaries"
      aria-label="Dashboard data capture boundaries"
    >
      <p className="dashboard-boundaries-title">{title}</p>
      <dl className="dashboard-boundaries-grid">
        <div>
          <dt>Time</dt>
          <dd>{boundaries.timeLabel}</dd>
        </div>
        <div>
          <dt>Area</dt>
          <dd>{boundaries.areaLabel}</dd>
        </div>
        <div>
          <dt>Sort</dt>
          <dd>{boundaries.sortLabel}</dd>
        </div>
        <div>
          <dt>Limit</dt>
          <dd>{boundaries.maxRowsLabel}</dd>
        </div>
      </dl>
    </section>
  );
}
