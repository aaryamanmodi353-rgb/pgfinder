import { NotFoundError } from "../domain/errors";
import { CallResult, VisitorField, VisitorInput } from "../domain/types";
import { DataStore } from "../repositories/dataStore";

type Correction = { field: VisitorField; oldValue: unknown; newValue: unknown };

export class ResultService {
  constructor(private readonly store: DataStore) {}

  list(): Promise<CallResult[]> {
    return this.store.listResults();
  }

  async get(id: string): Promise<CallResult> {
    const result = await this.store.getResult(id);
    if (!result) throw new NotFoundError("Call result not found.");
    return result;
  }

  async applyCorrections(id: string): Promise<{ result: CallResult; corrections: Correction[] }> {
    const result = await this.get(id);
    if (!result.visitorId) return { result, corrections: [] };
    const visitor = await this.store.getVisitor(result.visitorId);
    if (!visitor) return { result, corrections: [] };

    const corrections: Correction[] = [];
    if (result.customerName.status === "corrected" && result.customerName.value) {
      corrections.push({
        field: "name",
        oldValue: visitor.name ?? null,
        newValue: result.customerName.value,
      });
    }
    if (result.contactPhone.status === "corrected" && result.contactPhone.value) {
      corrections.push({
        field: "phone",
        oldValue: visitor.phone ?? null,
        newValue: result.contactPhone.value,
      });
    }
    if (result.preferredCity.status === "corrected" && result.preferredCity.value) {
      corrections.push({
        field: "city",
        oldValue: visitor.city ?? null,
        newValue: result.preferredCity.value,
      });
    }
    if (result.genderPreference.status === "corrected" && result.genderPreference.value) {
      corrections.push({
        field: "gender",
        oldValue: visitor.gender ?? null,
        newValue: result.genderPreference.value,
      });
    }
    if (result.monthlyBudgetInr.status === "corrected" && result.monthlyBudgetInr.amount !== null) {
      corrections.push({
        field: "budget",
        oldValue: visitor.budget ?? null,
        newValue: {
          amount: result.monthlyBudgetInr.amount,
          isApproximate: result.monthlyBudgetInr.isApproximate,
        },
      });
    }

    const patch: VisitorInput = {};
    for (const correction of corrections) {
      if (correction.field === "name") patch.name = String(correction.newValue);
      if (correction.field === "phone") patch.phone = String(correction.newValue);
      if (correction.field === "city") patch.city = String(correction.newValue);
      if (correction.field === "gender") patch.gender = String(correction.newValue);
      if (correction.field === "budget")
        patch.budget = correction.newValue as NonNullable<VisitorInput["budget"]>;
    }
    if (corrections.length) {
      await this.store.updateVisitor(visitor.id, patch);
      for (const correction of corrections) {
        await this.store.addAudit({
          visitorId: visitor.id,
          field: correction.field,
          oldValue: correction.oldValue,
          newValue: correction.newValue,
          source: "call_result:" + result.id,
        });
      }
    }
    await this.store.updateAttempt(result.attemptId, { status: "reviewed" });
    return { result, corrections };
  }
}
