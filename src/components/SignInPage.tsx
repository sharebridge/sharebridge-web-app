import { useState, type FormEvent } from "react";
import { googleLogout, useGoogleLogin } from "@react-oauth/google";
import {
  clearSession,
  readLastGoogleEmailForGsiRevoke
} from "../authSession";
import {
  mintDevCoordinatorToken,
  signInWithGoogleAccessToken
} from "../api/auth";
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

  async function completeAccessTokenSignIn(accessToken: string) {
    setSubmitting(true);
    setError(null);
    try {
      const result = await signInWithGoogleAccessToken(
        config.userServiceBaseUrl,
        accessToken
      );
      onSignedIn(sessionFromSignIn(result));
    } catch (err) {
      mapError(err);
    } finally {
      setSubmitting(false);
    }
  }

  const pickGoogleAccount = useGoogleLogin({
    flow: "implicit",
    scope: "openid email profile",
    prompt: "select_account",
    onSuccess: (tokenResponse) => {
      const accessToken = tokenResponse.access_token?.trim();
      if (!accessToken) {
        setError("Google did not return an access token.");
        return;
      }
      void completeAccessTokenSignIn(accessToken);
    },
    onError: () => setError("Google sign-in was cancelled or failed.")
  });

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

  function handleGoogleSignIn() {
    setError(null);
    clearSession();
    try {
      window.google?.accounts?.id?.disableAutoSelect?.();
    } catch {
      /* ignore */
    }
    googleLogout();
    pickGoogleAccount();
  }

  return (
    <section className="sign-in-card panel">
      <h1>Coordinator sign in</h1>

      {returningCoordinator ? (
        <p className="sign-in-lede">
          Last signed in as <strong>{previousGoogleEmail}</strong>. Pick an account
          in Google&apos;s dialog — use <strong>Use another account</strong> to
          switch.
        </p>
      ) : (
        <p className="sign-in-lede">
          Sign in with a Google account that has the coordinator role in the database.
          You will choose the Gmail account in Google&apos;s dialog.
        </p>
      )}

      {hasGoogle ? (
        <div className="sign-in-google">
          <button
            type="button"
            className="btn btn-secondary btn-block sign-in-google-btn"
            disabled={submitting}
            onClick={handleGoogleSignIn}
          >
            {submitting ? "Signing in…" : "Sign in with Google"}
          </button>
          <p className="hint sign-in-google-hint">
            Opens Google&apos;s account picker (not the Chrome default account only).
          </p>
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
          <p className="hint">
            Local dev only (ALLOW_DEV_TOKEN_MINT on user-service). Optional pre-fill:
            VITE_DEFAULT_USER_ID in .env
          </p>
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
