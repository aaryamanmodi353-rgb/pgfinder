import { NotFoundError } from "../domain/errors";
import { ScenarioRun } from "../domain/types";
import { DataStore } from "../repositories/dataStore";
import { scenarioFixtures } from "../scenarios/fixtures";

export class ScenarioService {
  constructor(private readonly store: DataStore) {}

  async list(): Promise<Array<Record<string, unknown>>> {
    const runs = new Map((await this.store.listScenarioRuns()).map((run) => [run.scenarioId, run]));
    return scenarioFixtures.map((fixture) => ({
      ...fixture,
      run: runs.get(fixture.id) ?? {
        scenarioId: fixture.id,
        result: "not_run",
        evidenceNote: "",
        recordingReviewed: false,
      },
    }));
  }

  async markRun(
    scenarioId: string,
    input: {
      result: "not_run" | "passed" | "failed";
      evidenceNote: string;
      recordingReviewed: boolean;
    },
  ): Promise<ScenarioRun> {
    if (!scenarioFixtures.some((fixture) => fixture.id === scenarioId))
      throw new NotFoundError("Scenario not found.");
    return this.store.saveScenarioRun({ scenarioId, ...input });
  }
}
