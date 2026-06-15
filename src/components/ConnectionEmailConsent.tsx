import {
  PLEDGE_EMAIL_CONSENT_COPY,
  readPledgeEmailConsent,
  writePledgeEmailConsent
} from "../connectionConsent";

type Props = {
  checked: boolean;
  onChange: (accepted: boolean) => void;
};

/** Upfront consent before pledging on the Actions tab. */
export function ConnectionEmailConsent({ checked, onChange }: Props) {
  const { heading, body, bullets, checkbox } = PLEDGE_EMAIL_CONSENT_COPY;

  return (
    <section
      className="connection-consent panel"
      role="region"
      aria-labelledby="connection-consent-heading"
    >
      <h3 id="connection-consent-heading">{heading}</h3>
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
    </section>
  );
}

/** Hydrate consent from sessionStorage on Actions tab mount. */
export function initialPledgeConsentState(): boolean {
  return readPledgeEmailConsent();
}
