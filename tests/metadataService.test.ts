import { describe, expect, it } from "vitest";
import { Visitor } from "../src/domain/types";
import { buildMetadataPayload } from "../src/services/metadataService";

function visitor(patch: Partial<Visitor> = {}): Visitor {
  return {
    id: "synthetic-id",
    name: "Synthetic Visitor",
    phone: null,
    city: "Gurgaon",
    gender: null,
    budget: { amount: 18000, isApproximate: true },
    createdAt: new Date(0),
    source: "synthetic",
    missingFields: [],
    ...patch,
  };
}

describe("metadata builder", () => {
  it("emits no guessed provider syntax while the default config is unverified", () => {
    expect(buildMetadataPayload(visitor())).toEqual({});
  });

  it("uses only configured variable names and omits missing fields", () => {
    const config = {
      envelopeKey: "verifiedEnvelope",
      variables: {
        name: "verified_name",
        phone: "verified_phone",
        city: "verified_city",
        budget: "verified_budget",
        budgetIsApproximate: "verified_budget_approx",
      },
    };
    expect(buildMetadataPayload(visitor(), config)).toEqual({
      verifiedEnvelope: {
        verified_name: "Synthetic Visitor",
        verified_city: "Gurgaon",
        verified_budget: "18000",
        verified_budget_approx: "true",
      },
    });
  });

  it("preserves a zero monthly budget and exact approximation flag when configured", () => {
    const config = { envelopeKey: "vars", variables: { budget: "budget" } };
    expect(
      buildMetadataPayload(visitor({ budget: { amount: 0, isApproximate: false } }), config),
    ).toEqual({ vars: { budget: "0" } });
  });
});
