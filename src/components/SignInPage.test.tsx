/** @vitest-environment jsdom */

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { rememberLastGoogleEmailForGsiRevoke } from "../authSession";
import { SignInPage } from "./SignInPage";
import type { AppConfig } from "../config";

const pickGoogleAccount = vi.fn();

vi.mock("@react-oauth/google", () => ({
  googleLogout: vi.fn(),
  useGoogleLogin: vi.fn(() => pickGoogleAccount)
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
    pickGoogleAccount.mockClear();
  });

  afterEach(() => {
    cleanup();
  });

  it("shows account-picker sign-in on first visit", async () => {
    render(<SignInPage config={baseConfig} onSignedIn={vi.fn()} />);

    expect(screen.getByRole("heading", { name: /coordinator sign in/i })).toBeTruthy();
    expect(
      screen.getByText(/choose the gmail account in google/i)
    ).toBeTruthy();
    expect(screen.queryByText(/last signed in as/i)).toBeNull();

    await screen.getByRole("button", { name: /sign in with google/i }).click();
    expect(pickGoogleAccount).toHaveBeenCalledTimes(1);
  });

  it("shows last email hint after a prior coordinator sign-in", async () => {
    rememberLastGoogleEmailForGsiRevoke("coord@example.com");

    render(<SignInPage config={baseConfig} onSignedIn={vi.fn()} />);

    expect(screen.getByText(/last signed in as/i)).toBeTruthy();
    expect(screen.getByText("coord@example.com")).toBeTruthy();
    expect(screen.getByText(/use another account/i)).toBeTruthy();

    await screen.getByRole("button", { name: /sign in with google/i }).click();
    expect(pickGoogleAccount).toHaveBeenCalledTimes(1);
  });
});
