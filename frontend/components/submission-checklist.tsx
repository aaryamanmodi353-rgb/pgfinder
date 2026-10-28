"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, Circle, Mic2, AtSign, Bot, ExternalLink } from "lucide-react";
import type { SubmissionItem } from "@/lib/api-types";
import { Button } from "@/components/ui/button";

type SubmissionPatch = { accountEmail?: string | null; agentName?: string | null };

export function SubmissionChecklist({
  items,
  onSave,
  isSaving = false,
}: {
  items: SubmissionItem[];
  onSave?: (patch: SubmissionPatch) => void;
  isSaving?: boolean;
}) {
  const emailItem = items.find((item) => item.key === "account_email");
  const agentItem = items.find((item) => item.key === "agent_name");
  const [accountEmail, setAccountEmail] = useState(emailItem?.value ?? "");
  const [agentName, setAgentName] = useState(agentItem?.value ?? "");

  useEffect(() => setAccountEmail(emailItem?.value ?? ""), [emailItem?.value]);
  useEffect(() => setAgentName(agentItem?.value ?? ""), [agentItem?.value]);

  return (
    <div className="divide-y">
      {items.slice(0, 3).map((item) => {
        const Icon =
          item.key === "recordings" ? Mic2 : item.key === "account_email" ? AtSign : Bot;
        return (
          <div key={item.key} className="flex flex-col gap-4 p-5 sm:p-6">
            <div className="flex items-start gap-4">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-sand text-brand">
                <Icon className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="font-medium">{item.label}</div>
                <div className="mt-1 text-xs text-muted">
                  {item.key === "recordings"
                    ? `${item.recordings?.length ?? 0} recording reference${item.recordings?.length === 1 ? "" : "s"} attached.`
                    : item.key === "account_email"
                      ? "Use the email associated with your CallKaro account."
                      : "Enter the exact agent name shown in the CallKaro dashboard."}
                </div>
              </div>
              <span
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs ${item.complete ? "bg-sage" : "bg-canvas text-muted"}`}
              >
                {item.complete ? <Check className="size-3" /> : <Circle className="size-3" />}
                {item.complete ? "Ready" : "Needed"}
              </span>
            </div>

            {item.key === "recordings" && (
              <div className="ml-0 space-y-3 sm:ml-14">
                {(item.recordings ?? []).length > 0 && (
                  <ul className="space-y-2">
                    {item.recordings!.map((recording) => (
                      <li
                        key={recording.attemptId}
                        className="flex flex-wrap items-center gap-2 rounded-xl bg-canvas px-3 py-2 text-sm"
                      >
                        <span className="min-w-0 flex-1 truncate">
                          {recording.recordingFilename || recording.callkaroCallId || "Call recording"}
                        </span>
                        {recording.recordingUrl && (
                          <a
                            href={recording.recordingUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-brand underline"
                          >
                            Open <ExternalLink className="size-3" />
                          </a>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
                <p className="text-xs leading-5 text-muted">
                  Add a shareable recording link in Calls to mark this ready. Include the actual
                  recordings in the final assignment handoff; a filename is only a reference.
                </p>
                <Link href="/calls" className="inline-flex text-sm font-medium text-brand underline">
                  Manage call recordings
                </Link>
              </div>
            )}

            {item.key === "account_email" && (
              <form
                className="ml-0 flex flex-col gap-3 sm:ml-14 sm:flex-row sm:items-end"
                onSubmit={(event) => {
                  event.preventDefault();
                  onSave?.({ accountEmail: accountEmail.trim() || null });
                }}
              >
                <label className="min-w-0 flex-1 space-y-1.5 text-sm">
                  <span>CallKaro account email</span>
                  <input
                    type="email"
                    autoComplete="email"
                    maxLength={254}
                    className="h-10 w-full rounded-xl border bg-canvas px-3 outline-none focus:border-brand"
                    value={accountEmail}
                    onChange={(event) => setAccountEmail(event.target.value)}
                    placeholder="you@example.com"
                  />
                </label>
                <Button type="submit" variant="secondary" disabled={isSaving || !onSave}>
                  Save email
                </Button>
              </form>
            )}

            {item.key === "agent_name" && (
              <form
                className="ml-0 flex flex-col gap-3 sm:ml-14 sm:flex-row sm:items-end"
                onSubmit={(event) => {
                  event.preventDefault();
                  onSave?.({ agentName: agentName.trim() || null });
                }}
              >
                <label className="min-w-0 flex-1 space-y-1.5 text-sm">
                  <span>Exact agent name</span>
                  <input
                    type="text"
                    maxLength={120}
                    className="h-10 w-full rounded-xl border bg-canvas px-3 outline-none focus:border-brand"
                    value={agentName}
                    onChange={(event) => setAgentName(event.target.value)}
                    placeholder="Copy the name from CallKaro"
                  />
                </label>
                <Button type="submit" variant="secondary" disabled={isSaving || !onSave}>
                  Save agent name
                </Button>
              </form>
            )}
          </div>
        );
      })}
    </div>
  );
}
