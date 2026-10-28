import { NotFoundError } from "../domain/errors";
import { AcceptanceItem, SubmissionDetails, SubmissionItem } from "../domain/types";
import { DataStore } from "../repositories/dataStore";
import { acceptanceDefaults } from "./acceptanceChecklist";

export class ChecklistService {
  constructor(private readonly store: DataStore) {}

  acceptance(): Promise<AcceptanceItem[]> {
    return this.store.listAcceptanceItems();
  }

  async updateAcceptance(
    key: string,
    input: Pick<AcceptanceItem, "completed" | "evidence">,
  ): Promise<AcceptanceItem> {
    if (!acceptanceDefaults.some((item) => item.key === key))
      throw new NotFoundError("Acceptance checklist item not found.");
    const item = await this.store.updateAcceptanceItem(key, input);
    if (!item) throw new NotFoundError("Acceptance checklist item not found.");
    return item;
  }

  async submission(): Promise<SubmissionItem[]> {
    const [attempts, details] = await Promise.all([
      this.store.listAttempts(),
      this.store.getSubmissionDetails(),
    ]);
    const recordings = attempts
      .filter((attempt) => attempt.recordingUrl || attempt.recordingFilename)
      .map((attempt) => ({
        attemptId: attempt.id,
        ...(attempt.recordingUrl ? { recordingUrl: attempt.recordingUrl } : {}),
        ...(attempt.recordingFilename ? { recordingFilename: attempt.recordingFilename } : {}),
        ...(attempt.callkaroCallId ? { callkaroCallId: attempt.callkaroCallId } : {}),
        createdAt: attempt.createdAt,
      }));

    return [
      {
        key: "recordings",
        label: "Test call recordings",
        complete: recordings.some((recording) => Boolean(recording.recordingUrl)),
        recordings,
      },
      {
        key: "account_email",
        label: "CallKaro account email",
        complete: Boolean(details.accountEmail),
        value: details.accountEmail,
      },
      {
        key: "agent_name",
        label: "Exact agent name created on CallKaro",
        complete: Boolean(details.agentName),
        value: details.agentName,
      },
    ];
  }

  updateSubmissionDetails(patch: Partial<SubmissionDetails>): Promise<SubmissionDetails> {
    return this.store.updateSubmissionDetails(patch);
  }
}
