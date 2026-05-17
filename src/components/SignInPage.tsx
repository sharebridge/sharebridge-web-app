import { useState, type FormEvent } from "react";
import { mintDonorToken } from "../api/auth";
import { ApiError } from "../api/orderIntents";
import { sessionFromToken, type AuthSession } from "../authSession";
import type { AppConfig } from "../config";

type Props = {
  config: AppConfig;
  onSignedIn: (session: AuthSession) => void;
};

export function SignInPage({ config, onSignedIn }: Props) {
  const [userId, setUserId] = useState(config.defaultUserId);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = userId.trim();
    if (!trimmed) {
      setError("Enter a donor user id.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const { token, userId: resolvedId } = await mintDonorToken(
        config.userServiceBaseUrl,
        trimmed
      );
      onSignedIn(sessionFromToken(resolvedId, token));
    } catch (err) {
      if (err instanceof ApiError) {
        const corsHint =
          err.status === 0 || err.message.includes("Failed to fetch")
            ? " Check WEB_CORS_ORIGINS on user-service includes this site origin."
            : "";
        setError(`${err.message}${corsHint}`);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Could not sign in.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="site sign-in-site">
      <main className="sign-in-main">
        <section className="sign-in-card panel">
          <p className="hero-eyebrow">SharingBridge</p>
          <h1>Sign in</h1>
          <p className="sign-in-lede">
            MVP donor sign-in uses your donor id. A short-lived session token is
            stored in this browser only — same flow mobile uses via
            user-service, without ModHeader or PowerShell.
          </p>

          <form className="form" onSubmit={(e) => void handleSubmit(e)}>
            <label>
              Donor user id
              <input
                type="text"
                required
                autoComplete="username"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="demo-user"
              />
            </label>
            {error ? (
              <div className="banner banner-error" role="alert">
                {error}
              </div>
            ) : null}
            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={submitting}
            >
              {submitting ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p className="hint sign-in-hint">
            OAuth and federated login are planned. Tokens expire in about one
            hour — sign in again when the dashboard asks.
          </p>
        </section>
      </main>
    </div>
  );
}
