import { GITHUB_README_URL } from "../docsLinks";

type Props = {
  onClose: () => void;
};

export function HelpDialog({ onClose }: Props) {
  return (
    <div
      className="dialog-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="help-dialog-title"
    >
      <div className="dialog-card help-dialog-card">
        <h2 id="help-dialog-title">How SharingBridge works</h2>
        <p className="help-dialog-lede">
          SharingBridge coordinates meal arrangements. Payments stay with
          vendors — the platform tracks intent, handover, and kitchen
          commitments, not card charges.
        </p>
        <ul className="help-dialog-list">
          <li>
            <strong>Initiations</strong> — order intents and neighbourhood
            activity for the signed-in role.
          </li>
          <li>
            <strong>Actions</strong> — demand board, pledges, and eco-kitchen
            commitments (coordinator).
          </li>
          <li>
            <strong>Map</strong> — geo view of initiations and seeker demands
            when Maps is configured.
          </li>
          <li>
            <strong>Connection</strong> — look up an order code after a kitchen
            commits, so parties can complete off-platform payment.
          </li>
          <li>
            <strong>Mobile app</strong> — initiators register Help a seeker /
            eco-kitchen flows; the web dashboard is for ops and neighbourhood
            views.
          </li>
        </ul>
        <p className="help-dialog-docs">
          Technical overview, architecture, and how to run the stack:{" "}
          <a
            href={GITHUB_README_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub README
          </a>
          .
        </p>
        <div className="dialog-actions">
          <button type="button" className="btn btn-primary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
