/** @vitest-environment jsdom */

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { CollapsiblePanel } from "./CollapsiblePanel";

describe("CollapsiblePanel", () => {
  afterEach(() => {
    cleanup();
    sessionStorage.clear();
  });

  it("shows collapsed summary and toggles body", () => {
    render(
      <CollapsiblePanel
        title="Updates"
        collapsedSummary="2 updates · latest item"
        highlightCollapsed
        defaultExpanded={false}
        storageKey="test-panel"
      >
        <p>Panel body</p>
      </CollapsiblePanel>
    );

    expect(screen.getByText("2 updates · latest item")).toBeTruthy();
    expect(screen.queryByText("Panel body")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /updates/i }));
    expect(screen.getByText("Panel body")).toBeTruthy();
    expect(screen.queryByText("2 updates · latest item")).toBeNull();
  });
});
