import type {
  AcceptanceItem,
  CallAttempt,
  CallResult,
  MetadataPreview,
  Scenario,
  SubmissionItem,
  Visitor,
} from "./api-types";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api/v1${path}`, {
      ...init,
      headers: { "content-type": "application/json", ...init?.headers },
    });
  } catch {
    throw new ApiError("Could not reach the API. Check that the backend is running.", 0);
  }
  const body = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new ApiError(
      body.message ?? body.error?.message ?? `Request failed (${response.status}).`,
      response.status,
    );
  return body as T;
}
const json = (method: string, value: unknown): RequestInit => ({
  method,
  body: JSON.stringify(value),
});
export const api = {
  health: () => request<{ status: string; storage: string }>("/health"),
  visitors: () => request<Visitor[]>("/visitors"),
  createVisitor: (input: Partial<Visitor>) => request<Visitor>("/visitors", json("POST", input)),
  updateVisitor: (id: string, input: Partial<Visitor>) =>
    request<Visitor>(`/visitors/${id}`, json("PATCH", input)),
  deleteVisitor: (id: string) => request<void>(`/visitors/${id}`, { method: "DELETE" }),
  seedVisitors: () =>
    request<{ created: number; visitors: Visitor[] }>("/visitors/seed", { method: "POST" }),
  metadataPreview: (id: string) => request<MetadataPreview>(`/visitors/${id}/metadata-preview`),
  attempts: () => request<CallAttempt[]>("/call-attempts"),
  createAttempt: (visitorId: string, scenarioId?: string) =>
    request<CallAttempt>(
      "/call-attempts",
      json("POST", { visitorId, ...(scenarioId ? { scenarioId } : {}) }),
    ),
  attachRecording: (
    id: string,
    input: {
      recordingUrl?: string;
      recordingFilename?: string;
      notes?: string;
      callkaroCallId?: string;
    },
  ) => request<CallAttempt>(`/call-attempts/${id}/recording`, json("PATCH", input)),
  results: () => request<CallResult[]>("/results"),
  applyCorrections: (id: string) =>
    request<{
      result: CallResult;
      corrections: Array<{ field: string; oldValue: unknown; newValue: unknown }>;
    }>(`/results/${id}/apply-corrections`, { method: "POST" }),
  scenarios: () => request<Scenario[]>("/scenarios"),
  updateScenario: (
    id: string,
    input: { result: Scenario["run"]["result"]; evidenceNote: string; recordingReviewed: boolean },
  ) => request<Scenario["run"]>(`/scenarios/${id}/run`, json("PATCH", input)),
  acceptance: () => request<AcceptanceItem[]>("/acceptance-checklist"),
  updateAcceptance: (key: string, input: { completed: boolean; evidence: string }) =>
    request<AcceptanceItem>(`/acceptance-checklist/${key}`, json("PATCH", input)),
  submission: () => request<SubmissionItem[]>("/submission-checklist"),
};
