"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { keys } from "@/lib/query-keys";
import type { AcceptanceItem, Scenario } from "@/lib/api-types";

export const useVisitors = () => useQuery({ queryKey: keys.visitors, queryFn: api.visitors });
export const useAttempts = () => useQuery({ queryKey: keys.attempts, queryFn: api.attempts });
export const useResults = () => useQuery({ queryKey: keys.results, queryFn: api.results });
export const useScenarios = () => useQuery({ queryKey: keys.scenarios, queryFn: api.scenarios });
export const useAcceptance = () => useQuery({ queryKey: keys.acceptance, queryFn: api.acceptance });
export const useSubmission = () => useQuery({ queryKey: keys.submission, queryFn: api.submission });
export const useHealth = () => useQuery({ queryKey: keys.health, queryFn: api.health });
export function useUpdateScenario() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...input
    }: {
      id: string;
      result: Scenario["run"]["result"];
      evidenceNote: string;
      recordingReviewed: boolean;
    }) => api.updateScenario(id, input),
    onMutate: async ({ id, ...input }) => {
      await qc.cancelQueries({ queryKey: keys.scenarios });
      const previous = qc.getQueryData<Scenario[]>(keys.scenarios);
      qc.setQueryData<Scenario[]>(keys.scenarios, (old) =>
        old?.map((s) => (s.id === id ? { ...s, run: { ...s.run, ...input } } : s)),
      );
      return { previous };
    },
    onError: (_e, _v, ctx) => qc.setQueryData(keys.scenarios, ctx?.previous),
    onSettled: () => qc.invalidateQueries({ queryKey: keys.scenarios }),
  });
}
export function useUpdateAcceptance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ key, ...input }: { key: string; completed: boolean; evidence: string }) =>
      api.updateAcceptance(key, input),
    onMutate: async ({ key, ...input }) => {
      await qc.cancelQueries({ queryKey: keys.acceptance });
      const previous = qc.getQueryData<AcceptanceItem[]>(keys.acceptance);
      qc.setQueryData<AcceptanceItem[]>(keys.acceptance, (old) =>
        old?.map((item) => (item.key === key ? { ...item, ...input } : item)),
      );
      return { previous };
    },
    onError: (_e, _v, ctx) => qc.setQueryData(keys.acceptance, ctx?.previous),
    onSettled: () => qc.invalidateQueries({ queryKey: keys.acceptance }),
  });
}

export function useUpdateSubmission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { accountEmail?: string | null; agentName?: string | null }) =>
      api.updateSubmission(input),
    onSettled: () => qc.invalidateQueries({ queryKey: keys.submission }),
  });
}
