const WEB_BYPASS_ALIASES = [
  "VITE_BYPASS_GOOGLE_SIGN_IN",
  "VITE_ALLOW_GOOGLE_SIGN_IN_BYPASS",
  "VITE_ALLOW_DEV_SIGN_IN"
] as const;

/** Local only: show sign-in without Google (pairs with user-service BYPASS_GOOGLE_SIGN_IN). */
export function googleSignInBypassEnabled(): boolean {
  return WEB_BYPASS_ALIASES.some(
    (key) => import.meta.env[key] === "true"
  );
}
