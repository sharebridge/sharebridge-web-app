/** @vitest-environment jsdom */

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { rememberLastGoogleEmailForGsiRevoke } from "../authSession";
import { SignInPage } from "./SignInPage";
import type { AppConfig } from "../config";

vi.mock("@react-oauth/google", () => ({
  GoogleLogin: () => <div data-testid="google-login" />,
  googleLogout: vi.fn()
}));

const baseConfig: AppConfig = {
  apiBaseUrl: "http://localhost:3001",
  userServiceBaseUrl: "http://localhost:3000",
  googleClientId: "test-client-id",
  allowDevSignIn: false,
  defaultUserId: ""
};

describe("SignInPage", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it("shows minimal copy and hides switch account for first-time sign-in", () => {
    render(<SignInPage config={baseConfig} onSignedIn={vi.fn()} />);

    expect(screen.getByRole("heading", { name: /coordinator sign in/i })).toBeTruthy();
    expect(
      screen.getByText(/sign in with a google account on the coordinator allowlist/i)
    ).toBeTruthy();
    expect(screen.queryByRole("button", { name: /different google account/i })).toBeNull();
    expect(screen.queryByText(/last signed in as/i)).toBeNull();
  });

  it("shows last email and switch account after a prior coordinator sign-in", () => {
    rememberLastGoogleEmailForGsiRevoke("coord@example.com");

    render(<SignInPage config={baseConfig} onSignedIn={vi.fn()} />);

    expect(screen.getByText(/last signed in as/i)).toBeTruthy();
    expect(screen.getByText("coord@example.com")).toBeTruthy();
    expect(
      screen.getByRole("button", { name: /use a different google account/i })
    ).toBeTruthy();
    expect(
      screen.queryByText(/sign in with a google account on the coordinator allowlist/i)
    ).toBeNull();
  });
});
