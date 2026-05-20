/** Optional shapes for Google Identity Services loaded from accounts.google.com/gsi/client */
export {};

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          disableAutoSelect?: () => void;
          revoke?: (
            hint: string,
            callback: (done: { successful?: boolean; error?: string }) => void
          ) => void;
        };
      };
    };
  }
}
