import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
export function safeText(value: unknown, fallback = "Not provided"): string {
  if (
    value === null ||
    value === undefined ||
    value === "" ||
    (typeof value === "number" && !Number.isFinite(value))
  )
    return fallback;
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "object") return JSON.stringify(value) ?? fallback;
  return String(value);
}
export function humanize(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
export function formatCurrency(amount: number | null | undefined, approximate = false) {
  if (amount === null || amount === undefined || !Number.isFinite(amount)) return "Not provided";
  const formatted = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
  return `${approximate ? "About " : ""}${formatted}`;
}
export function formatDate(value?: string | Date | null) {
  if (!value) return "Not provided";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Not provided"
    : new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(date);
}
