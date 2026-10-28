import { createHash } from "node:crypto";
import {
  mapCallKaroPayload,
  AdapterMappingError,
  CallKaroPathConfig,
} from "../adapters/callkaroAdapter";
import { CallAttempt, CallResultInput } from "../domain/types";
import { DataStore } from "../repositories/dataStore";
import { classifyOutcome } from "./outcomeClassifier";

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return "[" + value.map(canonicalJson).join(",") + "]";
  if (value !== null && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return (
      "{" +
      Object.keys(record)
        .sort()
        .map((key) => JSON.stringify(key) + ":" + canonicalJson(record[key]))
        .join(",") +
      "}"
    );
  }
  return JSON.stringify(value) ?? "null";
}

function resultInputWithPolicy(input: CallResultInput): CallResultInput {
  return { ...input, callbackScheduled: false };
}

export class WebhookService {
  constructor(
    private readonly store: DataStore,
    private readonly pathConfig?: CallKaroPathConfig,
  ) {}

  async receive(
    rawPayload: unknown,
  ): Promise<{ attempt: CallAttempt; duplicate: boolean; mappingError?: string }> {
    const payloadHash = createHash("sha256").update(canonicalJson(rawPayload)).digest("hex");
    // Persist the untouched delivery before attempting provider-specific interpretation.
    const stored = await this.store.createWebhookAttempt(payloadHash, rawPayload);
    if (stored.duplicate) return { attempt: stored.attempt, duplicate: true };

    try {
      const mapped = mapCallKaroPayload(rawPayload, this.pathConfig);
      if (mapped.visitorId && !(await this.store.getVisitor(mapped.visitorId))) {
        throw new AdapterMappingError("Configured visitor ID did not match a synthetic visitor.");
      }
      const resultInput = resultInputWithPolicy(mapped.result);
      const classification = classifyOutcome(resultInput.callOutcome, resultInput);
      const classifiedResult: CallResultInput = {
        ...resultInput,
        callOutcome: classification.outcome,
        callbackScheduled: false,
      };
      const attemptPatch: Partial<CallAttempt> = {
        status: "received",
        ...(mapped.visitorId ? { visitorId: mapped.visitorId } : {}),
        ...(mapped.callkaroCallId ? { callkaroCallId: mapped.callkaroCallId } : {}),
      };
      const attempt = await this.store.updateAttempt(stored.attempt.id, attemptPatch);
      if (!attempt) throw new Error("Webhook attempt disappeared before result persistence.");
      await this.store.createResult({
        ...classifiedResult,
        attemptId: attempt.id,
        ...(mapped.visitorId ? { visitorId: mapped.visitorId } : {}),
        callbackScheduled: false,
        reasons: classification.reasons,
      });
      return { attempt, duplicate: false };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Webhook mapping failed.";
      const attempt = await this.store.updateAttempt(stored.attempt.id, {
        status: "received_unmapped",
        mappingError: message,
      });
      return { attempt: attempt ?? stored.attempt, duplicate: false, mappingError: message };
    }
  }
}
