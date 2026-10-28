import payloadConfig from "../../config/callkaro.payload.json";
import { CallResultInput, MappedWebhook, callResultInputSchema } from "../domain/types";

export type CallKaroPathConfig = {
  callIdPath?: string | null;
  visitorIdPath?: string | null;
  resultPath?: string | null;
};

export class AdapterMappingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AdapterMappingError";
  }
}

function readPath(source: unknown, path: string | null | undefined): unknown {
  if (!path) return undefined;
  return path.split(".").reduce<unknown>((current, part) => {
    if (current === null || typeof current !== "object") return undefined;
    return (current as Record<string, unknown>)[part];
  }, source);
}

function redactPhoneNumbers(summary: string, phone: string | null): string {
  let safe = summary;
  if (phone) {
    const digits = phone.replace(/\D/g, "");
    safe = safe.replaceAll(phone, "[phone omitted]");
    if (digits.length >= 8) safe = safe.replaceAll(digits, "[phone omitted]");
  }
  return safe.replace(/(?:\+?\d[\s().-]*){8,}/g, "[phone omitted]").slice(0, 400);
}

export function sanitizeCallResultSummary(result: CallResultInput): CallResultInput {
  return {
    ...result,
    callSummary: redactPhoneNumbers(result.callSummary, result.contactPhone.value),
  };
}

export function mapCallKaroPayload(
  rawPayload: unknown,
  pathConfig: CallKaroPathConfig = payloadConfig,
): MappedWebhook {
  // VERIFY AGAINST docs.callkaro.ai: provider webhook paths must be configured from documented examples.
  if (!pathConfig.resultPath) {
    throw new AdapterMappingError(
      "Webhook result path is not configured; verify CallKaro documentation first.",
    );
  }

  const rawResult = readPath(rawPayload, pathConfig.resultPath);
  const parsed = callResultInputSchema.safeParse(rawResult);
  if (!parsed.success) {
    throw new AdapterMappingError(
      `Webhook result does not match the configured result contract: ${parsed.error.message}`,
    );
  }

  const result = sanitizeCallResultSummary(parsed.data);
  const callIdValue = readPath(rawPayload, pathConfig.callIdPath);
  const visitorIdValue = readPath(rawPayload, pathConfig.visitorIdPath);
  const mapped: MappedWebhook = { result };
  if (typeof callIdValue === "string" && callIdValue.trim())
    mapped.callkaroCallId = callIdValue.trim();
  if (typeof visitorIdValue === "string" && visitorIdValue.trim())
    mapped.visitorId = visitorIdValue.trim();
  return mapped;
}
