/** @vitest-environment jsdom */

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SignInPage } from "./SignInPage";
import type { AppConfig } from "../config";

vi.mock("@react-oauth/google", () => ({
  googleLogout: vi.fn(),
  GoogleLogin: () => <div data-testid="google-login-picker" />
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
  });

  afterEach(() => {
    cleanup();
  });

  it("shows title and Google sign-in only", () => {
    render(<SignInPage config={baseConfig} onSignedIn={vi.fn()} />);

    expect(screen.getByRole("heading", { name: /^sign in$/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /sign in with google/i })).toBeTruthy();
    expect(screen.getByTestId("google-login-picker")).toBeTruthy();
    expect(screen.queryByText(/last signed in as/i)).toBeNull();
    expect(screen.queryByText(/coordinator role/i)).toBeNull();
  });
});
