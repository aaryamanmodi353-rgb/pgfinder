import { randomUUID } from "node:crypto";
import {
  AcceptanceItem,
  AuditLog,
  CallAttempt,
  CallResult,
  ScenarioRun,
  SubmissionDetails,
  Visitor,
  VisitorField,
  VisitorInput,
} from "../domain/types";
import { getMissingFields } from "../services/normalizationService";
import { acceptanceDefaults } from "../services/acceptanceChecklist";
import { DataStore, NewAuditLog, NewCallAttempt, NewCallResult } from "./dataStore";

function copy<T>(value: T): T {
  return structuredClone(value);
}

function visitorRecord(id: string, input: VisitorInput, createdAt = new Date()): Visitor {
  const record: Visitor = { id, createdAt, source: "synthetic", missingFields: [] };
  for (const field of [
    "name",
    "phone",
    "city",
    "gender",
    "budget",
  ] as const satisfies readonly VisitorField[]) {
    if (field in input) Object.assign(record, { [field]: input[field] });
  }
  record.missingFields = getMissingFields(record);
  return record;
}

export class MemoryStore implements DataStore {
  readonly mode = "memory" as const;
  private readonly visitors = new Map<string, Visitor>();
  private readonly scenarioVisitorIds = new Map<string, string>();
  private readonly attempts = new Map<string, CallAttempt>();
  private readonly results = new Map<string, CallResult>();
  private readonly audits: AuditLog[] = [];
  private readonly scenarioRuns = new Map<string, ScenarioRun>();
  private readonly acceptance = new Map<string, AcceptanceItem>(
    acceptanceDefaults.map((item) => [item.key, copy(item)]),
  );
  private submissionDetails: SubmissionDetails = { accountEmail: null, agentName: null };

  async createVisitor(input: VisitorInput): Promise<Visitor> {
    const created = visitorRecord(randomUUID(), input);
    this.visitors.set(created.id, created);
    return copy(created);
  }

  async upsertScenarioVisitor(scenarioId: string, input: VisitorInput): Promise<Visitor> {
    const existingId = this.scenarioVisitorIds.get(scenarioId);
    if (existingId && this.visitors.has(existingId)) {
      const current = this.visitors.get(existingId)!;
      const updated = visitorRecord(current.id, input, current.createdAt);
      this.visitors.set(updated.id, updated);
      return copy(updated);
    }
    const created = await this.createVisitor(input);
    this.scenarioVisitorIds.set(scenarioId, created.id);
    return created;
  }

  async listVisitors(): Promise<Visitor[]> {
    return copy([...this.visitors.values()]);
  }
  async getVisitor(id: string): Promise<Visitor | undefined> {
    const visitor = this.visitors.get(id);
    return visitor ? copy(visitor) : undefined;
  }

  async updateVisitor(id: string, patch: VisitorInput): Promise<Visitor | undefined> {
    const current = this.visitors.get(id);
    if (!current) return undefined;
    const merged: VisitorInput = { ...current, ...patch };
    const updated = visitorRecord(id, merged, current.createdAt);
    this.visitors.set(id, updated);
    return copy(updated);
  }

  async deleteVisitor(id: string): Promise<boolean> {
    if (!this.visitors.has(id)) return false;
    this.visitors.delete(id);
    return true;
  }

  async createAttempt(input: NewCallAttempt): Promise<CallAttempt> {
    const attempt: CallAttempt = { ...copy(input), id: randomUUID(), createdAt: new Date() };
    this.attempts.set(attempt.id, attempt);
    return copy(attempt);
  }

  async createWebhookAttempt(
    payloadHash: string,
    rawPayload: unknown,
  ): Promise<{ attempt: CallAttempt; duplicate: boolean }> {
    const existing = [...this.attempts.values()].find(
      (attempt) => attempt.payloadHash === payloadHash,
    );
    if (existing) return { attempt: copy(existing), duplicate: true };
    const attempt = await this.createAttempt({
      status: "received_unmapped",
      metadataSent: {},
      rawPayload: copy(rawPayload),
      payloadHash,
    });
    return { attempt, duplicate: false };
  }

  async listAttempts(): Promise<CallAttempt[]> {
    return copy([...this.attempts.values()]);
  }
  async getAttempt(id: string): Promise<CallAttempt | undefined> {
    const attempt = this.attempts.get(id);
    return attempt ? copy(attempt) : undefined;
  }
  async findAttemptByCallId(callId: string): Promise<CallAttempt | undefined> {
    const attempt = [...this.attempts.values()].find(
      (candidate) => candidate.callkaroCallId === callId,
    );
    return attempt ? copy(attempt) : undefined;
  }
  async updateAttempt(id: string, patch: Partial<CallAttempt>): Promise<CallAttempt | undefined> {
    const current = this.attempts.get(id);
    if (!current) return undefined;
    const updated = { ...current, ...copy(patch), id, createdAt: current.createdAt };
    this.attempts.set(id, updated);
    return copy(updated);
  }
  async deleteAttempt(id: string): Promise<void> {
    this.attempts.delete(id);
  }

  async createResult(input: NewCallResult): Promise<CallResult> {
    const existing = await this.findResultByAttempt(input.attemptId);
    if (existing) return existing;
    const result: CallResult = {
      ...copy(input),
      callbackScheduled: false,
      id: randomUUID(),
      createdAt: new Date(),
    };
    this.results.set(result.id, result);
    return copy(result);
  }

  async listResults(): Promise<CallResult[]> {
    return copy([...this.results.values()]);
  }
  async getResult(id: string): Promise<CallResult | undefined> {
    const result = this.results.get(id);
    return result ? copy(result) : undefined;
  }
  async findResultByAttempt(attemptId: string): Promise<CallResult | undefined> {
    const result = [...this.results.values()].find(
      (candidate) => candidate.attemptId === attemptId,
    );
    return result ? copy(result) : undefined;
  }
  async addAudit(input: NewAuditLog): Promise<AuditLog> {
    const entry: AuditLog = { ...copy(input), id: randomUUID(), createdAt: new Date() };
    this.audits.push(entry);
    return copy(entry);
  }
  async listAudits(visitorId?: string): Promise<AuditLog[]> {
    return copy(
      visitorId ? this.audits.filter((audit) => audit.visitorId === visitorId) : this.audits,
    );
  }

  async listScenarioRuns(): Promise<ScenarioRun[]> {
    return copy([...this.scenarioRuns.values()]);
  }
  async saveScenarioRun(input: Omit<ScenarioRun, "id" | "updatedAt">): Promise<ScenarioRun> {
    const prior = this.scenarioRuns.get(input.scenarioId);
    const run: ScenarioRun = {
      ...copy(input),
      id: prior?.id ?? randomUUID(),
      updatedAt: new Date(),
    };
    this.scenarioRuns.set(input.scenarioId, run);
    return copy(run);
  }

  async listAcceptanceItems(): Promise<AcceptanceItem[]> {
    return copy([...this.acceptance.values()]);
  }
  async updateAcceptanceItem(
    key: string,
    patch: Pick<AcceptanceItem, "completed" | "evidence">,
  ): Promise<AcceptanceItem | undefined> {
    const current = this.acceptance.get(key);
    if (!current) return undefined;
    const updated = { ...current, ...copy(patch) };
    this.acceptance.set(key, updated);
    return copy(updated);
  }

  async getSubmissionDetails(): Promise<SubmissionDetails> {
    return copy(this.submissionDetails);
  }

  async updateSubmissionDetails(
    patch: Partial<SubmissionDetails>,
  ): Promise<SubmissionDetails> {
    this.submissionDetails = { ...this.submissionDetails, ...copy(patch) };
    return copy(this.submissionDetails);
  }
}
