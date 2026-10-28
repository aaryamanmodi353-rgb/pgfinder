"use client";
import { useEffect, useState } from "react";
import { useUpdateScenario, useScenarios } from "@/hooks/use-console-data";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHead,
  EmptyState,
  ErrorState,
  LoadingLine,
  PageHeading,
  StatusPill,
} from "@/components/ui/primitives";
import { AlertTriangle, CheckCheck, ChevronDown, FlaskConical, Save } from "lucide-react";
import { toast } from "sonner";
import type { Scenario } from "@/lib/api-types";

function ScenarioCard({
  scenario,
  onSave,
  isPending,
}: {
  scenario: Scenario;
  onSave: (
    id: string,
    payload: {
      result: Scenario["run"]["result"];
      evidenceNote: string;
      recordingReviewed: boolean;
    },
  ) => void;
  isPending: boolean;
}) {
  const [result, setResult] = useState<Scenario["run"]["result"]>(scenario.run.result);
  const [note, setNote] = useState(scenario.run.evidenceNote);
  const [reviewed, setReviewed] = useState(scenario.run.recordingReviewed);
  useEffect(() => {
    setResult(scenario.run.result);
    setNote(scenario.run.evidenceNote);
    setReviewed(scenario.run.recordingReviewed);
  }, [scenario.run.result, scenario.run.evidenceNote, scenario.run.recordingReviewed]);
  return (
    <details className="group rounded-2xl border bg-surface shadow-soft">
      <summary className="flex cursor-pointer list-none items-start gap-4 p-5">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-sand text-brand">
          <FlaskConical className="size-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="font-display text-xl">{scenario.title}</span>
            <StatusPill status={scenario.run.result} />
          </span>
          <span className="mt-1 block text-sm text-muted">{scenario.requirement}</span>
        </span>
        <ChevronDown className="mt-2 size-4 text-muted transition-transform group-open:rotate-180" />
      </summary>
      <div className="border-t px-5 pb-5 pt-4">
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-4">
            <div className="rounded-xl bg-canvas p-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted">
                Simulated caller behavior
              </div>
              <p className="mt-2 text-sm leading-6">{scenario.callerBehavior}</p>
            </div>
            <div className="rounded-xl border p-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted">
                Expected outcome
              </div>
              <div className="mt-2">
                <StatusPill status={scenario.expectedOutcome} />
              </div>
            </div>
          </div>
          <div className="rounded-xl border p-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted">
              Expected extracted fields
            </div>
            <pre className="mt-3 max-h-64 overflow-auto rounded-lg bg-canvas p-3 text-xs leading-5">
              {JSON.stringify(scenario.expectedExtractedFields ?? {}, null, 2)}
            </pre>
          </div>
        </div>
        <details className="mt-4">
          <summary className="cursor-pointer text-xs font-medium text-muted">
            View synthetic metadata fixture
          </summary>
          <pre className="mt-2 max-h-48 overflow-auto rounded-xl bg-canvas p-3 text-xs leading-5">
            {JSON.stringify(scenario.metadata ?? {}, null, 2)}
          </pre>
        </details>
        <div className="mt-5 grid gap-3 border-t pt-5 md:grid-cols-[180px_1fr_auto]">
          <label className="space-y-1.5 text-xs text-muted">
            <span>Recorded review result</span>
            <select
              className="h-10 w-full rounded-xl border bg-canvas px-3 text-sm text-ink"
              value={result}
              onChange={(e) => setResult(e.target.value as Scenario["run"]["result"])}
            >
              <option value="not_run">Not run</option>
              <option value="passed">Passed</option>
              <option value="failed">Failed</option>
            </select>
          </label>
          <label className="space-y-1.5 text-xs text-muted">
            <span>Evidence note</span>
            <input
              className="h-10 w-full rounded-xl border bg-canvas px-3 text-sm text-ink"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="What did you verify?"
            />
          </label>
          <div className="flex items-end">
            <Button
              size="sm"
              onClick={() =>
                onSave(scenario.id, { result, evidenceNote: note, recordingReviewed: reviewed })
              }
              disabled={isPending}
            >
              <Save className="size-4" />
              Save review
            </Button>
          </div>
        </div>
        <label className="mt-3 inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="size-4 accent-[hsl(var(--brand))]"
            checked={reviewed}
            onChange={(e) => setReviewed(e.target.checked)}
          />
          Recording reviewed
        </label>
      </div>
    </details>
  );
}
export default function TestLabPage() {
  const query = useScenarios();
  const mutation = useUpdateScenario();
  const save = (
    id: string,
    payload: {
      result: Scenario["run"]["result"];
      evidenceNote: string;
      recordingReviewed: boolean;
    },
  ) =>
    mutation.mutate(
      { id, ...payload },
      {
        onSuccess: () => toast.success("Scenario review saved"),
        onError: (e) => toast.error(e instanceof Error ? e.message : "Could not save review"),
      },
    );
  return (
    <>
      <PageHeading
        eyebrow="Rehearsal"
        title="Test lab"
        description="Review 14 synthetic scenarios and record what you verified. These fixtures help structure your manual CallKaro tests."
        action={
          <div className="rounded-full border bg-surface px-3 py-2 text-xs text-muted">
            {query.data?.length ?? 14} scenarios
          </div>
        }
      />
      <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-700/20 bg-amber/55 p-4 text-sm">
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-800" />
        <p>
          <strong>Simulation fixtures only.</strong> Saving a scenario result records your review;
          it does not run a call, contact a person, or verify the CallKaro agent automatically.
        </p>
      </div>
      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border bg-surface p-4">
          <div className="text-xs text-muted">Passed</div>
          <div className="mt-1 flex items-center gap-2 font-display text-3xl">
            <CheckCheck className="size-5 text-emerald-700" />
            {query.data?.filter((s) => s.run.result === "passed").length ?? 0}
          </div>
        </div>
        <div className="rounded-2xl border bg-surface p-4">
          <div className="text-xs text-muted">Failed</div>
          <div className="mt-1 font-display text-3xl">
            {query.data?.filter((s) => s.run.result === "failed").length ?? 0}
          </div>
        </div>
        <div className="rounded-2xl border bg-surface p-4">
          <div className="text-xs text-muted">Not run</div>
          <div className="mt-1 font-display text-3xl">
            {query.data?.filter((s) => s.run.result === "not_run").length ?? 0}
          </div>
        </div>
      </div>
      <Card>
        <CardHead
          title="Scenario library"
          note="Expand each fixture to compare expected behavior and record review evidence."
        />
        {query.isLoading ? (
          <div className="p-5">
            <LoadingLine />
          </div>
        ) : query.isError ? (
          <div className="p-5">
            <ErrorState
              message="Scenario fixtures could not be loaded."
              retry={() => void query.refetch()}
            />
          </div>
        ) : !query.data?.length ? (
          <EmptyState
            title="No scenarios available"
            description="The backend has not returned its scenario fixtures."
          />
        ) : (
          <div className="space-y-3 p-4 sm:p-5">
            {query.data.map((s) => (
              <ScenarioCard key={s.id} scenario={s} onSave={save} isPending={mutation.isPending} />
            ))}
          </div>
        )}
      </Card>
    </>
  );
}
