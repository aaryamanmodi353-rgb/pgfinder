"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Activity,
  AudioLines,
  CheckCheck,
  ChevronDown,
  ClipboardCheck,
  FlaskConical,
  House,
  Moon,
  PhoneCall,
  Sun,
  Users,
  WandSparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useHealth } from "@/hooks/use-console-data";
import { useTheme } from "@/providers/theme-provider";

const nav = [
  { href: "/", label: "Overview", icon: House },
  { href: "/visitors", label: "Visitors", icon: Users },
  { href: "/agent-preview", label: "Agent preview", icon: WandSparkles },
  { href: "/calls", label: "Calls", icon: PhoneCall },
  { href: "/results", label: "Results", icon: AudioLines },
  { href: "/test-lab", label: "Test lab", icon: FlaskConical },
  { href: "/readiness", label: "Readiness", icon: CheckCheck },
  { href: "/submission", label: "Submission", icon: ClipboardCheck },
];
export function ConsoleShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const { theme, toggle } = useTheme();
  const health = useHealth();
  const [moreOpen, setMoreOpen] = useState(false);
  return (
    <div className="min-h-screen bg-canvas text-ink">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[250px] flex-col border-r bg-surface px-4 py-5 lg:flex">
        <Link href="/" className="flex items-center gap-3 px-3">
          <span className="grid size-10 place-items-center rounded-2xl bg-brand text-white">
            <Activity className="size-5" />
          </span>
          <span>
            <span className="block font-display text-xl">PG Finder</span>
            <span className="text-[10px] uppercase tracking-[.2em] text-muted">Operations</span>
          </span>
        </Link>
        <div className="mt-10 px-3 text-[10px] font-semibold uppercase tracking-[.18em] text-muted">
          Workspace
        </div>
        <nav aria-label="Main navigation" className="mt-3 space-y-1">
          {nav.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              aria-current={path === href ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                path === href ? "bg-sand text-ink" : "text-muted hover:bg-canvas hover:text-ink",
              )}
            >
              <Icon className="size-4" />
              {label}
              {label === "Readiness" && <ChevronDown className="ml-auto size-3 -rotate-90" />}
            </Link>
          ))}
        </nav>
        <div className="mt-auto rounded-2xl border bg-canvas p-4">
          <div className="flex items-center gap-2 text-xs font-medium">
            <span
              className={cn(
                "size-2 rounded-full",
                health.data?.status === "ok"
                  ? "bg-emerald-600"
                  : health.isError
                    ? "bg-rose-500"
                    : "animate-pulse bg-amber-500",
              )}
            />
            {health.data?.status === "ok"
              ? "API connected"
              : health.isError
                ? "API unavailable"
                : "Connecting…"}
          </div>
          <p className="mt-2 text-xs text-muted">Synthetic workspace · no outbound calls</p>
        </div>
        <button
          onClick={toggle}
          className="mt-3 flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-muted hover:bg-canvas hover:text-ink"
          aria-label="Toggle color theme"
        >
          {theme === "light" ? <Moon className="size-4" /> : <Sun className="size-4" />}{" "}
          {theme === "light" ? "Dark appearance" : "Light appearance"}
        </button>
      </aside>
      <div className="lg:pl-[250px]">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b bg-canvas/90 px-5 backdrop-blur-md sm:px-8">
          <div className="flex items-center gap-2 lg:hidden">
            <span className="grid size-8 place-items-center rounded-xl bg-brand text-white">
              <Activity className="size-4" />
            </span>
            <span className="font-display text-lg">PG Finder</span>
          </div>
          <div className="hidden text-sm text-muted lg:block">
            Call operations <span className="mx-2">/</span>{" "}
            <span className="text-ink">
              {nav.find((n) => n.href === path)?.label ?? "Workspace"}
            </span>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-full border bg-surface px-3 py-1.5 text-xs text-muted sm:flex">
              <span className="size-1.5 rounded-full bg-emerald-600" /> Synthetic data only
            </div>
            <button
              onClick={toggle}
              className="grid size-9 place-items-center rounded-xl border bg-surface text-muted hover:text-ink lg:hidden"
              aria-label="Toggle color theme"
            >
              {theme === "light" ? <Moon className="size-4" /> : <Sun className="size-4" />}
            </button>
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1480px] px-5 pb-28 pt-8 sm:px-8 lg:px-10 lg:pb-12">
          {children}
        </main>
      </div>
      {moreOpen && (
        <>
          <button
            aria-label="Close more navigation"
            className="fixed inset-0 z-30 bg-black/10 lg:hidden"
            onClick={() => setMoreOpen(false)}
          />
          <div
            id="mobile-more-menu"
            className="fixed bottom-20 right-3 z-50 w-56 rounded-2xl border bg-surface p-2 shadow-2xl lg:hidden"
          >
            {nav.slice(5).map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMoreOpen(false)}
                aria-current={path === href ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-3 text-sm",
                  path === href ? "bg-sand text-ink" : "text-muted hover:bg-canvas",
                )}
              >
                <Icon className="size-4" />
                {label}
              </Link>
            ))}
          </div>
        </>
      )}
      <nav
        aria-label="Mobile navigation"
        className="fixed inset-x-0 bottom-0 z-40 flex justify-around border-t bg-surface/95 px-1 pb-[max(env(safe-area-inset-bottom),.35rem)] pt-2 backdrop-blur lg:hidden"
      >
        {nav.slice(0, 5).map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex min-w-0 flex-col items-center gap-1 rounded-lg px-2 py-1 text-[10px]",
              path === href ? "text-brand" : "text-muted",
            )}
            aria-current={path === href ? "page" : undefined}
          >
            <Icon className="size-[18px]" />
            <span>{label}</span>
          </Link>
        ))}
        <button
          type="button"
          aria-expanded={moreOpen}
          aria-controls="mobile-more-menu"
          onClick={() => setMoreOpen((v) => !v)}
          className={cn(
            "flex min-w-0 flex-col items-center gap-1 rounded-lg px-2 py-1 text-[10px]",
            ["/test-lab", "/readiness", "/submission"].includes(path) || moreOpen
              ? "text-brand"
              : "text-muted",
          )}
        >
          <ChevronDown className="size-[18px]" />
          <span>More</span>
        </button>
      </nav>
    </div>
  );
}
