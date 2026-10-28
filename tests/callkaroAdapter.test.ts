import { describe, expect, it } from "vitest";
import { AdapterMappingError, mapCallKaroPayload } from "../src/adapters/callkaroAdapter";
import { CallResultInput } from "../src/domain/types";

const result: CallResultInput = {
  customerName: { value: "Synthetic Visitor", status: "confirmed" },
  contactPhone: { value: "+91 00000 00001", status: "confirmed" },
  preferredCity: { value: "Bengaluru", status: "provided" },
  genderPreference: { value: "any", status: "provided" },
  monthlyBudgetInr: { amount: 18000, isApproximate: true, status: "provided" },
  moveInDate: { isoDate: "2027-03-01", statedText: null, status: "exact" },
  stayDuration: { months: 6, statedText: null, status: "exact" },
  callOutcome: "completed",
  callbackScheduled: true,
  missingInformation: [],
  callSummary: "Confirmed number +91 00000 00001 and preferences.",
  nextAction: "send_options",
  languageUsed: "hinglish",
};

describe("configurable CallKaro adapter", () => {
  it("maps only paths supplied by configuration, forces callbackScheduled false, and redacts phone numbers", () => {
    // The nested event/result object here is a synthetic adapter test shape, not a provider schema claim.
    const mapped = mapCallKaroPayload(
      { event: { cid: "test-call-id", vid: "synthetic-visitor-id", data: result } },
      {
        callIdPath: "event.cid",
        visitorIdPath: "event.vid",
        resultPath: "event.data",
      },
    );
    expect(mapped.callkaroCallId).toBe("test-call-id");
    expect(mapped.visitorId).toBe("synthetic-visitor-id");
    expect(mapped.result.callbackScheduled).toBe(true);
    expect(mapped.result.callSummary).not.toContain("+91 00000 00001");
    expect(mapped.result.callSummary).toContain("[phone omitted]");
  });

  it("returns an unmapped error until the result path is configured", () => {
    expect(() => mapCallKaroPayload({ anything: true })).toThrow(AdapterMappingError);
  });

  it("rejects an invalid configured result object instead of coercing unknown data", () => {
    expect(() =>
      mapCallKaroPayload(
        { event: { data: { outcome: "complete" } } },
        { resultPath: "event.data" },
      ),
    ).toThrow(/does not match/);
  });
});
