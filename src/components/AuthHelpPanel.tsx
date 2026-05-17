import { integrationHost, type AppConfig } from "../config";

type Props = {
  config: AppConfig;
  open: boolean;
  onToggle: () => void;
};

export function AuthHelpPanel({ config, open, onToggle }: Props) {
  const host = integrationHost(config);

  return (
    <section className="auth-help">
      <button
        type="button"
        className="auth-help-toggle"
        onClick={onToggle}
        aria-expanded={open}
      >
        Authentication setup
        <span className="auth-help-chevron" aria-hidden>
          {open ? "▾" : "▸"}
        </span>
      </button>
      {open ? (
        <div className="auth-help-body">
          <p>
            This dashboard uses your browser to call{" "}
            <strong>{host}</strong>. Sign-in is a short-lived JWT from
            user-service — not entered on this page.
          </p>
          <h3>Recommended: ModHeader (or similar)</h3>
          <ol>
            <li>
              Install{" "}
              <a
                href="https://chromewebstore.google.com/detail/modheader/idgpnmonknjnojddfkpgkljpfnnfcklj"
                target="_blank"
                rel="noreferrer"
              >
                ModHeader
              </a>{" "}
              (Chrome/Edge) or an equivalent header extension.
            </li>
            <li>
              Add request header:{" "}
              <code>Authorization: Bearer &lt;your-jwt&gt;</code>
            </li>
            <li>
              Restrict to URL filter: <code>{host}</code> (optional but
              tidier).
            </li>
            <li>
              Mint JWT (PowerShell):{" "}
              <code>POST …/v1/auth/token</code> with{" "}
              <code>{`{"user_id":"${config.userId}"}`}</code>
            </li>
            <li>Reload this page and click <strong>Refresh</strong>.</li>
          </ol>
          <p className="auth-help-note">
            Integration-service must list this site in{" "}
            <code>WEB_CORS_ORIGINS</code> (see project docs). Tokens expire
            after about one hour — mint a new JWT and update ModHeader.
          </p>
          {config.authMode === "env" ? (
            <p className="auth-help-note auth-help-env">
              Local build uses <code>VITE_AUTH_MODE=env</code> and{" "}
              <code>VITE_AUTH_TOKEN</code> in <code>.env</code> (no ModHeader
              required).
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
