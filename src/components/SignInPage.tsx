import { useState, type FormEvent } from "react";
import { GoogleLogin, googleLogout } from "@react-oauth/google";
import { clearSession } from "../authSession";
import { mintDevCoordinatorToken, signInWithGoogle } from "../api/auth";
import { ApiError } from "../api/orderIntents";
import { sessionFromSignIn, type AuthSession } from "../authSession";
import type { AppConfig } from "../config";

type Props = {
  config: AppConfig;
  onSignedIn: (session: AuthSession) => void;
};

function SignInCard({ config, onSignedIn }: Props) {
  const [userId, setUserId] = useState(config.defaultUserId);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function mapError(err: unknown) {
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
  }

  async function handleDevSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = userId.trim();
    if (!trimmed) {
      setError("Enter a coordinator user id for dev sign-in.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const result = await mintDevCoordinatorToken(
        config.userServiceBaseUrl,
        trimmed
      );
      onSignedIn(sessionFromSignIn(result));
    } catch (err) {
      mapError(err);
    } finally {
      setSubmitting(false);
    }
  }

  const hasGoogle = config.googleClientId.length > 0;

  return (
    <section className="sign-in-card panel">
      <p className="hero-eyebrow">SharingBridge</p>
      <h1>Coordinator sign in</h1>
      <p className="sign-in-lede">
        Sign in with a Google account listed in the coordinator allowlist
        (user-service <code>data/coordinators.json</code>). Donors use the
        mobile app.
      </p>

      {hasGoogle ? (
        <div className="sign-in-google">
          <p className="hint sign-in-google-hint">
            In a normal browser window, your coordinator session is kept until you
            sign out or the token expires (about one hour), including after you
            refresh or reopen this site in the same browser. Chrome may pre-select
            your last Google account on the button—that helps the same person sign
            back in quickly. Use <strong>Use a different Google account</strong>{" "}
            only when another coordinator needs to sign in on this device.
          </p>
          <GoogleLogin
            onSuccess={(credentialResponse) => {
              const idToken = credentialResponse.credential;
              if (!idToken) {
                setError("Google did not return a credential.");
                return;
              }
              setSubmitting(true);
              setError(null);
              void signInWithGoogle(config.userServiceBaseUrl, idToken)
                .then((result) => onSignedIn(sessionFromSignIn(result)))
                .catch(mapError)
                .finally(() => setSubmitting(false));
            }}
            onError={() => setError("Google sign-in was cancelled or failed.")}
            useOneTap={false}
            theme="outline"
            size="large"
            shape="rectangular"
            text="signin_with"
            width="320"
          />
          <button
            type="button"
            className="btn btn-ghost btn-block sign-in-switch-account"
            disabled={submitting}
            onClick={() => {
              clearSession();
              googleLogout();
              setError(null);
            }}
          >
            Use a different Google account
          </button>
        </div>
      ) : (
        <div className="banner banner-error" role="alert">
          Set <code>VITE_GOOGLE_CLIENT_ID</code> in <code>.env</code> for Google
          sign-in.
        </div>
      )}

      {config.allowDevSignIn ? (
        <form className="form dev-sign-in-form" onSubmit={(e) => void handleDevSubmit(e)}>
          <p className="hint">Local dev only (requires ALLOW_DEV_TOKEN_MINT on user-service)</p>
          <label>
            Dev coordinator user id
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="demo-coordinator"
            />
          </label>
          <button
            type="submit"
            className="btn btn-secondary btn-block"
            disabled={submitting}
          >
            {submitting ? "Signing in…" : "Dev sign in"}
          </button>
        </form>
      ) : null}

      {error ? (
        <div className="banner banner-error" role="alert">
          {error}
        </div>
      ) : null}

      <p className="hint sign-in-hint">
        Closing every tab for this site clears the stored session; signing in again
        reuses your Google account when Chrome remembers it.
      </p>
    </section>
  );
}

export function SignInPage({ config, onSignedIn }: Props) {
  return (
    <div className="site sign-in-site">
      <main className="sign-in-main">
        <SignInCard config={config} onSignedIn={onSignedIn} />
      </main>
    </div>
  );
}
