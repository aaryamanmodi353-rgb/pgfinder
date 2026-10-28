export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "PG Finder Ops Console API",
    version: "1.0.0",
    description:
      "Synthetic-data companion API for preparing metadata, recording test calls, mapping post-call results, and tracking QA scenarios.",
  },
  servers: [{ url: "/api/v1" }],
  tags: [
    { name: "Health" },
    { name: "Visitors" },
    { name: "Call attempts" },
    { name: "Webhook" },
    { name: "Results" },
    { name: "Scenarios and QA" },
  ],
  paths: {
    "/health": {
      get: {
        tags: ["Health"],
        summary: "Check API/storage health",
        responses: { "200": { description: "Healthy" } },
      },
    },
    "/visitors": {
      get: {
        tags: ["Visitors"],
        summary: "List synthetic visitors",
        responses: { "200": { description: "Visitor list" } },
      },
      post: {
        tags: ["Visitors"],
        summary: "Create a visitor",
        responses: {
          "201": { description: "Created" },
          "400": { description: "Validation error" },
        },
      },
    },
    "/visitors/seed": {
      post: {
        tags: ["Visitors"],
        summary: "Seed the 14 synthetic scenario visitors",
        responses: { "201": { description: "Seeded visitors" } },
      },
    },
    "/visitors/{id}": {
      get: {
        tags: ["Visitors"],
        summary: "Get a visitor",
        parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Visitor" }, "404": { description: "Not found" } },
      },
      patch: {
        tags: ["Visitors"],
        summary: "Update visitor fields",
        responses: {
          "200": { description: "Updated visitor" },
          "400": { description: "Validation error" },
        },
      },
      delete: {
        tags: ["Visitors"],
        summary: "Delete a visitor",
        responses: { "204": { description: "Deleted" } },
      },
    },
    "/visitors/{id}/metadata-preview": {
      get: {
        tags: ["Visitors"],
        summary: "Preview the null-safe provider metadata payload",
        responses: { "200": { description: "Payload and missing fields" } },
      },
    },
    "/call-attempts": {
      get: {
        tags: ["Call attempts"],
        summary: "List attempts",
        responses: { "200": { description: "Attempt list" } },
      },
      post: {
        tags: ["Call attempts"],
        summary: "Prepare an attempt using a metadata snapshot",
        responses: { "201": { description: "Prepared attempt" } },
      },
    },
    "/call-attempts/{id}": {
      get: {
        tags: ["Call attempts"],
        summary: "Get an attempt",
        responses: { "200": { description: "Attempt" } },
      },
    },
    "/call-attempts/{id}/recording": {
      patch: {
        tags: ["Call attempts"],
        summary: "Attach a recording reference and notes",
        responses: { "200": { description: "Updated attempt" } },
      },
    },
    "/webhooks/callkaro": {
      post: {
        tags: ["Webhook"],
        summary: "Persist a webhook and map it when configured",
        parameters: [
          { in: "header", name: "x-callkaro-secret", required: false, schema: { type: "string" } },
        ],
        responses: {
          "202": { description: "Stored (mapped or received_unmapped)" },
          "401": { description: "Secret rejected when configured" },
        },
      },
    },
    "/results": {
      get: {
        tags: ["Results"],
        summary: "List mapped call results",
        responses: { "200": { description: "Result list" } },
      },
    },
    "/results/{id}": {
      get: {
        tags: ["Results"],
        summary: "Get a result",
        responses: { "200": { description: "Result" } },
      },
    },
    "/results/{id}/apply-corrections": {
      post: {
        tags: ["Results"],
        summary: "Apply corrected values and write audit entries",
        responses: { "200": { description: "Result and applied corrections" } },
      },
    },
    "/scenarios": {
      get: {
        tags: ["Scenarios and QA"],
        summary: "List all 14 scenario fixtures and run state",
        responses: { "200": { description: "Fixtures and results" } },
      },
    },
    "/scenarios/{id}/run": {
      patch: {
        tags: ["Scenarios and QA"],
        summary: "Record a scenario outcome and evidence",
        responses: { "200": { description: "Run status" } },
      },
    },
    "/acceptance-checklist": {
      get: {
        tags: ["Scenarios and QA"],
        summary: "List acceptance criteria",
        responses: { "200": { description: "Checklist" } },
      },
    },
    "/acceptance-checklist/{key}": {
      patch: {
        tags: ["Scenarios and QA"],
        summary: "Update acceptance evidence",
        responses: { "200": { description: "Updated item" } },
      },
    },
    "/submission-checklist": {
      get: {
        tags: ["Scenarios and QA"],
        summary: "List exactly the three assignment submission items and their status",
        responses: { "200": { description: "Three submission items with saved details" } },
      },
      patch: {
        tags: ["Scenarios and QA"],
        summary: "Save the CallKaro account email or exact agent name",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  accountEmail: { type: "string", format: "email", nullable: true },
                  agentName: { type: "string", maxLength: 120, nullable: true },
                },
                additionalProperties: false,
              },
            },
          },
        },
        responses: { "200": { description: "Saved submission details" } },
      },
    },
  },
};
