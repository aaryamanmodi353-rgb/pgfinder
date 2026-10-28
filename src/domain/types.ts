import { z } from "zod";

export const visitorFields = ["name", "phone", "city", "gender", "budget"] as const;
export type VisitorField = (typeof visitorFields)[number];

export const budgetSchema = z.object({
  amount: z.number().finite().nonnegative(),
  isApproximate: z.boolean(),
});

export const visitorInputSchema = z.object({
  name: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  gender: z.string().nullable().optional(),
  budget: budgetSchema.nullable().optional(),
});
export type VisitorInput = z.infer<typeof visitorInputSchema>;

export type Visitor = {
  id: string;
  name?: string | null;
  phone?: string | null;
  city?: string | null;
  gender?: string | null;
  budget?: z.infer<typeof budgetSchema> | null;
  createdAt: Date;
  source: "synthetic";
  missingFields: VisitorField[];
};

export const captureStatusSchema = z.enum([
  "confirmed",
  "corrected",
  "provided",
  "declined",
  "unknown",
]);
export const temporalStatusSchema = z.enum(["exact", "tentative", "declined", "unknown"]);
export const callOutcomeSchema = z.enum([
  "completed",
  "callback_requested",
  "busy",
  "wrong_number",
  "not_interested",
  "no_answer",
  "voicemail",
  "disconnected",
  "partial",
]);
export type CallOutcome = z.infer<typeof callOutcomeSchema>;
export const nextActionSchema = z.enum([
  "follow_up_call",
  "send_options",
  "schedule_callback_manually",
  "do_not_contact",
  "none",
]);
export const languageSchema = z.enum(["hindi", "english", "hinglish", "mixed"]);

const requiredValue = z.string().trim().min(1).nullable();

export const callResultInputSchema = z
  .object({
    customerName: z.object({
      value: requiredValue,
      status: z.enum(["confirmed", "corrected", "provided", "unknown"]),
    }),
    contactPhone: z.object({
      value: requiredValue,
      status: z.enum(["confirmed", "corrected", "provided", "declined", "unknown"]),
    }),
    preferredCity: z.object({ value: requiredValue, status: captureStatusSchema }),
    genderPreference: z.object({ value: requiredValue, status: captureStatusSchema }),
    monthlyBudgetInr: z.object({
      amount: z.number().finite().nonnegative().nullable(),
      isApproximate: z.boolean(),
      status: captureStatusSchema,
    }),
    moveInDate: z.object({
      isoDate: z.string().date().nullable(),
      statedText: z.string().trim().max(200).nullable(),
      status: temporalStatusSchema,
    }),
    stayDuration: z.object({
      months: z.number().finite().positive().nullable(),
      statedText: z.string().trim().max(200).nullable(),
      status: temporalStatusSchema,
    }),
    callOutcome: callOutcomeSchema,
    callbackRequestedTime: z.string().trim().max(200).nullable().optional(),
    callbackScheduled: z.boolean().optional(),
    missingInformation: z.array(z.string().trim().min(1).max(80)).max(20),
    callSummary: z.string().trim().max(400),
    nextAction: nextActionSchema,
    languageUsed: languageSchema,
  })
  .superRefine((result, ctx) => {
    if (result.moveInDate.status === "exact" && !result.moveInDate.isoDate) {
      ctx.addIssue({
        code: "custom",
        path: ["moveInDate", "isoDate"],
        message: "Exact move-in needs an ISO date.",
      });
    }
    if (result.moveInDate.status === "tentative" && !result.moveInDate.statedText) {
      ctx.addIssue({
        code: "custom",
        path: ["moveInDate", "statedText"],
        message: "Tentative move-in needs stated text.",
      });
    }
    if (result.stayDuration.status === "exact" && !result.stayDuration.months) {
      ctx.addIssue({
        code: "custom",
        path: ["stayDuration", "months"],
        message: "Exact duration needs months.",
      });
    }
    if (result.stayDuration.status === "tentative" && !result.stayDuration.statedText) {
      ctx.addIssue({
        code: "custom",
        path: ["stayDuration", "statedText"],
        message: "Tentative duration needs stated text.",
      });
    }
  });

export type CallResultInput = z.infer<typeof callResultInputSchema>;
export type CallResult = Omit<CallResultInput, "callbackScheduled"> & {
  id: string;
  attemptId: string;
  visitorId?: string;
  callbackScheduled: false;
  reasons: string[];
  createdAt: Date;
};

export const attemptStatusSchema = z.enum([
  "prepared",
  "awaiting_result",
  "received",
  "received_unmapped",
  "reviewed",
]);
export type CallAttemptStatus = z.infer<typeof attemptStatusSchema>;

export type CallAttempt = {
  id: string;
  visitorId?: string;
  scenarioId?: string;
  status: CallAttemptStatus;
  metadataSent: Record<string, unknown>;
  callkaroCallId?: string;
  recordingUrl?: string;
  recordingFilename?: string;
  recordingNotes?: string;
  rawPayload?: unknown;
  payloadHash?: string;
  mappingError?: string;
  createdAt: Date;
};

export type ScenarioRun = {
  id: string;
  scenarioId: string;
  result: "not_run" | "passed" | "failed";
  evidenceNote: string;
  recordingReviewed: boolean;
  updatedAt: Date;
};

export type AuditLog = {
  id: string;
  visitorId: string;
  field: VisitorField;
  oldValue: unknown;
  newValue: unknown;
  source: string;
  createdAt: Date;
};

export type AcceptanceItem = {
  key: string;
  title: string;
  description: string;
  completed: boolean;
  evidence: string;
};

export type SubmissionDetails = {
  accountEmail: string | null;
  agentName: string | null;
};

export type SubmissionRecording = {
  attemptId: string;
  recordingUrl?: string;
  recordingFilename?: string;
  callkaroCallId?: string;
  createdAt: Date;
};

export type SubmissionItem = {
  key: "recordings" | "account_email" | "agent_name";
  label: string;
  complete: boolean;
  value?: string | null;
  recordings?: SubmissionRecording[];
};

export type StoredWebhook = { attempt: CallAttempt; duplicate: boolean };

export type MappedWebhook = {
  callkaroCallId?: string;
  visitorId?: string;
  result: CallResultInput;
};
