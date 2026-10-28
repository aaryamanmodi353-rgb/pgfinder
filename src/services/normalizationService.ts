import { Visitor, VisitorField } from "../domain/types";

const missingTokens = new Set(["", "na", "n/a", "null", "none", "-"]);

export function normalizeOptionalText(value: unknown): string | null {
  if (value === null || value === undefined || typeof value !== "string") return null;
  const normalized = value.trim();
  return missingTokens.has(normalized.toLowerCase()) ? null : normalized;
}

export function getMissingFields(visitor: Partial<Visitor>): VisitorField[] {
  const missing: VisitorField[] = [];
  if (!normalizeOptionalText(visitor.name)) missing.push("name");
  if (!normalizeOptionalText(visitor.phone)) missing.push("phone");
  if (!normalizeOptionalText(visitor.city)) missing.push("city");
  if (!normalizeOptionalText(visitor.gender)) missing.push("gender");
  if (!visitor.budget || !Number.isFinite(visitor.budget.amount)) missing.push("budget");
  return missing;
}

export function normalizeVisitorTextFields<T extends Record<string, unknown>>(input: T): T {
  const result: Record<string, unknown> = { ...input };
  for (const field of ["name", "phone", "city", "gender"] as const) {
    if (field in result) result[field] = normalizeOptionalText(result[field]);
  }
  return result as T;
}
