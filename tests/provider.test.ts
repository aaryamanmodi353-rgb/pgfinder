import { describe, expect, it } from "vitest";
import { NotImplementedProvider } from "../src/services/callProvider";

describe("outbound provider boundary", () => {
  it("is disabled and refuses to place live calls", async () => {
    const provider = new NotImplementedProvider();
    expect(provider.enabled).toBe(false);
    await expect(provider.placeCall("+91 00000 00001", {})).rejects.toThrow(/disabled/);
  });
});
