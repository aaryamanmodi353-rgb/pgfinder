import { randomUUID } from "node:crypto";
import mongoose from "mongoose";
import {
  AcceptanceItem,
  AuditLog,
  CallAttempt,
  CallResult,
  ScenarioRun,
  Visitor,
  VisitorField,
  VisitorInput,
} from "../domain/types";
import { getMissingFields } from "../services/normalizationService";
import { acceptanceDefaults } from "../services/acceptanceChecklist";
import {
  AcceptanceModel,
  AuditLogModel,
  CallAttemptModel,
  CallResultModel,
  ScenarioRunModel,
  VisitorModel,
} from "../models/mongooseModels";
import { DataStore, NewAuditLog, NewCallAttempt, NewCallResult } from "./dataStore";

type DbRow = Record<string, unknown>;
function rowOf(doc: unknown): DbRow {
  const candidate = doc as { toObject?: () => unknown };
  return (candidate.toObject ? candidate.toObject() : doc) as DbRow;
}
function visitorOf(doc: unknown): Visitor {
  const row = rowOf(doc);
  const visitor: Visitor = {
    id: String(row._id),
    createdAt: new Date(row.createdAt as string | number | Date),
    source: "synthetic",
    missingFields: [],
  };
  for (const field of [
    "name",
    "phone",
    "city",
    "gender",
    "budget",
  ] as const satisfies readonly VisitorField[]) {
    if (row[field] !== undefined) Object.assign(visitor, { [field]: row[field] });
  }
  visitor.missingFields = getMissingFields(visitor);
  return visitor;
}
function attemptOf(doc: unknown): CallAttempt {
  const row = rowOf(doc);
  const { _id, ...fields } = row;
  return {
    ...fields,
    id: String(_id),
    createdAt: new Date(row.createdAt as string | number | Date),
  } as CallAttempt;
}
function resultOf(doc: unknown): CallResult {
  const row = rowOf(doc);
  const { _id, ...fields } = row;
  return {
    ...fields,
    id: String(_id),
    callbackScheduled: false,
    createdAt: new Date(row.createdAt as string | number | Date),
  } as CallResult;
}
function auditOf(doc: unknown): AuditLog {
  const row = rowOf(doc);
  const { _id, ...fields } = row;
  return {
    ...fields,
    id: String(_id),
    createdAt: new Date(row.createdAt as string | number | Date),
  } as AuditLog;
}
function runOf(doc: unknown): ScenarioRun {
  const row = rowOf(doc);
  const { _id, ...fields } = row;
  return {
    ...fields,
    id: String(_id),
    updatedAt: new Date(row.updatedAt as string | number | Date),
  } as ScenarioRun;
}
function acceptanceOf(doc: unknown): AcceptanceItem {
  const row = rowOf(doc);
  return {
    key: String(row._id),
    title: String(row.title),
    description: String(row.description),
    completed: Boolean(row.completed),
    evidence: String(row.evidence),
  };
}

export class MongoStore implements DataStore {
  readonly mode = "mongo" as const;

  static async connect(uri: string): Promise<MongoStore> {
    await mongoose.connect(uri);
    return new MongoStore();
  }

  async createVisitor(input: VisitorInput): Promise<Visitor> {
    return visitorOf(
      await VisitorModel.create({
        _id: randomUUID(),
        ...input,
        source: "synthetic",
        createdAt: new Date(),
      }),
    );
  }

  async upsertScenarioVisitor(scenarioId: string, input: VisitorInput): Promise<Visitor> {
    const doc = await VisitorModel.findOneAndUpdate(
      { scenarioId },
      {
        $set: { ...input, source: "synthetic" },
        $setOnInsert: { _id: randomUUID(), createdAt: new Date() },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).exec();
    return visitorOf(doc);
  }

  async listVisitors(): Promise<Visitor[]> {
    return (await VisitorModel.find().sort({ createdAt: -1 }).exec()).map(visitorOf);
  }
  async getVisitor(id: string): Promise<Visitor | undefined> {
    const doc = await VisitorModel.findById(id).exec();
    return doc ? visitorOf(doc) : undefined;
  }
  async updateVisitor(id: string, patch: VisitorInput): Promise<Visitor | undefined> {
    const doc = await VisitorModel.findByIdAndUpdate(
      id,
      { $set: patch },
      { new: true, runValidators: true },
    ).exec();
    return doc ? visitorOf(doc) : undefined;
  }
  async deleteVisitor(id: string): Promise<boolean> {
    return Boolean(await VisitorModel.findByIdAndDelete(id).exec());
  }

  async createAttempt(input: NewCallAttempt): Promise<CallAttempt> {
    return attemptOf(
      await CallAttemptModel.create({ _id: randomUUID(), ...input, createdAt: new Date() }),
    );
  }
  async createWebhookAttempt(
    payloadHash: string,
    rawPayload: unknown,
  ): Promise<{ attempt: CallAttempt; duplicate: boolean }> {
    const existing = await CallAttemptModel.findOne({ payloadHash }).exec();
    if (existing) return { attempt: attemptOf(existing), duplicate: true };
    try {
      const attempt = await this.createAttempt({
        status: "received_unmapped",
        metadataSent: {},
        rawPayload,
        payloadHash,
      });
      return { attempt, duplicate: false };
    } catch (error) {
      if (typeof error === "object" && error !== null && "code" in error && error.code === 11000) {
        const duplicate = await CallAttemptModel.findOne({ payloadHash }).exec();
        if (duplicate) return { attempt: attemptOf(duplicate), duplicate: true };
      }
      throw error;
    }
  }
  async listAttempts(): Promise<CallAttempt[]> {
    return (await CallAttemptModel.find().sort({ createdAt: -1 }).exec()).map(attemptOf);
  }
  async getAttempt(id: string): Promise<CallAttempt | undefined> {
    const doc = await CallAttemptModel.findById(id).exec();
    return doc ? attemptOf(doc) : undefined;
  }
  async findAttemptByCallId(callId: string): Promise<CallAttempt | undefined> {
    const doc = await CallAttemptModel.findOne({ callkaroCallId: callId }).exec();
    return doc ? attemptOf(doc) : undefined;
  }
  async updateAttempt(id: string, patch: Partial<CallAttempt>): Promise<CallAttempt | undefined> {
    const safePatch = { ...patch };
    delete safePatch.id;
    delete safePatch.createdAt;
    const doc = await CallAttemptModel.findByIdAndUpdate(
      id,
      { $set: safePatch },
      { new: true },
    ).exec();
    return doc ? attemptOf(doc) : undefined;
  }
  async deleteAttempt(id: string): Promise<void> {
    await CallAttemptModel.findByIdAndDelete(id).exec();
  }

  async createResult(input: NewCallResult): Promise<CallResult> {
    const existing = await this.findResultByAttempt(input.attemptId);
    if (existing) return existing;
    try {
      const doc = await CallResultModel.create({
        _id: randomUUID(),
        ...input,
        callbackScheduled: false,
        createdAt: new Date(),
      });
      return resultOf(doc);
    } catch (error) {
      if (typeof error === "object" && error !== null && "code" in error && error.code === 11000) {
        const duplicate = await this.findResultByAttempt(input.attemptId);
        if (duplicate) return duplicate;
      }
      throw error;
    }
  }
  async listResults(): Promise<CallResult[]> {
    return (await CallResultModel.find().sort({ createdAt: -1 }).exec()).map(resultOf);
  }
  async getResult(id: string): Promise<CallResult | undefined> {
    const doc = await CallResultModel.findById(id).exec();
    return doc ? resultOf(doc) : undefined;
  }
  async findResultByAttempt(attemptId: string): Promise<CallResult | undefined> {
    const doc = await CallResultModel.findOne({ attemptId }).exec();
    return doc ? resultOf(doc) : undefined;
  }
  async addAudit(input: NewAuditLog): Promise<AuditLog> {
    return auditOf(
      await AuditLogModel.create({ _id: randomUUID(), ...input, createdAt: new Date() }),
    );
  }
  async listAudits(visitorId?: string): Promise<AuditLog[]> {
    const docs = await AuditLogModel.find(visitorId ? { visitorId } : {})
      .sort({ createdAt: -1 })
      .exec();
    return docs.map(auditOf);
  }

  async listScenarioRuns(): Promise<ScenarioRun[]> {
    return (await ScenarioRunModel.find().exec()).map(runOf);
  }
  async saveScenarioRun(input: Omit<ScenarioRun, "id" | "updatedAt">): Promise<ScenarioRun> {
    const doc = await ScenarioRunModel.findOneAndUpdate(
      { scenarioId: input.scenarioId },
      { $set: { ...input, updatedAt: new Date() }, $setOnInsert: { _id: randomUUID() } },
      { upsert: true, new: true },
    ).exec();
    return runOf(doc);
  }

  async listAcceptanceItems(): Promise<AcceptanceItem[]> {
    for (const item of acceptanceDefaults) {
      await AcceptanceModel.updateOne(
        { _id: item.key },
        { $setOnInsert: { ...item } },
        { upsert: true },
      ).exec();
    }
    return (await AcceptanceModel.find().exec()).map(acceptanceOf);
  }
  async updateAcceptanceItem(
    key: string,
    patch: Pick<AcceptanceItem, "completed" | "evidence">,
  ): Promise<AcceptanceItem | undefined> {
    await this.listAcceptanceItems();
    const doc = await AcceptanceModel.findByIdAndUpdate(key, { $set: patch }, { new: true }).exec();
    return doc ? acceptanceOf(doc) : undefined;
  }
}
