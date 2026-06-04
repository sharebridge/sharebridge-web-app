import { describe, expect, it } from "vitest";
import { locationRequiredMessage } from "./viewerLocation";

describe("locationRequiredMessage", () => {
  it("mentions By area and permission for denied", () => {
    expect(locationRequiredMessage("denied")).toContain("By area");
    expect(locationRequiredMessage("denied")).toContain("Allow");
  });
});
