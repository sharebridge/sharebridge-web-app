import { useState, type FormEvent } from "react";
import { googleLogout, useGoogleLogin } from "@react-oauth/google";
import { clearSession } from "../authSession";
import {
  mintDevCoordinatorToken,
  signInWithGoogleAccessToken
} from "../api/auth";
import { ApiError } from "../api/orderIntents";
import { sessionFromSignIn, type AuthSession } from "../authSession";
import type { AppConfig } from "../config";
import { formatSignInError } from "./signInErrors";

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
      setError(formatSignInError(err, config));
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

  async function handleBypassSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = userId.trim();
    if (!trimmed) {
      setError("Enter a coordinator user id.");
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

  const signInTitle = config.allowAnyUserWebDashboard
    ? "Sign in"
    : "Coordinator sign in";

  return (
    <section className="sign-in-card panel">
      <h1>{signInTitle}</h1>
      {config.allowAnyUserWebDashboard ? (
        <p className="sign-in-lede">
          MVP mode: any Google account that can use the mobile app can view the
          order dashboard here.
        </p>
      ) : null}

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
        </div>
      ) : (
        <div className="banner banner-error" role="alert">
          Set <code>VITE_GOOGLE_CLIENT_ID</code> in <code>.env</code> for Google
          sign-in.
        </div>
      )}

      {config.allowGoogleSignInBypass ? (
        <form
          className="form bypass-sign-in-form"
          onSubmit={(e) => void handleBypassSubmit(e)}
        >
          <p className="sign-in-lede">
            Local only: sign in with a user id instead of Google.
          </p>
          <label>
            Coordinator user id
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
            {submitting ? "Signing in…" : "Sign in without Google"}
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
