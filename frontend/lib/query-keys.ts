export const keys = {
  visitors: ["visitors"] as const,
  attempts: ["attempts"] as const,
  results: ["results"] as const,
  scenarios: ["scenarios"] as const,
  acceptance: ["acceptance"] as const,
  submission: ["submission"] as const,
  health: ["health"] as const,
  metadata: (id: string) => ["metadata", id] as const,
};
