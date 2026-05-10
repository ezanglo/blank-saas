import { describe, expect, it } from "vitest";

import { headersToWebRequestHeaders } from "./headers";

describe("headersToWebRequestHeaders", () => {
  it("copies entries into a Web Headers instance", () => {
    const mockHeaders = {
      forEach(fn: (value: string, name: string) => void) {
        fn("application/json", "content-type");
        fn("no", "x-custom");
      },
    };
    const out = headersToWebRequestHeaders(mockHeaders);
    expect(out.get("content-type")).toBe("application/json");
    expect(out.get("x-custom")).toBe("no");
  });
});
