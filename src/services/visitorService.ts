import { NotFoundError } from "../domain/errors";
import { Visitor, VisitorInput } from "../domain/types";
import { DataStore } from "../repositories/dataStore";
import { scenarioFixtures } from "../scenarios/fixtures";
import { buildMetadataPayload } from "./metadataService";
import { getMissingFields, normalizeVisitorTextFields } from "./normalizationService";

export class VisitorService {
  constructor(private readonly store: DataStore) {}

  async create(input: VisitorInput): Promise<Visitor> {
    return this.store.createVisitor(normalizeVisitorTextFields(input));
  }

  async list(): Promise<Visitor[]> {
    return (await this.store.listVisitors()).map((visitor) => ({
      ...visitor,
      missingFields: getMissingFields(visitor),
    }));
  }

  async get(id: string): Promise<Visitor> {
    const visitor = await this.store.getVisitor(id);
    if (!visitor) throw new NotFoundError("Visitor not found.");
    visitor.missingFields = getMissingFields(visitor);
    return visitor;
  }

  async update(id: string, patch: VisitorInput): Promise<Visitor> {
    const normalized = normalizeVisitorTextFields(patch);
    const updated = await this.store.updateVisitor(id, normalized);
    if (!updated) throw new NotFoundError("Visitor not found.");
    updated.missingFields = getMissingFields(updated);
    return updated;
  }

  async remove(id: string): Promise<void> {
    if (!(await this.store.deleteVisitor(id))) throw new NotFoundError("Visitor not found.");
  }

  async metadataPreview(
    id: string,
  ): Promise<{ payload: Record<string, unknown>; missingFields: string[] }> {
    const visitor = await this.get(id);
    return { payload: buildMetadataPayload(visitor), missingFields: visitor.missingFields };
  }

  async seed(): Promise<{ created: number; visitors: Visitor[] }> {
    const visitors = await Promise.all(
      scenarioFixtures.map((fixture) =>
        this.store.upsertScenarioVisitor(fixture.id, normalizeVisitorTextFields(fixture.metadata)),
      ),
    );
    return { created: visitors.length, visitors };
  }
}
