import request from "supertest";
import { afterEach, describe, expect, it } from "vitest";
import { CallResultInput } from "../src/domain/types";
import { createApp } from "../src/app";
import { MemoryStore } from "../src/repositories/memoryStore";

const providerTestPaths = {
  callIdPath: "event.callId",
  visitorIdPath: "event.visitorId",
  resultPath: "event.result",
};

function validResult(overrides: Partial<CallResultInput> = {}): CallResultInput {
  return {
    customerName: { value: "Synthetic Visitor", status: "confirmed" },
    contactPhone: { value: "+91 00000 00001", status: "confirmed" },
    preferredCity: { value: "Gurgaon", status: "confirmed" },
    genderPreference: { value: "any", status: "confirmed" },
    monthlyBudgetInr: { amount: 18000, isApproximate: true, status: "confirmed" },
    moveInDate: { isoDate: "2027-04-01", statedText: null, status: "exact" },
    stayDuration: { months: 6, statedText: null, status: "exact" },
    callOutcome: "completed",
    callbackScheduled: true,
    missingInformation: [],
    callSummary: "Confirmed phone +91 00000 00001 and PG preferences.",
    nextAction: "send_options",
    languageUsed: "hinglish",
    ...overrides,
  };
}

function webhookPayload(visitorId: string, result = validResult()) {
  // Provider-shaped keys below are synthetic test inputs used only with injected test paths.
  return { event: { callId: "synthetic-call-1", visitorId, result } };
}

describe("API integration", () => {
  let store: MemoryStore | undefined;
  afterEach(() => {
    store = undefined;
  });

  it("persists, maps, deduplicates, and applies corrections with an audit trail", async () => {
    store = new MemoryStore();
    const app = createApp({
      store,
      webhookSecret: "test-secret",
      callKaroPaths: providerTestPaths,
    });
    const created = await request(app)
      .post("/api/v1/visitors")
      .send({
        name: "Old Synthetic Name",
        phone: "+91 00000 00001",
        city: "Gurgaon",
        gender: "male",
        budget: { amount: 12000, isApproximate: false },
      });
    expect(created.status).toBe(201);
    const visitorId = created.body.id as string;
    const corrected = validResult({
      customerName: { value: "New Synthetic Name", status: "corrected" },
      contactPhone: { value: "+91 00000 00099", status: "corrected" },
      preferredCity: { value: "Mysuru", status: "corrected" },
      genderPreference: { value: "female", status: "corrected" },
      monthlyBudgetInr: { amount: 19000, isApproximate: true, status: "corrected" },
    });
    const payload = webhookPayload(visitorId, corrected);

    const unauthorized = await request(app).post("/api/v1/webhooks/callkaro").send(payload);
    expect(unauthorized.status).toBe(401);
    const first = await request(app)
      .post("/api/v1/webhooks/callkaro")
      .set("x-callkaro-secret", "test-secret")
      .send(payload);
    expect(first.status).toBe(202);
    expect(first.body.attempt.status).toBe("received");
    expect(first.body.attempt.rawPayload).toEqual(payload);

    const results = await request(app).get("/api/v1/results");
    expect(results.status).toBe(200);
    expect(results.body).toHaveLength(1);
    expect(results.body[0].callbackScheduled).toBe(false);
    expect(results.body[0].callSummary).not.toContain("+91 00000 00001");
    const resultId = results.body[0].id as string;

    const duplicate = await request(app)
      .post("/api/v1/webhooks/callkaro")
      .set("x-callkaro-secret", "test-secret")
      .send(payload);
    expect(duplicate.status).toBe(200);
    expect(duplicate.body.duplicate).toBe(true);
    expect((await request(app).get("/api/v1/results")).body).toHaveLength(1);

    const applied = await request(app).post("/api/v1/results/" + resultId + "/apply-corrections");
    expect(applied.status).toBe(200);
    expect(applied.body.corrections.map((item: { field: string }) => item.field)).toEqual([
      "name",
      "phone",
      "city",
      "gender",
      "budget",
    ]);
    const updatedVisitor = await request(app).get("/api/v1/visitors/" + visitorId);
    expect(updatedVisitor.body).toMatchObject({
      name: "New Synthetic Name",
      phone: "+91 00000 00099",
      city: "Mysuru",
      gender: "female",
      budget: { amount: 19000, isApproximate: true },
    });
    expect(await store.listAudits(visitorId)).toHaveLength(5);
    expect((await request(app).get("/api/v1/call-attempts")).body[0].status).toBe("reviewed");
  });

  it("returns a consistent 400 envelope for invalid JSON and keeps unknown JSON shapes", async () => {
    store = new MemoryStore();
    const app = createApp({ store });
    const malformed = await request(app)
      .post("/api/v1/webhooks/callkaro")
      .set("Content-Type", "application/json")
      .send('{"broken":');
    expect(malformed.status).toBe(400);
    expect(malformed.body.error).toMatchObject({ code: "INVALID_JSON" });
    expect(malformed.body.requestId).toBeTruthy();

    const unknown = await request(app)
      .post("/api/v1/webhooks/callkaro")
      .send({ unrelated: ["shape"] });
    expect(unknown.status).toBe(202);
    expect(unknown.body.attempt.status).toBe("received_unmapped");
    expect(unknown.body.mappingError).toMatch(/not configured/);
    expect(unknown.body.attempt.rawPayload).toEqual({ unrelated: ["shape"] });

    const noCorrelationStore = new MemoryStore();
    const noCorrelationApp = createApp({
      store: noCorrelationStore,
      callKaroPaths: { resultPath: "event.result" },
    });
    const mappedWithoutVisitor = await request(noCorrelationApp)
      .post("/api/v1/webhooks/callkaro")
      .send({ event: { result: validResult() } });
    expect(mappedWithoutVisitor.body.attempt.status).toBe("received");
    expect((await request(noCorrelationApp).get("/api/v1/results")).body).toHaveLength(1);
  });

  it("seeds and tracks scenario runs, acceptance evidence, and exactly three submission items", async () => {
    store = new MemoryStore();
    const app = createApp({ store });
    const seeded = await request(app).post("/api/v1/visitors/seed").send({});
    expect(seeded.status).toBe(201);
    expect(seeded.body.created).toBe(14);
    expect(
      seeded.body.visitors.every((visitor: { source: string }) => visitor.source === "synthetic"),
    ).toBe(true);

    const scenarios = await request(app).get("/api/v1/scenarios");
    expect(scenarios.body).toHaveLength(14);
    expect(scenarios.body[0].run.result).toBe("not_run");
    const marked = await request(app).patch("/api/v1/scenarios/scenario-01/run").send({
      result: "passed",
      evidenceNote: "Synthetic recording reviewed.",
      recordingReviewed: true,
    });
    expect(marked.body).toMatchObject({
      scenarioId: "scenario-01",
      result: "passed",
      recordingReviewed: true,
    });

    const acceptance = await request(app).get("/api/v1/acceptance-checklist");
    expect(acceptance.body.length).toBeGreaterThan(0);
    const updated = await request(app)
      .patch("/api/v1/acceptance-checklist/missing-data")
      .send({ completed: true, evidence: "Metadata preview omitted unavailable values." });
    expect(updated.body.completed).toBe(true);
    expect(await store.listAcceptanceItems()).toContainEqual(
      expect.objectContaining({ key: "missing-data", completed: true }),
    );

    const submission = await request(app).get("/api/v1/submission-checklist");
    expect(submission.body.map((item: { key: string }) => item.key)).toEqual([
      "recordings",
      "account_email",
      "agent_name",
    ]);
    expect(submission.body.every((item: { complete: boolean }) => !item.complete)).toBe(true);

    const savedEmail = await request(app)
      .patch("/api/v1/submission-checklist")
      .send({ accountEmail: "aarya@example.com" });
    expect(savedEmail.status).toBe(200);
    expect(savedEmail.body.accountEmail).toBe("aarya@example.com");
    const savedAgent = await request(app)
      .patch("/api/v1/submission-checklist")
      .send({ agentName: "PG Finder Test Agent" });
    expect(savedAgent.body.agentName).toBe("PG Finder Test Agent");

    const attempt = await request(app)
      .post("/api/v1/call-attempts")
      .send({ visitorId: seeded.body.visitors[0].id });
    expect(attempt.status).toBe(201);
    const recording = await request(app)
      .patch(`/api/v1/call-attempts/${attempt.body.id}/recording`)
      .send({
        recordingFilename: "test-call.mp3",
        recordingUrl: "https://example.invalid/test-call.mp3",
      });
    expect(recording.status).toBe(200);

    const readySubmission = await request(app).get("/api/v1/submission-checklist");
    expect(readySubmission.body).toHaveLength(3);
    expect(readySubmission.body.every((item: { complete: boolean }) => item.complete)).toBe(true);
    expect(readySubmission.body[0].recordings[0].recordingFilename).toBe("test-call.mp3");
    expect(readySubmission.body[1].value).toBe("aarya@example.com");
    expect(readySubmission.body[2].value).toBe("PG Finder Test Agent");

    const invalidEmail = await request(app)
      .patch("/api/v1/submission-checklist")
      .send({ accountEmail: "not-an-email" });
    expect(invalidEmail.status).toBe(400);
  });

  it("prepares attempts and exposes metadata preview without placeholders", async () => {
    store = new MemoryStore();
    const app = createApp({ store });
    const visitor = await request(app)
      .post("/api/v1/visitors")
      .send({ name: "Metadata Test", phone: "N/A" });
    const preview = await request(app).get(
      "/api/v1/visitors/" + visitor.body.id + "/metadata-preview",
    );
    expect(preview.body.payload).toEqual({});
    expect(preview.body.missingFields).toContain("phone");

    const prepared = await request(app)
      .post("/api/v1/call-attempts")
      .send({ visitorId: visitor.body.id });
    expect(prepared.status).toBe(201);
    expect(prepared.body.status).toBe("prepared");
    const recording = await request(app)
      .patch("/api/v1/call-attempts/" + prepared.body.id + "/recording")
      .send({ recordingFilename: "synthetic-test.wav", notes: "Synthetic recording reference." });
    expect(recording.body.recordingFilename).toBe("synthetic-test.wav");
  });

  it("uses 404 and validation error envelopes for missing resources and invalid requests", async () => {
    const app = createApp({ store: new MemoryStore() });
    const notFound = await request(app).get("/api/v1/visitors/not-here");
    expect(notFound.status).toBe(404);
    expect(notFound.body.error.code).toBe("NOT_FOUND");

    const invalid = await request(app).post("/api/v1/visitors").send({ unknownField: "value" });
    expect(invalid.status).toBe(400);
    expect(invalid.body.error.code).toBe("VALIDATION_ERROR");

    const missingVisitor = await request(app)
      .post("/api/v1/call-attempts")
      .send({ visitorId: "missing" });
    expect(missingVisitor.status).toBe(404);
  });
});
