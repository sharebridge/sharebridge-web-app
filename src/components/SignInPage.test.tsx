/** @vitest-environment jsdom */

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GITHUB_README_URL } from "../docsLinks";
import { SignInPage } from "./SignInPage";
import type { AppConfig } from "../config";

const pickGoogleAccount = vi.fn();

vi.mock("@react-oauth/google", () => ({
  googleLogout: vi.fn(),
  useGoogleOAuth: () => ({
    clientId: "test-client-id",
    scriptLoadedSuccessfully: true
  }),
  useGoogleLogin: vi.fn(() => pickGoogleAccount)
}));

const baseConfig: AppConfig = {
  apiBaseUrl: "http://localhost:3001",
  userServiceBaseUrl: "http://localhost:3000",
  googleClientId: "test-client-id",
  googleMapsApiKey: ""
};

describe("SignInPage", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    pickGoogleAccount.mockClear();
  });

  afterEach(() => {
    cleanup();
  });

  it("shows title, Google sign-in, README link, and Help", async () => {
    render(<SignInPage config={baseConfig} onSignedIn={vi.fn()} />);

    expect(screen.getByRole("heading", { name: /^sign in$/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /sign in with google/i })).toBeTruthy();
    expect(screen.queryByText(/last signed in as/i)).toBeNull();
    expect(screen.queryByText(/coordinator role/i)).toBeNull();

    const readme = screen.getByRole("link", { name: /read the github readme/i });
    expect(readme.getAttribute("href")).toBe(GITHUB_README_URL);

    screen.getByRole("button", { name: /^help$/i }).click();
    expect(
      screen.getByRole("heading", { name: /how sharingbridge works/i })
    ).toBeTruthy();

    await screen.getByRole("button", { name: /sign in with google/i }).click();
    expect(pickGoogleAccount).toHaveBeenCalledWith({ prompt: "select_account" });
  });
});
