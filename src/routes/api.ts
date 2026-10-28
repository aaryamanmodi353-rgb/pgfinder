import { Router } from "express";
import { z } from "zod";
import { AppError } from "../domain/errors";
import { budgetSchema, visitorInputSchema } from "../domain/types";
import { asyncHandler } from "../http/asyncHandler";
import { validateBody, validateParams, webhookSecret } from "../http/middleware";
import { createControllers } from "../controllers/controllers";
import { DataStore } from "../repositories/dataStore";
import { CallAttemptService } from "../services/callAttemptService";
import { ChecklistService } from "../services/checklistService";
import { ResultService } from "../services/resultService";
import { ScenarioService } from "../services/scenarioService";
import { VisitorService } from "../services/visitorService";
import { WebhookService } from "../services/webhookService";
import { CallKaroPathConfig } from "../adapters/callkaroAdapter";

const idParams = z.object({ id: z.string().trim().min(1).max(128) });
const keyParams = z.object({ key: z.string().trim().min(1).max(80) });
const visitorBody = visitorInputSchema.strict();
const visitorPatch = z
  .object({
    name: z.string().nullable().optional(),
    phone: z.string().nullable().optional(),
    city: z.string().nullable().optional(),
    gender: z.string().nullable().optional(),
    budget: budgetSchema.nullable().optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, "At least one visitor field is required.");
const prepareAttemptBody = z
  .object({
    visitorId: z.string().trim().min(1),
    scenarioId: z.string().trim().min(1).optional(),
  })
  .strict();
const recordingBody = z
  .object({
    recordingUrl: z.string().trim().min(1).max(2000).optional(),
    recordingFilename: z.string().trim().min(1).max(260).optional(),
    notes: z.string().trim().max(1000).optional(),
    callkaroCallId: z.string().trim().min(1).max(200).optional(),
  })
  .strict()
  .refine(
    (value) =>
      Boolean(value.recordingUrl || value.recordingFilename || value.notes || value.callkaroCallId),
    {
      message: "Provide a recording URL, filename, notes, or CallKaro call ID.",
    },
  );
const scenarioRunBody = z
  .object({
    result: z.enum(["not_run", "passed", "failed"]),
    evidenceNote: z.string().trim().max(1000).default(""),
    recordingReviewed: z.boolean().default(false),
  })
  .strict();
const acceptanceBody = z
  .object({
    completed: z.boolean(),
    evidence: z.string().trim().max(1000).default(""),
  })
  .strict();
const submissionDetailsBody = z
  .object({
    accountEmail: z.string().trim().email().max(254).nullable().optional(),
    agentName: z.string().trim().min(1).max(120).nullable().optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, "Provide at least one submission detail.");

export function createApiRouter(options: {
  store: DataStore;
  webhookSecret: string;
  callKaroPaths?: CallKaroPathConfig | undefined;
}) {
  const { store } = options;
  const controllers = createControllers({
    visitors: new VisitorService(store),
    attempts: new CallAttemptService(store),
    webhooks: new WebhookService(store, options.callKaroPaths),
    results: new ResultService(store),
    scenarios: new ScenarioService(store),
    checklists: new ChecklistService(store),
  });
  const router = Router();
  router.get("/health", (_request, response) =>
    response.json({ status: "ok", storage: store.mode }),
  );

  router.post("/visitors", validateBody(visitorBody), asyncHandler(controllers.createVisitor));
  router.get("/visitors", asyncHandler(controllers.listVisitors));
  router.post("/visitors/seed", asyncHandler(controllers.seedVisitors));
  router.get(
    "/visitors/:id/metadata-preview",
    validateParams(idParams),
    asyncHandler(controllers.metadataPreview),
  );
  router.get("/visitors/:id", validateParams(idParams), asyncHandler(controllers.getVisitor));
  router.patch(
    "/visitors/:id",
    validateParams(idParams),
    validateBody(visitorPatch),
    asyncHandler(controllers.updateVisitor),
  );
  router.delete("/visitors/:id", validateParams(idParams), asyncHandler(controllers.deleteVisitor));

  router.post(
    "/call-attempts",
    validateBody(prepareAttemptBody),
    asyncHandler(controllers.createAttempt),
  );
  router.get("/call-attempts", asyncHandler(controllers.listAttempts));
  router.get("/call-attempts/:id", validateParams(idParams), asyncHandler(controllers.getAttempt));
  router.patch(
    "/call-attempts/:id/recording",
    validateParams(idParams),
    validateBody(recordingBody),
    asyncHandler(controllers.attachRecording),
  );

  router.post(
    "/webhooks/callkaro",
    webhookSecret(options.webhookSecret),
    asyncHandler(controllers.receiveWebhook),
  );

  router.get("/results", asyncHandler(controllers.listResults));
  router.get("/results/:id", validateParams(idParams), asyncHandler(controllers.getResult));
  router.post(
    "/results/:id/apply-corrections",
    validateParams(idParams),
    asyncHandler(controllers.applyCorrections),
  );

  router.get("/scenarios", asyncHandler(controllers.listScenarios));
  router.patch(
    "/scenarios/:id/run",
    validateParams(idParams),
    validateBody(scenarioRunBody),
    asyncHandler(controllers.markScenarioRun),
  );
  router.get("/acceptance-checklist", asyncHandler(controllers.acceptanceChecklist));
  router.patch(
    "/acceptance-checklist/:key",
    validateParams(keyParams),
    validateBody(acceptanceBody),
    asyncHandler(controllers.updateAcceptance),
  );
  router.get("/submission-checklist", asyncHandler(controllers.submissionChecklist));
  router.patch(
    "/submission-checklist",
    validateBody(submissionDetailsBody),
    asyncHandler(controllers.updateSubmissionDetails),
  );

  router.use((_request, _response, next) =>
    next(new AppError("Route not found.", 404, "NOT_FOUND")),
  );
  return router;
}
