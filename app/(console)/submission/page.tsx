"use client";
import { useSubmission } from "@/hooks/use-console-data";
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
  return (
    <>
      <PageHeading
        eyebrow="Final handoff"
        title="Submission"
        description="The external submission consists of exactly three CallKaro details. Complete them in the assignment handoff when you are ready."
      />
      <Card>
        <CardHead
          title="Required submission details"
          note={`${Math.min(q.data?.length ?? 0, 3)} required details returned by the backend`}
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
          <SubmissionChecklist items={q.data} />
        )}
      </Card>
      <div className="mt-5 rounded-2xl border bg-sage/55 p-5">
        <p className="font-medium">Nothing else is required here.</p>
        <p className="mt-1 text-sm leading-6 text-muted">
          Do not submit transcripts, prompts, or documentation. The required handoff is limited to
          the three items above.
        </p>
      </div>
    </>
  );
}
