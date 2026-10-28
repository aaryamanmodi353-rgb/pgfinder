"use client";
import { useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Braces, CircleAlert, CircleCheck, Info, UserRound } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { keys } from "@/lib/query-keys";
import { formatCurrency } from "@/lib/utils";
import { useVisitors } from "@/hooks/use-console-data";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHead,
  EmptyState,
  ErrorState,
  FieldRow,
  LoadingLine,
  MetadataPreview,
  PageHeading,
  StatusPill,
} from "@/components/ui/primitives";

export default function AgentPreviewPage() {
  const visitors = useVisitors();
  const [selected, setSelected] = useState("");
  const qc = useQueryClient();
  const current = visitors.data?.find((v) => v.id === selected) ?? visitors.data?.[0];
  const id = current?.id ?? "";
  const preview = useQuery({
    queryKey: keys.metadata(id),
    queryFn: () => api.metadataPreview(id),
    enabled: !!id,
  });
  const prepare = async () => {
    if (!current) return;
    try {
      const item = await api.createAttempt(current.id);
      await qc.invalidateQueries({ queryKey: keys.attempts });
      toast.success("Metadata preview prepared");
      window.location.assign(`/calls?attempt=${encodeURIComponent(item.id)}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not prepare preview");
    }
  };
  return (
    <>
      <PageHeading
        eyebrow="Agent context"
        title="Preview what the agent sees."
        description="Review the synthetic visitor context before a call attempt is prepared. Missing values remain explicit and are never filled in by guesswork."
        action={
          <Button onClick={prepare} disabled={!current}>
            <Braces className="size-4" />
            Prepare call metadata
          </Button>
        }
      />
      <div className="mb-6 flex gap-3 rounded-2xl border border-amber-700/15 bg-amber/50 p-4 text-sm">
        <Info className="mt-0.5 size-4 shrink-0 text-amber-800" />
        <p>
          <strong className="font-medium">Preview only.</strong> Preparing a record does not start
          or place a call. Outbound calling is disabled in this companion console.
        </p>
      </div>
      {visitors.isLoading ? (
        <LoadingLine />
      ) : visitors.isError ? (
        <ErrorState
          message="Visitor profiles could not be loaded."
          retry={() => void visitors.refetch()}
        />
      ) : !visitors.data?.length ? (
        <Card>
          <EmptyState
            title="No visitor context yet"
            description="Add or seed a synthetic visitor profile before reviewing the agent metadata."
            action={
              <Link href="/visitors">
                <Button>Go to visitors</Button>
              </Link>
            }
          />
        </Card>
      ) : (
        <div className="grid gap-5 xl:grid-cols-[minmax(270px,.8fr)_minmax(0,1.2fr)]">
          <Card>
            <CardHead
              title="Choose a profile"
              note="The preview updates as you select a visitor."
            />
            <div className="divide-y">
              {visitors.data.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setSelected(v.id)}
                  className={`flex w-full items-center gap-3 px-5 py-4 text-left transition hover:bg-canvas/60 ${id === v.id ? "bg-sand/40" : ""}`}
                >
                  <span className="grid size-9 place-items-center rounded-xl bg-canvas text-brand">
                    <UserRound className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">
                      {v.name || "Unnamed visitor"}
                    </span>
                    <span className="mt-1 block truncate text-xs text-muted">
                      {v.city || "City not provided"} ·{" "}
                      {v.missingFields.length
                        ? `${v.missingFields.length} fields missing`
                        : "Complete context"}
                    </span>
                  </span>
                  <StatusPill status={v.missingFields.length ? "incomplete" : "ready"} />
                </button>
              ))}
            </div>
          </Card>
          <div className="space-y-5">
            <Card>
              <CardHead title="Profile context" note="Fields known to the workspace." />
              <div className="px-5">
                <FieldRow label="Name" value={current?.name} />
                <FieldRow label="Phone" value={current?.phone} />
                <FieldRow label="City" value={current?.city} />
                <FieldRow label="Gender preference" value={current?.gender} />
                <FieldRow
                  label="Monthly budget"
                  value={
                    current?.budget
                      ? formatCurrency(current.budget.amount, current.budget.isApproximate)
                      : null
                  }
                />
              </div>
            </Card>
            <Card>
              <CardHead
                title="Metadata sent"
                note="Current adapter output for the selected visitor."
                action={<span className="text-xs text-muted">JSON preview</span>}
              />
              <div className="p-5">
                {preview.isLoading ? (
                  <LoadingLine />
                ) : preview.isError ? (
                  <ErrorState
                    message="Metadata preview could not be loaded."
                    retry={() => void preview.refetch()}
                  />
                ) : (
                  <MetadataPreview payload={preview.data?.payload ?? {}} />
                )}
              </div>
            </Card>
            <Card>
              <CardHead
                title="What still needs a real-world answer"
                note="These are unknown facts, not errors."
              />
              <div className="space-y-3 p-5">
                {(current?.missingFields ?? []).length ? (
                  current!.missingFields.map((field) => (
                    <div key={field} className="flex items-start gap-3 rounded-xl bg-canvas p-3">
                      <CircleAlert className="mt-0.5 size-4 text-amber-700" />
                      <p className="text-sm">
                        <span className="font-medium">{field.replaceAll(/([A-Z])/g, " $1")}</span>
                        <span className="mt-0.5 block text-xs text-muted">
                          Ask naturally and accept that the visitor may decline or be unsure.
                        </span>
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="flex items-center gap-2 text-sm text-muted">
                    <CircleCheck className="size-4 text-emerald-700" />
                    No profile fields are missing. Move-in date and stay duration still need to be
                    asked on the call.
                  </p>
                )}
              </div>
            </Card>
          </div>
        </div>
      )}
    </>
  );
}
