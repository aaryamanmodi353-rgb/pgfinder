"use client";
import { toast } from "sonner";
import { useSubmission, useUpdateSubmission } from "@/hooks/use-console-data";
import {
  Card,
  CardHead,
  EmptyState,
  ErrorState,
  LoadingLine,
  PageHeading,
} from "@/components/ui/primitives";
import { SubmissionChecklist } from "@/components/submission-checklist";
export default function SubmissionPage() {
  const q = useSubmission();
  const update = useUpdateSubmission();
  const save = (patch: { accountEmail?: string | null; agentName?: string | null }) =>
    update.mutate(patch, {
      onSuccess: () => toast.success("Submission details saved"),
      onError: (error) =>
        toast.error(error instanceof Error ? error.message : "Could not save submission details"),
    });
  return (
    <>
      <PageHeading
        eyebrow="Final handoff"
        title="Submission"
        description="Track the three items the assignment asks you to submit after creating and testing your agent in CallKaro."
      />
      <Card>
        <CardHead
          title="Required submission details"
          note="Exactly three items are required for the final handoff."
        />
        {q.isLoading ? (
          <div className="p-5">
            <LoadingLine />
          </div>
        ) : q.isError ? (
          <div className="p-5">
            <ErrorState
              message="Submission requirements could not be loaded."
              retry={() => void q.refetch()}
            />
          </div>
        ) : !q.data?.length ? (
          <EmptyState
            title="Submission requirements unavailable"
            description="No submission checklist items were returned."
          />
        ) : (
          <SubmissionChecklist items={q.data} onSave={save} isSaving={update.isPending} />
        )}
      </Card>
      <div className="mt-5 rounded-2xl border bg-sage/55 p-5">
        <p className="font-medium">Nothing else is required here.</p>
        <p className="mt-1 text-sm leading-6 text-muted">
          The agent itself must be built and tested in CallKaro. Do not include transcripts,
          prompts, or extra documentation in the assignment handoff.
        </p>
        <div className="mt-4 flex flex-wrap gap-4 text-sm font-medium">
          <a className="text-brand underline" href="https://app.callkaro.ai" target="_blank" rel="noreferrer">
            Open CallKaro dashboard
          </a>
          <a className="text-brand underline" href="https://docs.callkaro.ai" target="_blank" rel="noreferrer">
            CallKaro guides
          </a>
        </div>
      </div>
    </>
  );
}
