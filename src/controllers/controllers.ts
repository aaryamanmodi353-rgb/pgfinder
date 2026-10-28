import { Request, Response } from "express";
import { AppError } from "../domain/errors";
import { VisitorInput } from "../domain/types";
import { CallAttemptService } from "../services/callAttemptService";
import { ChecklistService } from "../services/checklistService";
import { ResultService } from "../services/resultService";
import { ScenarioService } from "../services/scenarioService";
import { VisitorService } from "../services/visitorService";
import { WebhookService } from "../services/webhookService";

type Services = {
  visitors: VisitorService;
  attempts: CallAttemptService;
  webhooks: WebhookService;
  results: ResultService;
  scenarios: ScenarioService;
  checklists: ChecklistService;
};

function pathValue(request: Request, key: string): string {
  const value = request.params[key];
  if (typeof value !== "string")
    throw new AppError("Path parameter must be a string.", 400, "VALIDATION_ERROR");
  return value;
}

export function createControllers(services: Services) {
  return {
    createVisitor: async (request: Request, response: Response) =>
      response.status(201).json(await services.visitors.create(request.body as VisitorInput)),
    listVisitors: async (_request: Request, response: Response) =>
      response.json(await services.visitors.list()),
    getVisitor: async (request: Request, response: Response) =>
      response.json(await services.visitors.get(pathValue(request, "id"))),
    updateVisitor: async (request: Request, response: Response) =>
      response.json(
        await services.visitors.update(pathValue(request, "id"), request.body as VisitorInput),
      ),
    deleteVisitor: async (request: Request, response: Response) => {
      await services.visitors.remove(pathValue(request, "id"));
      response.status(204).end();
    },
    metadataPreview: async (request: Request, response: Response) =>
      response.json(await services.visitors.metadataPreview(pathValue(request, "id"))),
    seedVisitors: async (_request: Request, response: Response) =>
      response.status(201).json(await services.visitors.seed()),
    createAttempt: async (request: Request, response: Response) => {
      const body = request.body as { visitorId: string; scenarioId?: string };
      response.status(201).json(await services.attempts.prepare(body.visitorId, body.scenarioId));
    },
    listAttempts: async (_request: Request, response: Response) =>
      response.json(await services.attempts.list()),
    getAttempt: async (request: Request, response: Response) =>
      response.json(await services.attempts.get(pathValue(request, "id"))),
    attachRecording: async (request: Request, response: Response) =>
      response.json(
        await services.attempts.attachRecording(
          pathValue(request, "id"),
          request.body as {
            recordingUrl?: string;
            recordingFilename?: string;
            notes?: string;
            callkaroCallId?: string;
          },
        ),
      ),
    receiveWebhook: async (request: Request, response: Response) => {
      const result = await services.webhooks.receive(request.body);
      response
        .status(result.duplicate ? 200 : result.attempt.status === "received" ? 202 : 202)
        .json(result);
    },
    listResults: async (_request: Request, response: Response) =>
      response.json(await services.results.list()),
    getResult: async (request: Request, response: Response) =>
      response.json(await services.results.get(pathValue(request, "id"))),
    applyCorrections: async (request: Request, response: Response) =>
      response.json(await services.results.applyCorrections(pathValue(request, "id"))),
    listScenarios: async (_request: Request, response: Response) =>
      response.json(await services.scenarios.list()),
    markScenarioRun: async (request: Request, response: Response) =>
      response.json(
        await services.scenarios.markRun(
          pathValue(request, "id"),
          request.body as {
            result: "not_run" | "passed" | "failed";
            evidenceNote: string;
            recordingReviewed: boolean;
          },
        ),
      ),
    acceptanceChecklist: async (_request: Request, response: Response) =>
      response.json(await services.checklists.acceptance()),
    updateAcceptance: async (request: Request, response: Response) =>
      response.json(
        await services.checklists.updateAcceptance(
          pathValue(request, "key"),
          request.body as {
            completed: boolean;
            evidence: string;
          },
        ),
      ),
    submissionChecklist: async (_request: Request, response: Response) =>
      response.json(services.checklists.submission()),
  };
}
