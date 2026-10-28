import { AcceptanceItem } from "../domain/types";

export const acceptanceDefaults: AcceptanceItem[] = [
  {
    key: "call-flow",
    title: "Call flow is clear",
    description:
      "The agent introduces itself, confirms the purpose, and gathers qualification details in a sensible order.",
    completed: false,
    evidence: "",
  },
  {
    key: "natural-conversation",
    title: "Conversation feels natural",
    description:
      "The agent listens, handles language preference, and avoids sounding like a rigid form.",
    completed: false,
    evidence: "",
  },
  {
    key: "missing-data",
    title: "Missing data is safe",
    description: "Missing values are normalized and omitted from metadata.",
    completed: false,
    evidence: "",
  },
  {
    key: "corrections-audited",
    title: "Corrections are auditable",
    description:
      "Call corrections update synthetic visitors and record old value, new value, and source.",
    completed: false,
    evidence: "",
  },
  {
    key: "outcome-priority",
    title: "Outcome priority is enforced",
    description:
      "Wrong number, opt-out, callback/busy, and unsuccessful outcomes follow the required priority.",
    completed: false,
    evidence: "",
  },
  {
    key: "unmapped-webhooks",
    title: "Unknown webhooks are retained",
    description: "Raw webhook payloads remain visible when provider mapping is not verified.",
    completed: false,
    evidence: "",
  },
  {
    key: "synthetic-only",
    title: "Fixtures use synthetic data",
    description: "Seeded visitor and scenario data is fictional and labeled synthetic.",
    completed: false,
    evidence: "",
  },
];
