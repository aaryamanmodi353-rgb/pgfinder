"use client";
import { useMemo, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useQueryClient } from "@tanstack/react-query";
import {
  Search,
  Plus,
  MapPin,
  ArrowUpRight,
  Trash2,
  X,
  UserRound,
  SlidersHorizontal,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { keys } from "@/lib/query-keys";
import { formatCurrency, formatDate, safeText } from "@/lib/utils";
import { useVisitors } from "@/hooks/use-console-data";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHead,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  FieldRow,
  LoadingLine,
  MaskedValue,
  PageHeading,
  StatusPill,
} from "@/components/ui/primitives";
import { VisitorEditor } from "@/components/visitor-editor";
import type { Visitor } from "@/lib/api-types";

function VisitorDetails({ visitor, onDeleted }: { visitor: Visitor; onDeleted: () => void }) {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button className="text-left font-medium hover:text-brand hover:underline">
          {visitor.name || "Unnamed visitor"}
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/35 backdrop-blur-sm" />
        <Dialog.Content className="fixed inset-y-0 right-0 z-50 w-full max-w-[520px] overflow-y-auto border-l bg-surface p-6 shadow-2xl sm:p-8">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-[.16em] text-brand">Visitor record</p>
              <Dialog.Title className="mt-2 font-display text-3xl">
                {visitor.name || "Unnamed visitor"}
              </Dialog.Title>
              <p className="mt-2 text-sm text-muted">
                Synthetic profile · added {formatDate(visitor.createdAt)}
              </p>
            </div>
            <Dialog.Close aria-label="Close" className="rounded-lg p-2 text-muted hover:bg-canvas">
              <X className="size-4" />
            </Dialog.Close>
          </div>
          <div className="mt-6">
            <StatusPill status={visitor.missingFields.length ? "incomplete" : "ready"} />
          </div>
          <div className="mt-4 divide-y rounded-2xl border px-4">
            <FieldRow label="Phone" value={<MaskedValue value={visitor.phone} />} />
            <FieldRow label="City" value={visitor.city} />
            <FieldRow label="Gender preference" value={visitor.gender} />
            <FieldRow
              label="Monthly budget"
              value={
                visitor.budget
                  ? formatCurrency(visitor.budget.amount, visitor.budget.isApproximate)
                  : null
              }
            />
            <FieldRow
              label="Missing fields"
              value={visitor.missingFields.length ? visitor.missingFields.join(", ") : "None"}
            />
            <FieldRow label="Record ID" value={visitor.id} />
          </div>
          <div className="mt-6 flex gap-2">
            <VisitorEditor
              visitor={visitor}
              trigger={<Button variant="secondary">Edit profile</Button>}
            />
            <ConfirmDialog
              title="Delete this visitor?"
              description="This removes the synthetic visitor record. Related call attempts remain as historical records."
              confirmLabel="Delete visitor"
              onConfirm={onDeleted}
            >
              <Button variant="danger">
                <Trash2 className="size-4" />
                Delete
              </Button>
            </ConfirmDialog>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
export default function VisitorsPage() {
  const q = useVisitors(),
    qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const items = useMemo(
    () =>
      q.data?.filter((v) => {
        const text = [v.name, v.phone, v.city].filter(Boolean).join(" ").toLowerCase();
        return (
          text.includes(search.toLowerCase()) &&
          (filter === "all" ||
            (filter === "complete" ? !v.missingFields.length : !!v.missingFields.length))
        );
      }) ?? [],
    [q.data, search, filter],
  );
  const remove = async (id: string) => {
    try {
      await api.deleteVisitor(id);
      await qc.invalidateQueries({ queryKey: keys.visitors });
      toast.success("Visitor deleted");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not delete visitor");
    }
  };
  const seed = async () => {
    try {
      const r = await api.seedVisitors();
      await qc.invalidateQueries({ queryKey: keys.visitors });
      toast.success(`${r.created} synthetic profiles ready`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not prepare fixtures");
    }
  };
  return (
    <>
      <PageHeading
        eyebrow="People"
        title="Visitors"
        description="Synthetic profiles give your agent a clean starting point. Missing details stay visible, and never become invented facts."
        action={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={seed}>
              <UserRound className="size-4" />
              Load sample set
            </Button>
            <VisitorEditor
              trigger={
                <Button>
                  <Plus className="size-4" />
                  Add visitor
                </Button>
              }
            />
          </div>
        }
      />
      <div className="mb-5 grid gap-3 sm:grid-cols-[1fr_auto]">
        <label className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <input
            className="h-11 w-full rounded-xl border bg-surface pl-10 pr-3 text-sm outline-none focus:border-brand"
            placeholder="Search name, phone, or city…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search visitors"
          />
        </label>
        <label className="flex h-11 items-center gap-2 rounded-xl border bg-surface px-3 text-sm">
          <SlidersHorizontal className="size-4 text-muted" />
          <select
            className="bg-transparent outline-none"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            aria-label="Filter visitors"
          >
            <option value="all">All profiles</option>
            <option value="complete">Complete context</option>
            <option value="missing">Missing details</option>
          </select>
        </label>
      </div>
      <Card>
        <CardHead
          title={`${items.length} ${items.length === 1 ? "profile" : "profiles"}`}
          note="Select a name to review the full synthetic record."
        />
        {q.isLoading ? (
          <div className="p-6">
            <LoadingLine />
          </div>
        ) : q.isError ? (
          <div className="p-5">
            <ErrorState
              message="Visitor profiles could not be loaded."
              retry={() => void q.refetch()}
            />
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            title={search ? "No matches found" : "No visitors yet"}
            description={
              search
                ? "Try another name, phone number, or city."
                : "Create a synthetic profile or load the sample set to begin."
            }
            action={
              !search ? (
                <VisitorEditor
                  trigger={
                    <Button>
                      <Plus className="size-4" />
                      Add first visitor
                    </Button>
                  }
                />
              ) : undefined
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[740px] text-left text-sm">
              <thead className="bg-canvas/60 text-xs uppercase tracking-wider text-muted">
                <tr>
                  <th className="px-5 py-3 font-medium">Visitor</th>
                  <th className="px-5 py-3 font-medium">Phone</th>
                  <th className="px-5 py-3 font-medium">City</th>
                  <th className="px-5 py-3 font-medium">Budget</th>
                  <th className="px-5 py-3 font-medium">Context</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {items.map((v) => (
                  <tr key={v.id} className="border-t hover:bg-canvas/40">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <span className="grid size-9 place-items-center rounded-xl bg-sand text-brand">
                          <UserRound className="size-4" />
                        </span>
                        <div>
                          <VisitorDetails visitor={v} onDeleted={() => void remove(v.id)} />
                          <div className="mt-0.5 text-xs text-muted">{formatDate(v.createdAt)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <MaskedValue value={v.phone} />
                    </td>
                    <td className="px-5 py-4">
                      <span className="flex items-center gap-1.5 text-muted">
                        <MapPin className="size-3.5" />
                        {safeText(v.city)}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-muted">
                      {v.budget
                        ? formatCurrency(v.budget.amount, v.budget.isApproximate)
                        : "Not provided"}
                    </td>
                    <td className="px-5 py-4">
                      <StatusPill status={v.missingFields.length ? "incomplete" : "ready"} />
                    </td>
                    <td className="px-5 py-4">
                      <ArrowUpRight className="size-4 text-muted" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      <p className="mt-4 text-xs text-muted">
        {items.length} shown · All profile data is labeled synthetic.
      </p>
    </>
  );
}
