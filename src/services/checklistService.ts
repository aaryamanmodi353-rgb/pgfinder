import { NotFoundError } from "../domain/errors";
import { AcceptanceItem } from "../domain/types";
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

  submission(): Array<{ key: string; label: string; complete: boolean }> {
    return [
      { key: "recordings", label: "Test call recordings", complete: false },
      { key: "account_email", label: "CallKaro account email", complete: false },
      { key: "agent_name", label: "Exact agent name created on CallKaro", complete: false },
    ];
  }
}
