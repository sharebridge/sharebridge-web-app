import { useState, type FormEvent } from "react";
import { GoogleLogin, googleLogout } from "@react-oauth/google";
import {
  clearLastGoogleEmailForGsiRevoke,
  clearSession,
  readLastGoogleEmailForGsiRevoke
} from "../authSession";
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
  const [googleButtonNonce, setGoogleButtonNonce] = useState(0);

  const previousGoogleEmail = readLastGoogleEmailForGsiRevoke();
  const returningCoordinator = Boolean(previousGoogleEmail);

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

  async function handleUseDifferentGoogleAccount() {
    if (!previousGoogleEmail) {
      return;
    }

    setSubmitting(true);
    setError(null);
    clearSession();
    googleLogout();

    const gsi = window.google?.accounts?.id;
    const revoke = gsi?.revoke;
    if (!revoke) {
      setSubmitting(false);
      setError(
        "Google sign-in is still loading. Wait a moment, then try again."
      );
      return;
    }

    await new Promise<void>((resolve) => {
      revoke(previousGoogleEmail, (done) => {
        if (done.successful) {
          clearLastGoogleEmailForGsiRevoke();
          googleLogout();
          window.location.reload();
        } else {
          setGoogleButtonNonce((n) => n + 1);
          setError(
            done.error?.trim() ||
              "Could not switch accounts here. Use Sign in with Google, then pick Use another account."
          );
        }
        resolve();
      });
    });
    setSubmitting(false);
  }

  return (
    <section className="sign-in-card panel">
      <h1>Coordinator sign in</h1>

      {returningCoordinator ? (
        <p className="sign-in-lede">
          Last signed in as <strong>{previousGoogleEmail}</strong>.
        </p>
      ) : (
        <p className="sign-in-lede">
          Sign in with a Google account on the coordinator allowlist.
        </p>
      )}

      {hasGoogle ? (
        <div className="sign-in-google">
          <div key={googleButtonNonce}>
            <GoogleLogin
              auto_select={false}
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
          </div>
          {returningCoordinator ? (
            <button
              type="button"
              className="btn btn-ghost btn-block sign-in-switch-account"
              disabled={submitting}
              onClick={() => void handleUseDifferentGoogleAccount()}
            >
              {submitting ? "Working…" : "Use a different Google account"}
            </button>
          ) : null}
        </div>
      ) : (
        <div className="banner banner-error" role="alert">
          Set <code>VITE_GOOGLE_CLIENT_ID</code> in <code>.env</code> for Google
          sign-in.
        </div>
      )}

      {config.allowDevSignIn ? (
        <form
          className="form dev-sign-in-form"
          onSubmit={(e) => void handleDevSubmit(e)}
        >
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
