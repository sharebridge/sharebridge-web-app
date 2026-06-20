import {
  PLEDGE_EMAIL_CONSENT_COPY,
  readPledgeEmailConsent,
  writePledgeEmailConsent
} from "../connectionConsent";
import { CollapsiblePanel } from "./CollapsiblePanel";

type Props = {
  checked: boolean;
  onChange: (accepted: boolean) => void;
};

/** Upfront consent before pledging on the Actions tab. */
export function ConnectionEmailConsent({ checked, onChange }: Props) {
  const { heading, body, bullets, checkbox } = PLEDGE_EMAIL_CONSENT_COPY;
  const collapsedSummary = checked
    ? "Consent accepted — login email may be shared for pledges and kitchen commits"
    : "Required before pledging — review email sharing terms";

  return (
    <CollapsiblePanel
      title={heading}
      collapsedSummary={collapsedSummary}
      highlightCollapsed={!checked}
      defaultExpanded={!checked}
      storageKey="actions-email-consent"
      className="connection-consent"
      ariaLabel="Email sharing consent"
    >
      <p className="panel-lede">{body}</p>
      <ul className="connection-consent-list">
        {bullets.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
      <label className="connection-consent-check">
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => {
            const next = event.target.checked;
            writePledgeEmailConsent(next);
            onChange(next);
          }}
        />
        {checkbox}
      </label>
    </CollapsiblePanel>
  );
}

/** Hydrate consent from sessionStorage on Actions tab mount. */
export function initialPledgeConsentState(): boolean {
  return readPledgeEmailConsent();
}
