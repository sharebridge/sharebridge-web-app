import { useState } from "react";
import {
  googleLogout,
  useGoogleLogin,
  useGoogleOAuth
} from "@react-oauth/google";
import { clearSession } from "../authSession";
import { signInWithGoogleAccessToken } from "../api/auth";
import { ApiError } from "../api/orderIntents";
import { sessionFromSignIn, type AuthSession } from "../authSession";
import type { AppConfig } from "../config";
import { GITHUB_README_URL } from "../docsLinks";
import { formatSignInError } from "./signInErrors";
import { HelpDialog } from "./HelpDialog";

type Props = {
  config: AppConfig;
  onSignedIn: (session: AuthSession) => void;
};

type GoogleSignInButtonProps = {
  config: AppConfig;
  onSignedIn: (session: AuthSession) => void;
  onError: (message: string) => void;
};

/** Must render under GoogleOAuthProvider (see App.tsx). */
function GoogleSignInButton({
  config,
  onSignedIn,
  onError
}: GoogleSignInButtonProps) {
  const [submitting, setSubmitting] = useState(false);
  const { scriptLoadedSuccessfully } = useGoogleOAuth();

  const pickGoogleAccount = useGoogleLogin({
    flow: "implicit",
    scope: "openid email profile",
    prompt: "select_account",
    onSuccess: (tokenResponse) => {
      const accessToken = tokenResponse.access_token?.trim();
      if (!accessToken) {
        onError("Google did not return an access token.");
        return;
      }
      void completeAccessTokenSignIn(accessToken);
    },
    onError: () => onError("Google sign-in was cancelled or failed."),
    onNonOAuthError: (nonOAuthError) => {
      if (nonOAuthError.type === "popup_failed_to_open") {
        onError("Allow pop-ups for this site to sign in with Google.");
        return;
      }
      if (nonOAuthError.type === "popup_closed") {
        onError("Google sign-in was cancelled.");
        return;
      }
      onError("Google sign-in could not start.");
    }
  });

  async function completeAccessTokenSignIn(accessToken: string) {
    setSubmitting(true);
    onError("");
    try {
      const result = await signInWithGoogleAccessToken(
        config.userServiceBaseUrl,
        accessToken
      );
      onSignedIn(sessionFromSignIn(result));
    } catch (err) {
      if (err instanceof ApiError) {
        onError(formatSignInError(err, config));
      } else if (err instanceof Error) {
        onError(err.message);
      } else {
        onError("Could not sign in.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  function handleGoogleSignIn() {
    onError("");
    clearSession();
    try {
      window.google?.accounts?.id?.disableAutoSelect?.();
    } catch {
      /* ignore */
    }
    googleLogout();
    if (!scriptLoadedSuccessfully) {
      onError("Google sign-in is still loading. Wait a moment and try again.");
      return;
    }
    pickGoogleAccount({ prompt: "select_account" });
  }

  return (
    <div className="sign-in-google">
      <button
        type="button"
        className="btn btn-secondary btn-block sign-in-google-btn"
        disabled={submitting || !scriptLoadedSuccessfully}
        onClick={handleGoogleSignIn}
      >
        {submitting
          ? "Signing in…"
          : scriptLoadedSuccessfully
            ? "Sign in with Google"
            : "Loading Google sign-in…"}
      </button>
      <p className="hint sign-in-google-hint">
        Opens Google&apos;s account picker (not the browser default account only).
      </p>
    </div>
  );
}

function SignInCard({ config, onSignedIn }: Props) {
  const [error, setError] = useState<string | null>(null);
  const hasGoogle = config.googleClientId.length > 0;

  return (
    <section className="sign-in-card panel">
      <h1>Sign in</h1>
      <p className="sign-in-lede">
        Coordinators see full order details. Initiators see a limited neighbourhood
        feed (time window and distance are set on the server and shown after
        sign-in).
      </p>

      {hasGoogle ? (
        <GoogleSignInButton
          config={config}
          onSignedIn={onSignedIn}
          onError={(message) => setError(message.trim() ? message : null)}
        />
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

      <p className="sign-in-docs">
        New here or curious how it is built?{" "}
        <a
          href={GITHUB_README_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          Read the GitHub README
        </a>
        .
      </p>
    </section>
  );
}

export function SignInPage({ config, onSignedIn }: Props) {
  const [helpOpen, setHelpOpen] = useState(false);

  return (
    <div className="site sign-in-site">
      <header className="sign-in-topbar">
        <div className="sign-in-topbar-brand">
          <span className="brand-mark" aria-hidden>
            SB
          </span>
          <span className="brand-name">SharingBridge</span>
        </div>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => setHelpOpen(true)}
        >
          Help
        </button>
      </header>
      <main className="sign-in-main">
        <SignInCard config={config} onSignedIn={onSignedIn} />
      </main>
      {helpOpen ? <HelpDialog onClose={() => setHelpOpen(false)} /> : null}
    </div>
  );
}
