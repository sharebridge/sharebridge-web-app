import { describe, expect, it, vi } from "vitest";
import { subscribeMediaQuery } from "./mediaQuery";

describe("subscribeMediaQuery", () => {
  it("uses addEventListener when available", () => {
    const media = {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    } as unknown as MediaQueryList;
    const handler = vi.fn();
    const unsubscribe = subscribeMediaQuery(media, handler);
    expect(media.addEventListener).toHaveBeenCalledWith("change", handler);
    unsubscribe();
    expect(media.removeEventListener).toHaveBeenCalledWith("change", handler);
  });

  it("falls back to addListener on old browsers", () => {
    const media = {
      addListener: vi.fn(),
      removeListener: vi.fn()
    } as unknown as MediaQueryList;
    const handler = vi.fn();
    const unsubscribe = subscribeMediaQuery(media, handler);
    expect(media.addListener).toHaveBeenCalled();
    unsubscribe();
    expect(media.removeListener).toHaveBeenCalled();
  });
});
