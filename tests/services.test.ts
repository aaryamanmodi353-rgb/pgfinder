import { describe, expect, it } from "vitest";
import { CallResultInput, VisitorInput } from "../src/domain/types";
import { CallAttemptService } from "../src/services/callAttemptService";
import { ChecklistService } from "../src/services/checklistService";
import { classifyOutcome } from "../src/services/outcomeClassifier";
import { ResultService } from "../src/services/resultService";
import { ScenarioService } from "../src/services/scenarioService";
import { VisitorService } from "../src/services/visitorService";
import { MemoryStore } from "../src/repositories/memoryStore";

function resultInput(overrides: Partial<CallResultInput> = {}): CallResultInput {
  return {
    customerName: { value: "Synthetic Name", status: "confirmed" },
    contactPhone: { value: "+91 00000 00020", status: "confirmed" },
    preferredCity: { value: "Gurgaon", status: "confirmed" },
    genderPreference: { value: "any", status: "confirmed" },
    monthlyBudgetInr: { amount: 15000, isApproximate: false, status: "confirmed" },
    moveInDate: { isoDate: "2027-05-01", statedText: null, status: "exact" },
    stayDuration: { months: 6, statedText: null, status: "exact" },
    callOutcome: "completed",
    callbackScheduled: false,
    missingInformation: [],
    callSummary: "Synthetic test call completed.",
    nextAction: "send_options",
    languageUsed: "english",
    ...overrides,
  };
}

async function saveResult(store: MemoryStore, input: CallResultInput, visitorId?: string) {
  const attempt = await store.createAttempt({
    status: "received",
    metadataSent: {},
    ...(visitorId ? { visitorId } : {}),
  });
  const classification = classifyOutcome(input.callOutcome, input);
  return store.createResult({
    ...input,
    callOutcome: classification.outcome,
    attemptId: attempt.id,
    ...(visitorId ? { visitorId } : {}),
    callbackScheduled: false,
    reasons: classification.reasons,
  });
}

describe("service workflows", () => {
  it("creates, reads, lists, updates, previews, seeds idempotently, and deletes visitors", async () => {
    const store = new MemoryStore();
    const service = new VisitorService(store);
    const created = await service.create({ name: " Synthetic One ", phone: "N/A" });
    expect(created.name).toBe("Synthetic One");
    expect(created.phone).toBeNull();
    expect(await service.get(created.id)).toMatchObject({ id: created.id, source: "synthetic" });
    expect((await service.list()).some((item) => item.id === created.id)).toBe(true);
    expect(await service.update(created.id, { city: "Mysuru" })).toMatchObject({ city: "Mysuru" });
    expect((await service.metadataPreview(created.id)).missingFields).toContain("budget");

    expect((await service.seed()).created).toBe(14);
    expect((await service.seed()).created).toBe(14);
    await service.remove(created.id);
    await expect(service.get(created.id)).rejects.toThrow(/not found/i);
    await expect(service.update(created.id, { city: "Chennai" })).rejects.toThrow(/not found/i);
    await expect(service.remove(created.id)).rejects.toThrow(/not found/i);
    await expect(service.metadataPreview(created.id)).rejects.toThrow(/not found/i);
  });

  it("prepares attempts, attaches a recording reference, and reports missing attempts and visitors", async () => {
    const store = new MemoryStore();
    const visitor = await store.createVisitor({ name: "Synthetic Call Attempt" });
    const service = new CallAttemptService(store);
    const prepared = await service.prepare(visitor.id);
    expect(prepared.status).toBe("prepared");
    const scenarioAttempt = await service.prepare(visitor.id, "scenario-01");
    expect(scenarioAttempt.scenarioId).toBe("scenario-01");
    expect((await service.list()).length).toBe(2);
    expect(await service.get(prepared.id)).toMatchObject({ id: prepared.id });
    const attached = await service.attachRecording(prepared.id, {
      recordingUrl: "https://example.invalid/synthetic.wav",
      recordingFilename: "synthetic.wav",
      notes: "Synthetic evidence.",
      callkaroCallId: "test-call-id",
    });
    expect(attached).toMatchObject({
      recordingFilename: "synthetic.wav",
      callkaroCallId: "test-call-id",
    });
    await expect(service.prepare("missing")).rejects.toThrow(/visitor not found/i);
    await expect(service.prepare(visitor.id, "not-a-scenario")).rejects.toThrow(
      /scenario not found/i,
    );
    await expect(service.get("missing")).rejects.toThrow(/attempt not found/i);
    await expect(service.attachRecording("missing", { notes: "No attempt." })).rejects.toThrow(
      /attempt not found/i,
    );
  });

  it("tracks scenario run state and rejects unknown scenarios", async () => {
    const service = new ScenarioService(new MemoryStore());
    const fixtures = await service.list();
    expect(fixtures).toHaveLength(14);
    expect(fixtures[0]).toMatchObject({ run: { result: "not_run" } });
    expect(
      await service.markRun("scenario-01", {
        result: "failed",
        evidenceNote: "Synthetic test evidence.",
        recordingReviewed: false,
      }),
    ).toMatchObject({ result: "failed" });
    await expect(
      service.markRun("unknown", {
        result: "passed",
        evidenceNote: "",
        recordingReviewed: false,
      }),
    ).rejects.toThrow(/scenario not found/i);
  });

  it("updates acceptance evidence and tracks exactly three submission items", async () => {
    const store = new MemoryStore();
    const service = new ChecklistService(store);
    expect(await service.acceptance()).toHaveLength(7);
    expect(
      await service.updateAcceptance("missing-data", {
        completed: true,
        evidence: "Synthetic metadata check.",
      }),
    ).toMatchObject({ completed: true });
    const initialSubmission = await service.submission();
    expect(initialSubmission).toHaveLength(3);
    expect(initialSubmission.map((item) => item.key)).toEqual([
      "recordings",
      "account_email",
      "agent_name",
    ]);
    expect(initialSubmission.every((item) => !item.complete)).toBe(true);

    await service.updateSubmissionDetails({
      accountEmail: "fde@example.com",
      agentName: "PG Finder Test Agent",
    });
    const attempt = await store.createAttempt({
      status: "prepared",
      metadataSent: {},
      recordingFilename: "callkaro-test-01.mp3",
    });
    const updatedSubmission = await service.submission();
    expect(updatedSubmission).toHaveLength(3);
    expect(updatedSubmission[0]).toMatchObject({
      key: "recordings",
      complete: false,
      recordings: [{ attemptId: attempt.id, recordingFilename: "callkaro-test-01.mp3" }],
    });
    await store.updateAttempt(attempt.id, {
      recordingUrl: "https://example.invalid/callkaro-test-01.mp3",
    });
    expect((await service.submission())[0]?.complete).toBe(true);
    expect(updatedSubmission[1]).toMatchObject({
      key: "account_email",
      complete: true,
      value: "fde@example.com",
    });
    expect(updatedSubmission[2]).toMatchObject({
      key: "agent_name",
      complete: true,
      value: "PG Finder Test Agent",
    });
    await expect(
      service.updateAcceptance("unknown", { completed: false, evidence: "" }),
    ).rejects.toThrow(/not found/i);
  });

  it("applies only explicitly corrected fields and handles results without a usable visitor", async () => {
    const store = new MemoryStore();
    const visitorInput: VisitorInput = {
      name: "Old Name",
      phone: "+91 00000 00020",
      city: "Gurgaon",
      gender: "male",
      budget: { amount: 10000, isApproximate: false },
    };
    const visitor = await store.createVisitor(visitorInput);
    const service = new ResultService(store);
    const corrected = await saveResult(
      store,
      resultInput({
        customerName: { value: "New Name", status: "corrected" },
        contactPhone: { value: "+91 00000 00021", status: "corrected" },
        preferredCity: { value: "Chennai", status: "corrected" },
        genderPreference: { value: "female", status: "corrected" },
        monthlyBudgetInr: { amount: 19000, isApproximate: true, status: "corrected" },
      }),
      visitor.id,
    );
    const applied = await service.applyCorrections(corrected.id);
    expect(applied.corrections.map((item) => item.field)).toEqual([
      "name",
      "phone",
      "city",
      "gender",
      "budget",
    ]);
    expect(await store.getVisitor(visitor.id)).toMatchObject({
      name: "New Name",
      phone: "+91 00000 00021",
      city: "Chennai",
      gender: "female",
      budget: { amount: 19000, isApproximate: true },
    });
    expect(await store.listAudits(visitor.id)).toHaveLength(5);
    expect(await service.list()).toHaveLength(1);
    expect(await service.get(corrected.id)).toMatchObject({ id: corrected.id });

    const unchangedVisitorResult = await saveResult(store, resultInput(), visitor.id);
    expect((await service.applyCorrections(unchangedVisitorResult.id)).corrections).toHaveLength(0);
    const noVisitor = await saveResult(store, resultInput());
    expect((await service.applyCorrections(noVisitor.id)).corrections).toHaveLength(0);
    const deletedVisitorResult = await saveResult(store, resultInput(), visitor.id);
    await store.deleteVisitor(visitor.id);
    expect((await service.applyCorrections(deletedVisitorResult.id)).corrections).toHaveLength(0);
    await expect(service.get("missing")).rejects.toThrow(/result not found/i);
  });
});
