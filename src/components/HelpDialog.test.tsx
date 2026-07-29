/** @vitest-environment jsdom */

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GITHUB_README_URL } from "../docsLinks";
import { HelpDialog } from "./HelpDialog";

describe("HelpDialog", () => {
  afterEach(() => {
    cleanup();
  });

  it("summarizes portal areas and links to the GitHub README", () => {
    const onClose = vi.fn();
    render(<HelpDialog onClose={onClose} />);

    expect(
      screen.getByRole("heading", { name: /how sharingbridge works/i })
    ).toBeTruthy();
    expect(screen.getByText(/initiations/i)).toBeTruthy();
    expect(screen.getByText(/actions/i)).toBeTruthy();

    const readme = screen.getByRole("link", { name: /github readme/i });
    expect(readme.getAttribute("href")).toBe(GITHUB_README_URL);

    screen.getByRole("button", { name: /close/i }).click();
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
