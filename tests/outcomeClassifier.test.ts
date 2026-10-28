import { describe, expect, it } from "vitest";
import { CallResultInput } from "../src/domain/types";
import { classifyOutcome } from "../src/services/outcomeClassifier";

const complete: Pick<
  CallResultInput,
  "preferredCity" | "genderPreference" | "monthlyBudgetInr" | "moveInDate" | "stayDuration"
> = {
  preferredCity: { value: "Gurgaon", status: "confirmed" },
  genderPreference: { value: "any", status: "confirmed" },
  monthlyBudgetInr: { amount: 18000, isApproximate: true, status: "provided" },
  moveInDate: { isoDate: null, statedText: "around April", status: "tentative" },
  stayDuration: { months: null, statedText: null, status: "unknown" },
};

describe("outcome classifier", () => {
  it.each([
    ["wrong_number", "wrong_number"],
    ["not_interested", "not_interested"],
    ["busy", "busy"],
    ["callback_requested", "callback_requested"],
    ["no_answer", "no_answer"],
    ["voicemail", "voicemail"],
    ["disconnected", "disconnected"],
  ] as const)("keeps %s ahead of qualification completion", (reported, expected) => {
    expect(classifyOutcome(reported, complete).outcome).toBe(expected);
  });

  it("accepts a completed qualification with captured, tentative, and explicitly unknown fields", () => {
    expect(classifyOutcome("completed", complete)).toMatchObject({ outcome: "completed" });
  });

  it("downgrades completed when a required field has neither a value nor unknown status", () => {
    const incomplete = { ...complete, preferredCity: { value: null, status: "provided" as const } };
    expect(classifyOutcome("completed", incomplete)).toMatchObject({
      outcome: "partial",
      reasons: [expect.stringContaining("city")],
    });
  });

  it("does not promote an explicitly partial report", () => {
    expect(classifyOutcome("partial", complete).outcome).toBe("partial");
  });
});
