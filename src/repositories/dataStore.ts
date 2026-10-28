import {
  AcceptanceItem,
  AuditLog,
  CallAttempt,
  CallResult,
  ScenarioRun,
  SubmissionDetails,
  Visitor,
  VisitorInput,
} from "../domain/types";

export type NewCallAttempt = Omit<CallAttempt, "id" | "createdAt">;
export type NewCallResult = Omit<
  CallResult,
  "id" | "createdAt" | "callbackScheduled" | "reasons"
> & {
  callbackScheduled?: boolean;
  reasons: string[];
};
export type NewAuditLog = Omit<AuditLog, "id" | "createdAt">;

export interface DataStore {
  readonly mode: "memory" | "mongo";
  createVisitor(input: VisitorInput): Promise<Visitor>;
  upsertScenarioVisitor(scenarioId: string, input: VisitorInput): Promise<Visitor>;
  listVisitors(): Promise<Visitor[]>;
  getVisitor(id: string): Promise<Visitor | undefined>;
  updateVisitor(id: string, patch: VisitorInput): Promise<Visitor | undefined>;
  deleteVisitor(id: string): Promise<boolean>;
  createAttempt(input: NewCallAttempt): Promise<CallAttempt>;
  createWebhookAttempt(
    payloadHash: string,
    rawPayload: unknown,
  ): Promise<{ attempt: CallAttempt; duplicate: boolean }>;
  listAttempts(): Promise<CallAttempt[]>;
  getAttempt(id: string): Promise<CallAttempt | undefined>;
  findAttemptByCallId(callId: string): Promise<CallAttempt | undefined>;
  updateAttempt(id: string, patch: Partial<CallAttempt>): Promise<CallAttempt | undefined>;
  deleteAttempt(id: string): Promise<void>;
  createResult(input: NewCallResult): Promise<CallResult>;
  listResults(): Promise<CallResult[]>;
  getResult(id: string): Promise<CallResult | undefined>;
  findResultByAttempt(attemptId: string): Promise<CallResult | undefined>;
  addAudit(input: NewAuditLog): Promise<AuditLog>;
  listAudits(visitorId?: string): Promise<AuditLog[]>;
  listScenarioRuns(): Promise<ScenarioRun[]>;
  saveScenarioRun(input: Omit<ScenarioRun, "id" | "updatedAt">): Promise<ScenarioRun>;
  listAcceptanceItems(): Promise<AcceptanceItem[]>;
  updateAcceptanceItem(
    key: string,
    patch: Pick<AcceptanceItem, "completed" | "evidence">,
  ): Promise<AcceptanceItem | undefined>;
  getSubmissionDetails(): Promise<SubmissionDetails>;
  updateSubmissionDetails(patch: Partial<SubmissionDetails>): Promise<SubmissionDetails>;
}
