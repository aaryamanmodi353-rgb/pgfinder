"use client";
import { Check, Circle, Mic2, AtSign, Bot } from "lucide-react";
import type { SubmissionItem } from "@/lib/api-types";
const icons = [Mic2, AtSign, Bot];
export function SubmissionChecklist({ items }: { items: SubmissionItem[] }) {
  return (
    <div className="divide-y">
      {items.slice(0, 3).map((item, index) => {
        const Icon = icons[index] ?? Circle;
        return (
          <div key={item.key} className="flex items-center gap-4 p-5">
            <span className="grid size-10 place-items-center rounded-xl bg-sand text-brand">
              <Icon className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="font-medium">{item.label}</div>
              <div className="mt-1 text-xs text-muted">
                {item.key === "recordings"
                  ? "Provide the required CallKaro test call recordings."
                  : item.key === "account_email"
                    ? "Use the email associated with your CallKaro account."
                    : "Enter the exact agent name as shown in CallKaro."}
              </div>
            </div>
            <span
              className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs ${item.complete ? "bg-sage" : "bg-canvas text-muted"}`}
            >
              {item.complete ? <Check className="size-3" /> : <Circle className="size-3" />}
              {item.complete ? "Ready" : "Needed"}
            </span>
          </div>
        );
      })}
    </div>
  );
}
