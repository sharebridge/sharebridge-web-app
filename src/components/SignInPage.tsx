import { useRef, useState } from "react";
import { GoogleLogin, googleLogout } from "@react-oauth/google";
import { clearSession } from "../authSession";
import { signInWithGoogle } from "../api/auth";
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
  const googleButtonHostRef = useRef<HTMLDivElement>(null);

  function mapError(err: unknown) {
    if (err instanceof ApiError) {
      setError(formatSignInError(err, config));
    } else if (err instanceof Error) {
      setError(err.message);
    } else {
      setError("Could not sign in.");
    }
  }

  async function completeIdTokenSignIn(idToken: string) {
    setSubmitting(true);
    setError(null);
    try {
      const result = await signInWithGoogle(
        config.userServiceBaseUrl,
        idToken
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
    const host = googleButtonHostRef.current;
    const googleButton =
      host?.querySelector<HTMLElement>('[role="button"]') ??
      host?.querySelector<HTMLElement>("div");
    googleButton?.click();
  }

  return (
    <section className="sign-in-card panel">
      <h1>Sign in</h1>
      <p className="sign-in-lede">
        Coordinators see full order details. Initiators see a limited neighbourhood
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
          <div
            ref={googleButtonHostRef}
            className="sign-in-google-picker"
            aria-hidden="true"
          >
            <GoogleLogin
              onSuccess={(credentialResponse) => {
                const idToken = credentialResponse.credential?.trim();
                if (!idToken) {
                  setError("Google did not return an id token.");
                  return;
                }
                void completeIdTokenSignIn(idToken);
              }}
              onError={() => setError("Google sign-in was cancelled or failed.")}
              useOneTap={false}
              auto_select={false}
              theme="outline"
              size="large"
              text="signin_with"
            />
          </div>
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
