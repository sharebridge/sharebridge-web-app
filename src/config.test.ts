import { describe, expect, it } from "vitest";
import { getAppConfig, integrationHost } from "./config";

describe("getAppConfig", () => {
  it("provides integration and user-service URLs", () => {
    const config = getAppConfig();
    expect(config.apiBaseUrl).toMatch(/^https?:\/\//);
    expect(config.userServiceBaseUrl).toMatch(/^https?:\/\//);
    expect(typeof config.defaultUserId).toBe("string");
  });

  it("integrationHost parses API base URL host", () => {
    const config = getAppConfig();
    const host = integrationHost(config);
    expect(host).toMatch(/^[\w.-]+(:\d+)?$/);
    expect(host).not.toContain("://");
  });
});
