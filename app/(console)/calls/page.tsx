"use client";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ExternalLink, FileAudio, PhoneCall, Plus, Save } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { keys } from "@/lib/query-keys";
import { formatDate, humanize, safeText } from "@/lib/utils";
import { useAttempts, useVisitors } from "@/hooks/use-console-data";
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

export default function CallsPage() {
  const attempts = useAttempts(),
    visitors = useVisitors(),
    qc = useQueryClient();
  const [visitorId, setVisitorId] = useState("");
  const [selected, setSelected] = useState("");
  const [recordingUrl, setRecordingUrl] = useState("");
  const [filename, setFilename] = useState("");
  const [notes, setNotes] = useState("");
  const [callId, setCallId] = useState("");
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("attempt");
    if (id) setSelected(id);
  }, []);
  const create = async () => {
    if (!visitorId) {
      toast.error("Choose a visitor first");
      return;
    }
    try {
      const r = await api.createAttempt(visitorId);
      await qc.invalidateQueries({ queryKey: keys.attempts });
      setSelected(r.id);
      toast.success("Call attempt prepared");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not prepare attempt");
    }
  };
  const save = async () => {
    if (!selected) return;
    const data = {
      ...(recordingUrl.trim() ? { recordingUrl: recordingUrl.trim() } : {}),
      ...(filename.trim() ? { recordingFilename: filename.trim() } : {}),
      ...(notes.trim() ? { notes: notes.trim() } : {}),
      ...(callId.trim() ? { callkaroCallId: callId.trim() } : {}),
    };
    try {
      await api.attachRecording(selected, data);
      await qc.invalidateQueries({ queryKey: keys.attempts });
      toast.success("Call notes saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save call details");
    }
  };
  const input =
    "h-10 w-full rounded-xl border bg-canvas px-3 text-sm outline-none focus:border-brand";
  return (
    <>
      <PageHeading
        eyebrow="Call records"
        title="Calls"
        description="Prepare synthetic call context, then attach recording references and review incoming webhook payloads. This page never initiates a phone call."
        action={
          <span className="inline-flex items-center gap-2 rounded-full border bg-surface px-3 py-2 text-xs text-muted">
            <span className="size-1.5 rounded-full bg-amber-600" />
            No outbound call action
          </span>
        }
      />
      <div className="mb-6 grid gap-5 lg:grid-cols-[.8fr_1.2fr]">
        <Card>
          <CardHead
            title="Prepare an attempt"
            note="Create a review record from a synthetic visitor."
          />
          <div className="space-y-4 p-5">
            <label className="block space-y-1.5 text-sm">
              <span>Visitor</span>
              <select
                className={input}
                value={visitorId}
                onChange={(e) => setVisitorId(e.target.value)}
              >
                <option value="">Choose profile</option>
                {visitors.data?.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name || "Unnamed visitor"} · {v.city || "City unknown"}
                  </option>
                ))}
              </select>
            </label>
            <Button onClick={create} disabled={!visitors.data?.length}>
              <Plus className="size-4" />
              Prepare metadata
            </Button>
            <p className="text-xs leading-5 text-muted">
              Preparation records a metadata snapshot only. Run and record test calls separately in
              CallKaro.
            </p>
          </div>
        </Card>
        <Card>
          <CardHead
            title="Attach call evidence"
            note="Save a recording URL, file reference, or review notes to the selected attempt."
          />
          <div className="grid gap-3 p-5 sm:grid-cols-2">
            <label className="space-y-1.5 text-sm">
              <span>Attempt</span>
              <select
                className={input}
                value={selected}
                onChange={(e) => setSelected(e.target.value)}
              >
                <option value="">Choose attempt</option>
                {attempts.data?.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.id.slice(0, 12)} · {humanize(a.status)}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1.5 text-sm">
              <span>CallKaro call ID</span>
              <input
                className={input}
                value={callId}
                onChange={(e) => setCallId(e.target.value)}
                placeholder="Optional ID"
              />
            </label>
            <label className="space-y-1.5 text-sm">
              <span>Recording URL</span>
              <input
                className={input}
                type="url"
                value={recordingUrl}
                onChange={(e) => setRecordingUrl(e.target.value)}
                placeholder="https://…"
              />
            </label>
            <label className="space-y-1.5 text-sm">
              <span>Recording filename</span>
              <input
                className={input}
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                placeholder="call-test-01.mp3"
              />
            </label>
            <label className="space-y-1.5 text-sm sm:col-span-2">
              <span>Review notes</span>
              <textarea
                className={`${input} min-h-20 py-2`}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="What did you notice in this call?"
              />
            </label>
            <div className="sm:col-span-2">
              <Button variant="secondary" onClick={save} disabled={!selected}>
                <Save className="size-4" />
                Save evidence reference
              </Button>
            </div>
          </div>
        </Card>
      </div>
      <Card>
        <CardHead
          title="Attempt history"
          note="Raw unmapped payloads are retained for inspection."
        />
        {attempts.isLoading ? (
          <div className="p-5">
            <LoadingLine />
          </div>
        ) : attempts.isError ? (
          <div className="p-5">
            <ErrorState
              message="Call attempts could not be loaded."
              retry={() => void attempts.refetch()}
            />
          </div>
        ) : !attempts.data?.length ? (
          <EmptyState
            title="No call attempts yet"
            description="Choose a synthetic profile above and prepare its metadata when you are ready to review a call flow."
          />
        ) : (
          <div className="divide-y">
            {attempts.data.map((a) => (
              <article key={a.id} className="p-5 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <PhoneCall className="size-4 text-brand" />
                      <span className="font-mono text-sm">{a.id}</span>
                    </div>
                    <div className="mt-2 text-xs text-muted">
                      {formatDate(a.createdAt)}
                      {a.callkaroCallId ? ` · CallKaro ${a.callkaroCallId}` : ""}
                    </div>
                  </div>
                  <StatusPill status={a.status} />
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <div className="rounded-xl bg-canvas p-3">
                    <div className="text-xs text-muted">Metadata fields</div>
                    <div className="mt-1 text-sm font-medium">
                      {Object.keys(a.metadataSent ?? {}).length}
                    </div>
                  </div>
                  <div className="rounded-xl bg-canvas p-3">
                    <div className="text-xs text-muted">Recording</div>
                    <div className="mt-1 flex items-center gap-1.5 text-sm">
                      {a.recordingUrl ? (
                        <>
                          <ExternalLink className="size-3.5" />
                          <a
                            className="text-brand underline"
                            href={a.recordingUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Open recording
                          </a>
                        </>
                      ) : a.recordingFilename ? (
                        <>
                          <FileAudio className="size-3.5" />
                          {a.recordingFilename}
                        </>
                      ) : (
                        "Not attached"
                      )}
                    </div>
                  </div>
                  <div className="rounded-xl bg-canvas p-3">
                    <div className="text-xs text-muted">Reviewer note</div>
                    <div className="mt-1 text-sm">{safeText(a.recordingNotes)}</div>
                  </div>
                </div>
                {a.mappingError && (
                  <p className="mt-4 rounded-xl bg-brick p-3 text-sm">{a.mappingError}</p>
                )}
                {a.status === "received_unmapped" && (
                  <details className="mt-4 rounded-xl border">
                    <summary className="cursor-pointer px-4 py-3 text-sm font-medium">
                      Inspect unmapped webhook JSON
                    </summary>
                    <pre className="max-h-80 overflow-auto border-t bg-canvas p-4 text-xs leading-5">
                      {JSON.stringify(a.rawPayload ?? null, null, 2)}
                    </pre>
                  </details>
                )}
              </article>
            ))}
          </div>
        )}
      </Card>
    </>
  );
}
