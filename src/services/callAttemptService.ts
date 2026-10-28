import { NotFoundError } from "../domain/errors";
import { CallAttempt } from "../domain/types";
import { DataStore } from "../repositories/dataStore";
import { scenarioFixtures } from "../scenarios/fixtures";
import { buildMetadataPayload } from "./metadataService";

export class CallAttemptService {
  constructor(private readonly store: DataStore) {}

  async prepare(visitorId: string, scenarioId?: string): Promise<CallAttempt> {
    const visitor = await this.store.getVisitor(visitorId);
    if (!visitor) throw new NotFoundError("Visitor not found.");
    if (scenarioId && !scenarioFixtures.some((scenario) => scenario.id === scenarioId)) {
      throw new NotFoundError("Scenario not found.");
    }
    const attempt: Omit<CallAttempt, "id" | "createdAt"> = {
      visitorId,
      ...(scenarioId ? { scenarioId } : {}),
      status: "prepared",
      metadataSent: buildMetadataPayload(visitor),
    };
    return this.store.createAttempt(attempt);
  }

  list(): Promise<CallAttempt[]> {
    return this.store.listAttempts();
  }

  async get(id: string): Promise<CallAttempt> {
    const attempt = await this.store.getAttempt(id);
    if (!attempt) throw new NotFoundError("Call attempt not found.");
    return attempt;
  }

  async attachRecording(
    id: string,
    patch: {
      recordingUrl?: string;
      recordingFilename?: string;
      notes?: string;
      callkaroCallId?: string;
    },
  ): Promise<CallAttempt> {
    const attempt = await this.store.getAttempt(id);
    if (!attempt) throw new NotFoundError("Call attempt not found.");
    const recordingPatch: Partial<CallAttempt> = {};
    if (patch.recordingUrl !== undefined) recordingPatch.recordingUrl = patch.recordingUrl;
    if (patch.recordingFilename !== undefined)
      recordingPatch.recordingFilename = patch.recordingFilename;
    if (patch.notes !== undefined) recordingPatch.recordingNotes = patch.notes;
    if (patch.callkaroCallId !== undefined) recordingPatch.callkaroCallId = patch.callkaroCallId;
    const updated = await this.store.updateAttempt(id, recordingPatch);
    if (!updated) throw new NotFoundError("Call attempt not found.");
    return updated;
  }
}
