import { useState } from "react";
import { googleLogout, useGoogleLogin } from "@react-oauth/google";
import { clearSession } from "../authSession";
import { signInWithGoogleAccessToken } from "../api/auth";
import { ApiError } from "../api/orderIntents";
import { sessionFromSignIn, type AuthSession } from "../authSession";
import type { AppConfig } from "../config";
import { formatSignInError } from "./signInErrors";

type Props = {
  config: AppConfig;
  onSignedIn: (session: AuthSession) => void;
};

function SignInCard({ config, onSignedIn }: Props) {
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
      <h1>Sign in</h1>
      <p className="sign-in-lede">
        Coordinators see full order details. Donors see a limited neighbourhood
        feed (time window and distance are set on the server and shown after
        sign-in).
      </p>

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
