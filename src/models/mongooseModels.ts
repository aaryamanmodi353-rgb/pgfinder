import mongoose, { Model, Schema } from "mongoose";

const Mixed = Schema.Types.Mixed;

const visitorSchema = new Schema(
  {
    _id: { type: String, required: true },
    name: { type: String, default: null },
    phone: { type: String, default: null },
    city: { type: String, default: null },
    gender: { type: String, default: null },
    budget: { type: Mixed, default: null },
    createdAt: { type: Date, required: true },
    source: { type: String, enum: ["synthetic"], required: true, default: "synthetic" },
    scenarioId: { type: String, sparse: true, unique: true },
  },
  { versionKey: false, minimize: false },
);

const attemptSchema = new Schema(
  {
    _id: { type: String, required: true },
    visitorId: String,
    scenarioId: String,
    status: {
      type: String,
      enum: ["prepared", "awaiting_result", "received", "received_unmapped", "reviewed"],
      required: true,
    },
    metadataSent: { type: Mixed, required: true },
    callkaroCallId: String,
    recordingUrl: String,
    recordingFilename: String,
    recordingNotes: String,
    rawPayload: Mixed,
    payloadHash: { type: String, sparse: true, unique: true },
    mappingError: String,
    createdAt: { type: Date, required: true },
  },
  { versionKey: false, minimize: false },
);

const resultSchema = new Schema(
  {
    _id: { type: String, required: true },
    attemptId: { type: String, required: true, unique: true },
    visitorId: String,
    customerName: { type: Mixed, required: true },
    contactPhone: { type: Mixed, required: true },
    preferredCity: { type: Mixed, required: true },
    genderPreference: { type: Mixed, required: true },
    monthlyBudgetInr: { type: Mixed, required: true },
    moveInDate: { type: Mixed, required: true },
    stayDuration: { type: Mixed, required: true },
    callOutcome: { type: String, required: true },
    callbackRequestedTime: String,
    callbackScheduled: { type: Boolean, required: true, default: false },
    missingInformation: { type: [String], required: true },
    callSummary: { type: String, required: true, maxlength: 400 },
    nextAction: { type: String, required: true },
    languageUsed: { type: String, required: true },
    reasons: { type: [String], required: true },
    createdAt: { type: Date, required: true },
  },
  { versionKey: false, minimize: false },
);

const auditSchema = new Schema(
  {
    _id: { type: String, required: true },
    visitorId: { type: String, required: true, index: true },
    field: { type: String, required: true },
    oldValue: Mixed,
    newValue: Mixed,
    source: { type: String, required: true },
    createdAt: { type: Date, required: true },
  },
  { versionKey: false, minimize: false },
);

const scenarioRunSchema = new Schema(
  {
    _id: { type: String, required: true },
    scenarioId: { type: String, required: true, unique: true },
    result: { type: String, enum: ["not_run", "passed", "failed"], required: true },
    evidenceNote: { type: String, required: true },
    recordingReviewed: { type: Boolean, required: true },
    updatedAt: { type: Date, required: true },
  },
  { versionKey: false },
);

const acceptanceSchema = new Schema(
  {
    _id: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    completed: { type: Boolean, required: true },
    evidence: { type: String, required: true },
  },
  { versionKey: false },
);

function typedModel(name: string, schema: Schema): Model<unknown> {
  const cached = mongoose.models[name] as Model<unknown> | undefined;
  return cached ?? mongoose.model<unknown>(name, schema);
}

export const VisitorModel = typedModel("Visitor", visitorSchema);
export const CallAttemptModel = typedModel("CallAttempt", attemptSchema);
export const CallResultModel = typedModel("CallResult", resultSchema);
export const AuditLogModel = typedModel("AuditLog", auditSchema);
export const ScenarioRunModel = typedModel("ScenarioRun", scenarioRunSchema);
export const AcceptanceModel = typedModel("AcceptanceItem", acceptanceSchema);
