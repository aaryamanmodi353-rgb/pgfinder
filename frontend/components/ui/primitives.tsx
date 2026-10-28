"use client";
import * as Dialog from "@radix-ui/react-dialog";
import { motion } from "framer-motion";
import { AlertCircle, CircleHelp, LoaderCircle, X } from "lucide-react";
import { Button } from "./button";
import { cn, humanize, safeText } from "@/lib/utils";
import { isValidElement, useState, type ReactNode } from "react";

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <section className={cn("rounded-2xl border bg-surface shadow-soft", className)}>
      {children}
    </section>
  );
}
export function CardHead({
  title,
  note,
  action,
}: {
  title: string;
  note?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b px-5 py-4 sm:px-6">
      <div>
        <h2 className="font-display text-xl">{title}</h2>
        {note && <p className="mt-1 text-sm text-muted">{note}</p>}
      </div>
      {action}
    </div>
  );
}
export function StatusPill({ status }: { status: string | null | undefined }) {
  const safe = typeof status === "string" && status ? status : "unknown";
  const positive = ["completed", "reviewed", "passed", "confirmed", "provided", "ready"].includes(
    safe,
  );
  const negative = ["failed", "declined", "wrong_number", "not_interested"].includes(safe);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        positive ? "bg-sage text-ink" : negative ? "bg-brick text-ink" : "bg-sand text-ink",
      )}
    >
      <span className="size-1.5 rounded-full bg-current opacity-60" />
      {humanize(safe)}
    </span>
  );
}
export function FieldRow({ label, value, hint }: { label: string; value: unknown; hint?: string }) {
  return (
    <div className="grid gap-1 border-b py-3 last:border-0 sm:grid-cols-[150px_1fr]">
      <span className="text-sm text-muted">{label}</span>
      <div className="text-sm font-medium">
        {isValidElement(value) ? value : safeText(value)}
        {hint && <span className="mt-1 block text-xs font-normal text-muted">{hint}</span>}
      </div>
    </div>
  );
}
export function MaskedValue({
  value,
  revealLabel = "Show phone",
}: {
  value: string | null | undefined;
  revealLabel?: string;
}) {
  const [visible, setVisible] = useState(false);
  const number = safeText(value);
  const masked =
    number === "Not provided"
      ? number
      : `•••• ••• ${number.replace(/\D/g, "").slice(-4) || "••••"}`;
  return (
    <span className="inline-flex items-center gap-2">
      <span className="font-mono">{visible ? number : masked}</span>
      {number !== "Not provided" && (
        <button
          type="button"
          className="rounded px-1 text-xs text-brand underline-offset-2 hover:underline"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide phone" : revealLabel}
        >
          {visible ? "Hide" : "Reveal"}
        </button>
      )}
    </span>
  );
}
export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex min-h-56 flex-col items-center justify-center px-6 py-12 text-center">
      <svg
        className="mb-5 h-16 w-24 text-brand/45"
        viewBox="0 0 96 64"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M7 51c13-10 20 7 34-2 8-5 12-19 22-16 9 3 9 17 26 12M18 20h22M18 28h13M67 15h12"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx="72" cy="40" r="7" stroke="currentColor" strokeWidth="2" />
        <circle cx="35" cy="48" r="3" fill="currentColor" />
      </svg>
      <h3 className="font-display text-xl">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-muted">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
export function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl border bg-surface p-6">
      <div className="h-4 w-32 rounded bg-line" />
      <div className="mt-5 h-9 w-20 rounded bg-line" />
      <div className="mt-4 h-3 w-48 rounded bg-line" />
    </div>
  );
}
export function ErrorState({ message, retry }: { message: string; retry: () => void }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-brick bg-surface p-5">
      <AlertCircle className="size-5 text-brick" />
      <div className="flex-1 text-sm">{message}</div>
      <Button variant="secondary" size="sm" onClick={retry}>
        Retry
      </Button>
    </div>
  );
}
export function LoadingLine() {
  return (
    <div className="flex items-center gap-2 py-10 text-sm text-muted">
      <LoaderCircle className="size-4 animate-spin" /> Loading workspace…
    </div>
  );
}
export function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28 }}
      className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-[.18em] text-brand">{eyebrow}</p>
        <h1 className="mt-2 font-display text-4xl tracking-tight sm:text-5xl">{title}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">{description}</p>
      </div>
      {action}
    </motion.div>
  );
}
export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <h2 className="mb-3 text-xs font-semibold uppercase tracking-[.16em] text-muted">{children}</h2>
  );
}
export function ConfirmDialog({
  title,
  description,
  confirmLabel = "Continue",
  onConfirm,
  children,
}: {
  title: string;
  description: string;
  confirmLabel?: string;
  onConfirm: () => void;
  children: ReactNode;
}) {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>{children}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/35 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(92vw,440px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border bg-surface p-6 shadow-2xl">
          <div className="flex items-start justify-between">
            <div>
              <Dialog.Title className="font-display text-2xl">{title}</Dialog.Title>
              <Dialog.Description className="mt-2 text-sm leading-6 text-muted">
                {description}
              </Dialog.Description>
            </div>
            <Dialog.Close aria-label="Close" className="rounded-lg p-1 text-muted hover:bg-canvas">
              <X className="size-4" />
            </Dialog.Close>
          </div>
          <div className="mt-6 flex justify-end gap-2">
            <Dialog.Close asChild>
              <Button variant="secondary">Cancel</Button>
            </Dialog.Close>
            <Dialog.Close asChild>
              <Button onClick={onConfirm}>{confirmLabel}</Button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
export function MetadataPreview({ payload }: { payload: Record<string, unknown> }) {
  const entries = Object.entries(payload ?? {});
  if (!entries.length)
    return (
      <div className="rounded-xl border border-dashed p-6 text-center">
        <CircleHelp className="mx-auto size-5 text-muted" />
        <p className="mt-2 text-sm font-medium">Metadata mapping is not configured</p>
        <p className="mt-1 text-xs text-muted">
          Confirm the CallKaro field names before sending visitor context.
        </p>
      </div>
    );
  return (
    <div className="divide-y rounded-xl border px-4">
      {entries.map(([key, value]) => (
        <FieldRow key={key} label={humanize(key)} value={value} />
      ))}
    </div>
  );
}
