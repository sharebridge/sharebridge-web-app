import { describe, expect, it } from "vitest";
import { getAppConfig, integrationHost } from "./config";

describe("getAppConfig", () => {
  it("defaults to modheader auth mode", () => {
    const config = getAppConfig();
    expect(config.authMode).toBe("modheader");
    expect(config.userId).toBeTruthy();
    expect(config.apiBaseUrl).toMatch(/^https?:\/\//);
  });

  it("integrationHost parses API base URL", () => {
    const config = getAppConfig();
    expect(integrationHost(config)).toContain(".");
  });
});
