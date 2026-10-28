"use client";
import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { useAcceptance, useUpdateAcceptance } from "@/hooks/use-console-data";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHead,
  EmptyState,
  ErrorState,
  LoadingLine,
  PageHeading,
} from "@/components/ui/primitives";
import type { AcceptanceItem } from "@/lib/api-types";

const groups: { title: string; keys: string[] }[] = [
  { title: "Does it work?", keys: ["call-flow", "missing-data", "outcome-priority"] },
  { title: "Does it feel human?", keys: ["natural-conversation"] },
  { title: "Is the data useful?", keys: ["corrections-audited", "synthetic-only"] },
  { title: "Does it handle edge cases?", keys: ["unmapped-webhooks"] },
];
function ReadinessItem({
  item,
  onSave,
  pending,
}: {
  item: AcceptanceItem;
  onSave: (key: string, completed: boolean, evidence: string) => void;
  pending: boolean;
}) {
  const [completed, setCompleted] = useState(item.completed);
  const [evidence, setEvidence] = useState(item.evidence);
  useEffect(() => {
    setCompleted(item.completed);
    setEvidence(item.evidence);
  }, [item.completed, item.evidence]);
  return (
    <div className="grid gap-4 border-t p-5 first:border-0 sm:grid-cols-[1fr_240px_auto] sm:items-center">
      <div>
        <label className="flex items-center gap-2 font-medium">
          <input
            aria-label={`${item.title} complete`}
            type="checkbox"
            className="size-4 accent-[hsl(var(--brand))]"
            checked={completed}
            onChange={(e) => {
              setCompleted(e.target.checked);
              onSave(item.key, e.target.checked, evidence);
            }}
            disabled={pending}
          />
          {item.title}
        </label>
        <p className="mt-1 pl-6 text-sm leading-5 text-muted">{item.description}</p>
      </div>
      <input
        className="h-10 rounded-xl border bg-canvas px-3 text-sm outline-none focus:border-brand"
        value={evidence}
        onChange={(e) => setEvidence(e.target.value)}
        placeholder="Evidence note (optional)"
        aria-label={`${item.title} evidence note`}
      />
      <Button
        size="sm"
        variant="secondary"
        onClick={() => onSave(item.key, completed, evidence)}
        disabled={pending}
      >
        <Save className="size-4" />
        Save evidence
      </Button>
    </div>
  );
}
export default function ReadinessPage() {
  const query = useAcceptance();
  const mutation = useUpdateAcceptance();
  const save = (key: string, completed: boolean, evidence: string) =>
    mutation.mutate(
      { key, completed, evidence },
      {
        onSuccess: () => toast.success("Readiness updated"),
        onError: (e) =>
          toast.error(
            e instanceof Error ? e.message : "Update failed; the previous value was restored",
          ),
      },
    );
  const data = query.data ?? [];
  const complete = data.length > 0 && data.every((i) => i.completed);
  return (
    <>
      <PageHeading
        eyebrow="Internal review"
        title="Readiness"
        description="A practical checklist for evaluating the companion integration before you submit your independent CallKaro agent."
        action={
          <span
            className={`rounded-full border px-3 py-2 text-xs ${complete ? "border-emerald-700/30 bg-sage" : "bg-surface text-muted"}`}
          >
            {complete ? "Ready for your review" : "In progress"} ·{" "}
            {data.filter((i) => i.completed).length} of {data.length}
          </span>
        }
      />
      <div className="mb-6 rounded-2xl border bg-sage/60 p-4 text-sm leading-6">
        <strong>This checklist is internal evidence.</strong> It does not certify that the real
        voice agent has passed. Record concise evidence from your own CallKaro runs.
      </div>
      {query.isLoading ? (
        <LoadingLine />
      ) : query.isError ? (
        <ErrorState
          message="Readiness checks could not be loaded."
          retry={() => void query.refetch()}
        />
      ) : (
        <div className="space-y-5">
          {groups.map((group) => {
            const items = data.filter((item) => group.keys.includes(item.key));
            return (
              <Card key={group.title}>
                <CardHead
                  title={group.title}
                  note={`${items.filter((i) => i.completed).length} of ${items.length} checks complete`}
                />
                {items.length ? (
                  items.map((item) => (
                    <ReadinessItem
                      key={item.key}
                      item={item}
                      onSave={save}
                      pending={mutation.isPending}
                    />
                  ))
                ) : (
                  <EmptyState
                    title="No checks in this group yet"
                    description="The integration checklist does not currently include a check in this category."
                  />
                )}
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
