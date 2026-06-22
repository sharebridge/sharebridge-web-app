import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  dashboardViewHref,
  isDashboardView,
  readDashboardViewFromHash
} from "./dashboardNavigation";

describe("dashboardNavigation", () => {
  const location = { hash: "" };

  beforeEach(() => {
    location.hash = "";
    vi.stubGlobal("window", { location });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("recognises dashboard views", () => {
    expect(isDashboardView("initiations")).toBe(true);
    expect(isDashboardView("actions")).toBe(true);
    expect(isDashboardView("map")).toBe(true);
    expect(isDashboardView("settings")).toBe(false);
  });

  it("reads hash routes", () => {
    window.location.hash = "#/actions";
    expect(readDashboardViewFromHash()).toBe("actions");
    window.location.hash = "#/map";
    expect(readDashboardViewFromHash()).toBe("map");
    window.location.hash = "";
    expect(readDashboardViewFromHash()).toBe("initiations");
  });

  it("builds hash hrefs", () => {
    expect(dashboardViewHref("initiations")).toBe("#/initiations");
    expect(dashboardViewHref("actions")).toBe("#/actions");
  });
});
