import variableConfig from "../../config/callkaro.variables.json";
import { Visitor, VisitorField } from "../domain/types";
import { normalizeOptionalText } from "./normalizationService";

export type MetadataConfig = {
  envelopeKey: string | null;
  variables: Partial<Record<VisitorField | "budgetIsApproximate", string | null>>;
};

const defaultConfig = variableConfig as MetadataConfig;

export function buildMetadataPayload(
  visitor: Visitor,
  config: MetadataConfig = defaultConfig,
): Record<string, unknown> {
  const values: Record<string, string> = {};
  const possible: Partial<Record<VisitorField | "budgetIsApproximate", string | null>> = {
    name: normalizeOptionalText(visitor.name),
    phone: normalizeOptionalText(visitor.phone),
    city: normalizeOptionalText(visitor.city),
    gender: normalizeOptionalText(visitor.gender),
    budget:
      visitor.budget && Number.isFinite(visitor.budget.amount)
        ? String(visitor.budget.amount)
        : null,
    budgetIsApproximate: visitor.budget ? String(visitor.budget.isApproximate) : null,
  };

  for (const [semanticKey, providerName] of Object.entries(config.variables)) {
    const value = possible[semanticKey as keyof typeof possible];
    if (providerName?.trim() && value !== null && value !== undefined) values[providerName] = value;
  }

  // VERIFY AGAINST docs.callkaro.ai: the provider's metadata envelope key and omission behavior.
  if (!config.envelopeKey) return {};
  return { [config.envelopeKey]: values };
}
