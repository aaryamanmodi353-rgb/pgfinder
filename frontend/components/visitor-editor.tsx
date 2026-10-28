"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import * as Dialog from "@radix-ui/react-dialog";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { Visitor } from "@/lib/api-types";
import { keys } from "@/lib/query-keys";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

const schema = z.object({
  name: z.string().trim().max(120),
  phone: z.string().trim().max(40),
  city: z.string().trim().max(120),
  gender: z.string().trim().max(80),
  budget: z
    .string()
    .refine(
      (v) => v === "" || (Number.isFinite(Number(v)) && Number(v) >= 0),
      "Enter a non-negative budget.",
    ),
  isApproximate: z.boolean(),
});
type Values = z.infer<typeof schema>;
const inputClass =
  "h-11 w-full rounded-xl border bg-canvas px-3 text-sm outline-none transition focus:border-brand focus:bg-surface";
export function VisitorEditor({
  visitor,
  trigger,
}: {
  visitor?: Visitor;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: visitor?.name ?? "",
      phone: visitor?.phone ?? "",
      city: visitor?.city ?? "",
      gender: visitor?.gender ?? "",
      budget: visitor?.budget?.amount?.toString() ?? "",
      isApproximate: visitor?.budget?.isApproximate ?? false,
    },
  });
  const submit = form.handleSubmit(async (values) => {
    const amount = values.budget.trim() ? Number(values.budget) : null;
    const body = {
      name: values.name || null,
      phone: values.phone || null,
      city: values.city || null,
      gender: values.gender || null,
      budget: amount === null ? null : { amount, isApproximate: values.isApproximate },
    };
    try {
      if (visitor) await api.updateVisitor(visitor.id, body);
      else await api.createVisitor(body);
      await qc.invalidateQueries({ queryKey: keys.visitors });
      toast.success(visitor ? "Visitor details saved" : "Visitor added");
      setOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save visitor");
    }
  });
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (v)
          form.reset({
            name: visitor?.name ?? "",
            phone: visitor?.phone ?? "",
            city: visitor?.city ?? "",
            gender: visitor?.gender ?? "",
            budget: visitor?.budget?.amount?.toString() ?? "",
            isApproximate: visitor?.budget?.isApproximate ?? false,
          });
      }}
    >
      <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/35 backdrop-blur-sm" />
        <Dialog.Content className="fixed inset-y-0 right-0 z-50 w-full max-w-[560px] overflow-y-auto border-l bg-surface p-6 shadow-2xl sm:p-8">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[.18em] text-brand">
                Synthetic profile
              </p>
              <Dialog.Title className="mt-2 font-display text-3xl">
                {visitor ? "Edit visitor" : "Add a visitor"}
              </Dialog.Title>
              <Dialog.Description className="mt-2 text-sm text-muted">
                Leave anything unknown blank. The preview will keep missing information out of the
                agent metadata.
              </Dialog.Description>
            </div>
            <Dialog.Close aria-label="Close" className="rounded-lg p-2 text-muted hover:bg-canvas">
              <X className="size-4" />
            </Dialog.Close>
          </div>
          <form className="mt-8 space-y-5" onSubmit={submit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-1.5 text-sm">
                <span>Name</span>
                <input
                  className={inputClass}
                  autoComplete="name"
                  {...form.register("name")}
                  placeholder="e.g. Aanya Mehta"
                />
              </label>
              <label className="space-y-1.5 text-sm">
                <span>Phone number</span>
                <input
                  className={inputClass}
                  autoComplete="tel"
                  inputMode="tel"
                  {...form.register("phone")}
                  placeholder="e.g. +91 98…"
                />
              </label>
              <label className="space-y-1.5 text-sm">
                <span>Preferred city</span>
                <input className={inputClass} {...form.register("city")} placeholder="e.g. Pune" />
              </label>
              <label className="space-y-1.5 text-sm">
                <span>Gender preference</span>
                <select className={inputClass} {...form.register("gender")}>
                  <option value="">Not provided</option>
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="any">Any</option>
                  <option value="unspecified">Prefer not to say</option>
                </select>
              </label>
              <label className="space-y-1.5 text-sm">
                <span>Monthly budget (INR)</span>
                <input
                  className={inputClass}
                  type="number"
                  min="0"
                  step="500"
                  {...form.register("budget")}
                  placeholder="e.g. 15000"
                />
                {form.formState.errors.budget && (
                  <span className="text-xs text-red-700">
                    {form.formState.errors.budget.message}
                  </span>
                )}
              </label>
              <label className="flex items-center gap-2 self-end pb-3 text-sm">
                <input
                  type="checkbox"
                  className="size-4 accent-[hsl(var(--brand))]"
                  {...form.register("isApproximate")}
                />{" "}
                This amount is approximate
              </label>
            </div>
            <div className="rounded-xl bg-sand/50 p-4 text-xs leading-5 text-muted">
              All records in this workspace are synthetic. Avoid entering real customer details.
            </div>
            <div className="flex justify-end gap-2 border-t pt-5">
              <Dialog.Close asChild>
                <Button type="button" variant="secondary">
                  Cancel
                </Button>
              </Dialog.Close>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting
                  ? "Saving…"
                  : visitor
                    ? "Save changes"
                    : "Create visitor"}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
