"use client";
import { useMemo, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowRightLeft, CheckCheck, Clock3, Phone, X } from "lucide-react";
import { toast } from "sonner";
import type { CallResult, Visitor } from "@/lib/api-types";
import { api } from "@/lib/api";
import { keys } from "@/lib/query-keys";
import { formatCurrency, formatDate, humanize, safeText } from "@/lib/utils";
import { useAttempts, useResults, useVisitors } from "@/hooks/use-console-data";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHead,
  EmptyState,
  ErrorState,
  FieldRow,
  LoadingLine,
  MaskedValue,
  PageHeading,
  StatusPill,
} from "@/components/ui/primitives";

type Change = { field: string; oldValue: unknown; newValue: unknown };
function corrections(result: CallResult, visitor?: Visitor): Change[] {
  if (!visitor) return [];
  const changed: Change[] = [];
  const candidates: [string, string, unknown, unknown][] = [
    ["name", result.customerName.status, visitor.name ?? null, result.customerName.value],
    ["phone", result.contactPhone.status, visitor.phone ?? null, result.contactPhone.value],
    ["city", result.preferredCity.status, visitor.city ?? null, result.preferredCity.value],
    [
      "gender",
      result.genderPreference.status,
      visitor.gender ?? null,
      result.genderPreference.value,
    ],
    [
      "budget",
      result.monthlyBudgetInr.status,
      visitor.budget ?? null,
      result.monthlyBudgetInr.amount === null
        ? null
        : {
            amount: result.monthlyBudgetInr.amount,
            isApproximate: result.monthlyBudgetInr.isApproximate,
          },
    ],
  ];
  for (const [field, status, oldValue, newValue] of candidates)
    if (status === "corrected" && newValue !== null) changed.push({ field, oldValue, newValue });
  return changed;
}
function CorrectionReview({
  result,
  visitor,
  attemptReviewed,
}: {
  result: CallResult;
  visitor?: Visitor;
  attemptReviewed: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const qc = useQueryClient();
  const changes = corrections(result, visitor);
  const apply = async () => {
    setBusy(true);
    try {
      const response = await api.applyCorrections(result.id);
      await Promise.all([
        qc.invalidateQueries({ queryKey: keys.results }),
        qc.invalidateQueries({ queryKey: keys.visitors }),
        qc.invalidateQueries({ queryKey: keys.attempts }),
      ]);
      toast.success(
        response.corrections.length
          ? `${response.corrections.length} correction${response.corrections.length === 1 ? "" : "s"} applied and audited`
          : "Result marked reviewed",
      );
      setOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not apply corrections");
    } finally {
      setBusy(false);
    }
  };
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button variant={attemptReviewed ? "secondary" : "primary"} size="sm">
          {attemptReviewed ? (
            <>
              <CheckCheck className="size-4" />
              Reviewed
            </>
          ) : (
            <>
              <ArrowRightLeft className="size-4" />
              Review corrections
            </>
          )}
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/35 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[85vh] w-[min(92vw,560px)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border bg-surface p-6 shadow-2xl">
          <div className="flex items-start justify-between">
            <div>
              <Dialog.Title className="font-display text-2xl">Review corrections</Dialog.Title>
              <Dialog.Description className="mt-2 text-sm leading-6 text-muted">
                Confirm the call’s corrected facts before they update the synthetic visitor record.
                Each saved field receives an audit entry.
              </Dialog.Description>
            </div>
            <Dialog.Close aria-label="Close" className="rounded-lg p-1 text-muted hover:bg-canvas">
              <X className="size-4" />
            </Dialog.Close>
          </div>
          {changes.length ? (
            <div className="mt-5 space-y-2">
              {changes.map((change) => (
                <div key={change.field} className="rounded-xl border p-4">
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted">
                    {humanize(change.field)}
                  </div>
                  <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-sm">
                    <span className="rounded-lg bg-brick/60 p-2">
                      {change.field === "phone" ? (
                        <MaskedValue value={String(change.oldValue ?? "")} />
                      ) : (
                        safeText(change.oldValue)
                      )}
                    </span>
                    <ArrowRightLeft className="size-4 text-muted" />
                    <span className="rounded-lg bg-sage/70 p-2">
                      {change.field === "phone" ? (
                        <MaskedValue value={String(change.newValue ?? "")} />
                      ) : (
                        safeText(change.newValue)
                      )}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-xl bg-canvas p-4 text-sm text-muted">
              {visitor
                ? "No visitor fields were marked corrected in this result."
                : "This result is not linked to a current visitor profile, so there are no profile fields to update."}
            </div>
          )}
          <div className="mt-6 flex justify-end gap-2">
            <Dialog.Close asChild>
              <Button variant="secondary">Cancel</Button>
            </Dialog.Close>
            <Button onClick={apply} disabled={busy || attemptReviewed}>
              {busy ? "Applying…" : attemptReviewed ? "Already reviewed" : "Confirm and apply"}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
function ResultCard({
  result,
  visitor,
  attemptReviewed,
}: {
  result: CallResult;
  visitor?: Visitor;
  attemptReviewed: boolean;
}) {
  return (
    <article className="border-t p-5 first:border-0 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-2xl">
              {result.customerName.value || "Caller name not captured"}
            </h3>
            <StatusPill status={result.callOutcome} />
          </div>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-muted">
            <Clock3 className="size-3.5" />
            {formatDate(result.createdAt)} · Result {result.id.slice(-8)}
          </p>
        </div>
        <CorrectionReview result={result} visitor={visitor} attemptReviewed={attemptReviewed} />
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <div>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
            Captured information
          </h4>
          <div className="rounded-xl border px-4">
            <FieldRow
              label="Contact phone"
              value={<MaskedValue value={result.contactPhone.value} />}
            />
            <FieldRow
              label="Preferred city"
              value={result.preferredCity.value}
              hint={humanize(result.preferredCity.status)}
            />
            <FieldRow
              label="Gender preference"
              value={result.genderPreference.value}
              hint={humanize(result.genderPreference.status)}
            />
            <FieldRow
              label="Monthly budget"
              value={
                result.monthlyBudgetInr.amount === null
                  ? null
                  : formatCurrency(
                      result.monthlyBudgetInr.amount,
                      result.monthlyBudgetInr.isApproximate,
                    )
              }
              hint={humanize(result.monthlyBudgetInr.status)}
            />
            <FieldRow
              label="Move-in"
              value={result.moveInDate.isoDate ?? result.moveInDate.statedText}
              hint={humanize(result.moveInDate.status)}
            />
            <FieldRow
              label="Stay duration"
              value={
                result.stayDuration.months
                  ? `${result.stayDuration.months} months`
                  : result.stayDuration.statedText
              }
              hint={humanize(result.stayDuration.status)}
            />
            <FieldRow label="Language" value={humanize(result.languageUsed)} />
          </div>
        </div>
        <div>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
            Review notes
          </h4>
          <div className="space-y-3 rounded-xl border p-4">
            <p className="text-sm leading-6">
              {safeText(result.callSummary, "No call summary captured")}
            </p>
            <div className="flex flex-wrap gap-2">
              <StatusPill status={result.nextAction} />
              <StatusPill status={visitor ? "visitor linked" : "no visitor link"} />
            </div>
            {result.callOutcome === "callback_requested" && (
              <div className="flex items-start gap-2 rounded-xl bg-amber/60 p-3 text-sm">
                <Phone className="mt-0.5 size-4 shrink-0" />
                <p>
                  Callback requested{" "}
                  {result.callbackRequestedTime ? `for “${result.callbackRequestedTime}”` : ""}; it
                  has <strong>not</strong> been scheduled.
                </p>
              </div>
            )}
            {result.missingInformation?.length > 0 && (
              <div>
                <div className="text-xs font-medium text-muted">Still missing</div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {result.missingInformation.map((item) => (
                    <span key={item} className="rounded-full bg-sand px-2.5 py-1 text-xs">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {result.reasons?.length > 0 && (
              <div className="border-t pt-3">
                <div className="text-xs font-medium text-muted">Outcome reasoning</div>
                <ul className="mt-1 list-disc pl-4 text-xs leading-5 text-muted">
                  {result.reasons.map((reason) => (
                    <li key={reason}>{reason}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
export default function ResultsPage() {
  const results = useResults(),
    visitors = useVisitors(),
    attempts = useAttempts();
  const visitorMap = useMemo(
    () => new Map((visitors.data ?? []).map((v) => [v.id, v])),
    [visitors.data],
  );
  const attemptMap = useMemo(
    () => new Map((attempts.data ?? []).map((a) => [a.id, a])),
    [attempts.data],
  );
  return (
    <>
      <PageHeading
        eyebrow="Call outcomes"
        title="Results"
        description="Review what was captured, keep phone numbers masked at a glance, and confirm any changes before they update a synthetic profile."
        action={
          <span className="rounded-full border bg-surface px-3 py-2 text-xs text-muted">
            {results.data?.length ?? 0} results
          </span>
        }
      />
      <Card>
        <CardHead
          title="Result inbox"
          note="Structured facts, uncertainty, and next action in one review."
        />
        {results.isLoading ? (
          <div className="p-6">
            <LoadingLine />
          </div>
        ) : results.isError ? (
          <div className="p-5">
            <ErrorState
              message="Call results could not be loaded."
              retry={() => void results.refetch()}
            />
          </div>
        ) : !results.data?.length ? (
          <EmptyState
            title="No results to review"
            description="When a test call result reaches the API, its structured information will appear here."
          />
        ) : (
          [...results.data]
            .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
            .map((r) => (
              <ResultCard
                key={r.id}
                result={r}
                visitor={r.visitorId ? visitorMap.get(r.visitorId) : undefined}
                attemptReviewed={attemptMap.get(r.attemptId)?.status === "reviewed"}
              />
            ))
        )}
      </Card>
    </>
  );
}
