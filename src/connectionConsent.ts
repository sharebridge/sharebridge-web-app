/** Session key: user accepted email-sharing terms before pledging on Actions tab. */
export const PLEDGE_EMAIL_CONSENT_KEY = "sb_pledge_email_consent_v1";

export const PLEDGE_EMAIL_CONSENT_COPY = {
  heading: "Email sharing for eco kitchen fulfilment",
  body:
    "If an eco kitchen commits to fulfil this need, your SharingBridge login email " +
    "will be shown to that kitchen (and they to you) so you can coordinate payment " +
    "and delivery off-platform.",
  bullets: [
    "SharingBridge does not process payments.",
    "We do not send payment links or QR codes by email.",
    "Confirm the order code in the app before paying anyone."
  ],
  checkbox:
    "I understand my login email may be shared with the assigned eco kitchen for this pledge."
} as const;

export function readPledgeEmailConsent(): boolean {
  try {
    return sessionStorage.getItem(PLEDGE_EMAIL_CONSENT_KEY) === "1";
  } catch {
    return false;
  }
}

export function writePledgeEmailConsent(accepted: boolean): void {
  try {
    if (accepted) {
      sessionStorage.setItem(PLEDGE_EMAIL_CONSENT_KEY, "1");
    } else {
      sessionStorage.removeItem(PLEDGE_EMAIL_CONSENT_KEY);
    }
  } catch {
    /* ignore */
  }
}
