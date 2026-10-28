import { describe, expect, it } from "vitest";
import {
  getMissingFields,
  normalizeOptionalText,
  normalizeVisitorTextFields,
} from "../src/services/normalizationService";

describe("missing-value normalization", () => {
  it.each(["", "   ", "NA", "N/A", "null", "none", "-"])("treats %j as missing", (value) => {
    expect(normalizeOptionalText(value)).toBeNull();
  });

  it("trims usable text and treats non-string values as missing", () => {
    expect(normalizeOptionalText("  Bengaluru  ")).toBe("Bengaluru");
    expect(normalizeOptionalText(undefined)).toBeNull();
    expect(normalizeOptionalText(1200)).toBeNull();
  });

  it("computes every missing visitor field without assuming values", () => {
    expect(
      getMissingFields({ name: "", phone: "NA", city: null, gender: "-", budget: null }),
    ).toEqual(["name", "phone", "city", "gender", "budget"]);
  });

  it("normalizes only text fields and preserves the budget object", () => {
    const normalized = normalizeVisitorTextFields({
      name: "  A Synthetic Person  ",
      phone: " N/A ",
      city: " Chennai ",
      gender: " any ",
      budget: { amount: 18000, isApproximate: true },
    });
    expect(normalized).toEqual({
      name: "A Synthetic Person",
      phone: null,
      city: "Chennai",
      gender: "any",
      budget: { amount: 18000, isApproximate: true },
    });
  });
});
