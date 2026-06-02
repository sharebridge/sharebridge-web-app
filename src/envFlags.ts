/** Local only: show sign-in without Google (pairs with user-service BYPASS_GOOGLE_SIGN_IN). */
export function googleSignInBypassEnabled(): boolean {
  return import.meta.env.VITE_BYPASS_GOOGLE_SIGN_IN === "true";
}
