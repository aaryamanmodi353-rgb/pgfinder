import { CallOutcome, CallResultInput } from "../domain/types";

type QualificationSnapshot = Pick<
  CallResultInput,
  "preferredCity" | "genderPreference" | "monthlyBudgetInr" | "moveInDate" | "stayDuration"
>;

export type OutcomeClassification = { outcome: CallOutcome; reasons: string[] };

function isCaptured(status: string, value: unknown): boolean {
  if (status === "unknown" || status === "declined") return true;
  if (typeof value === "string") return value.trim().length > 0;
  return value !== null && value !== undefined;
}

export function classifyOutcome(
  reportedOutcome: CallOutcome,
  qualification: QualificationSnapshot,
): OutcomeClassification {
  if (reportedOutcome === "wrong_number") {
    return { outcome: "wrong_number", reasons: ["The reported outcome is a wrong number."] };
  }
  if (reportedOutcome === "not_interested") {
    return { outcome: "not_interested", reasons: ["The person declined further interest."] };
  }
  if (reportedOutcome === "busy" || reportedOutcome === "callback_requested") {
    return {
      outcome: reportedOutcome,
      reasons: [
        reportedOutcome === "busy"
          ? "The person was busy."
          : "The person requested a callback; none is marked scheduled.",
      ],
    };
  }
  if (["no_answer", "voicemail", "disconnected"].includes(reportedOutcome)) {
    return {
      outcome: reportedOutcome,
      reasons: [`The call ended as ${reportedOutcome.replaceAll("_", " ")}.`],
    };
  }

  const missing: string[] = [];
  if (!isCaptured(qualification.preferredCity.status, qualification.preferredCity.value))
    missing.push("city");
  if (!isCaptured(qualification.genderPreference.status, qualification.genderPreference.value))
    missing.push("gender preference");
  if (!isCaptured(qualification.monthlyBudgetInr.status, qualification.monthlyBudgetInr.amount))
    missing.push("monthly budget");
  const moveInValue = qualification.moveInDate.isoDate ?? qualification.moveInDate.statedText;
  if (!isCaptured(qualification.moveInDate.status, moveInValue)) missing.push("move-in date");
  const durationValue = qualification.stayDuration.months ?? qualification.stayDuration.statedText;
  if (!isCaptured(qualification.stayDuration.status, durationValue)) missing.push("stay duration");

  if (reportedOutcome === "completed" && missing.length === 0) {
    return {
      outcome: "completed",
      reasons: [
        "All five qualification fields were captured or explicitly marked unknown/declined.",
      ],
    };
  }
  if (reportedOutcome === "completed") {
    return { outcome: "partial", reasons: [`Qualification is incomplete: ${missing.join(", ")}.`] };
  }
  return {
    outcome: "partial",
    reasons: ["The call did not satisfy a higher-priority outcome or completed qualification."],
  };
}
