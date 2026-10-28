"use client";
import Link from "next/link";
import {
  ArrowUpRight,
  AudioLines,
  CheckCheck,
  FlaskConical,
  PhoneCall,
  Plus,
  Users,
  WandSparkles,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import { api } from "@/lib/api";
import {
  useAttempts,
  useAcceptance,
  useResults,
  useScenarios,
  useVisitors,
} from "@/hooks/use-console-data";
import { formatDate, humanize } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHead,
  EmptyState,
  ErrorState,
  LoadingLine,
  PageHeading,
  SkeletonCard,
  StatusPill,
} from "@/components/ui/primitives";

export default function OverviewPage() {
  const visitors = useVisitors(),
    attempts = useAttempts(),
    results = useResults(),
    scenarios = useScenarios(),
    acceptance = useAcceptance();
  const loading = [visitors, attempts, results, scenarios, acceptance].some((q) => q.isLoading);
  const failed = [visitors, attempts, results, scenarios, acceptance].find((q) => q.isError);
  const ready = acceptance.data?.filter((i) => i.completed).length ?? 0;
  const all = acceptance.data?.length ?? 0;
  const latest = [...(results.data ?? [])]
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
    .slice(0, 5);
  const counts = (results.data ?? []).reduce<Record<string, number>>((acc, r) => {
    acc[r.callOutcome] = (acc[r.callOutcome] ?? 0) + 1;
    return acc;
  }, {});
  const chart = Object.entries(counts).map(([name, value]) => ({ name: humanize(name), value }));
  const seed = async () => {
    try {
      const r = await api.seedVisitors();
      toast.success(`${r.created} synthetic visitors ready`);
      await visitors.refetch();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not seed visitors");
    }
  };
  return (
    <>
      <PageHeading
        eyebrow="Your workspace"
        title="Good work starts with clarity."
        description="A quiet overview of your synthetic call operations, from visitor context to reviewed outcomes."
        action={
          <Button onClick={seed}>
            <Plus className="size-4" />
            Prepare sample data
          </Button>
        }
      />
      {failed && (
        <div className="mb-6">
          <ErrorState
            message="Some workspace data could not be loaded."
            retry={() =>
              void Promise.all([
                visitors.refetch(),
                attempts.refetch(),
                results.refetch(),
                scenarios.refetch(),
                acceptance.refetch(),
              ])
            }
          />
        </div>
      )}
      <div className="mb-6 flex items-start gap-3 rounded-2xl border border-brand/15 bg-sand/55 p-4 text-sm">
        <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-xl bg-surface text-brand">
          <WandSparkles className="size-4" />
        </span>
        <p>
          <strong className="font-medium">A safe rehearsal space.</strong> This console manages
          synthetic visitor records and review workflows. It does not place outbound calls; verify
          your real CallKaro agent separately.
        </p>
      </div>
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: "Synthetic visitors",
              value: visitors.data?.length ?? 0,
              icon: Users,
              href: "/visitors",
              note: `${visitors.data?.filter((v) => v.missingFields.length === 0).length ?? 0} with complete context`,
            },
            {
              label: "Prepared calls",
              value: attempts.data?.length ?? 0,
              icon: PhoneCall,
              href: "/calls",
              note: "Preparation records only",
            },
            {
              label: "Reviewed outcomes",
              value: results.data?.length ?? 0,
              icon: AudioLines,
              href: "/results",
              note: "Webhook results received",
            },
            {
              label: "Scenarios passed",
              value: scenarios.data?.filter((s) => s.run.result === "passed").length ?? 0,
              icon: FlaskConical,
              href: "/test-lab",
              note: `${scenarios.data?.length ?? 0} fixture scenarios`,
            },
          ].map((stat) => (
            <Link
              key={stat.label}
              href={stat.href}
              className="group rounded-2xl border bg-surface p-5 shadow-soft transition-transform hover:-translate-y-0.5"
            >
              <div className="flex items-center justify-between text-sm text-muted">
                <span>{stat.label}</span>
                <stat.icon className="size-4 text-brand" />
              </div>
              <div className="mt-5 font-display text-4xl">{stat.value}</div>
              <div className="mt-2 flex items-center justify-between text-xs text-muted">
                <span>{stat.note}</span>
                <ArrowUpRight className="size-3 opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
            </Link>
          ))}
        </div>
      )}
      <div className="mt-6 grid gap-5 xl:grid-cols-[1.5fr_1fr]">
        <Card>
          <CardHead
            title="Outcome pulse"
            note="A simple view of webhook outcomes received by this workspace."
          />
          <div className="h-[280px] p-4">
            {results.isLoading ? (
              <LoadingLine />
            ) : chart.length === 0 ? (
              <EmptyState
                title="No outcomes yet"
                description="Once a webhook result arrives, its outcome mix will appear here."
              />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chart} margin={{ top: 12, right: 12, left: -18, bottom: 0 }}>
                  <defs>
                    <linearGradient id="outcomeFill" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="hsl(346 48% 25%)" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="hsl(346 48% 25%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 5" vertical={false} stroke="hsl(var(--line))" />
                  <XAxis
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: "hsl(var(--muted))" }}
                  />
                  <YAxis
                    allowDecimals={false}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: "hsl(var(--muted))" }}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 14,
                      border: "1px solid hsl(var(--line))",
                      background: "hsl(var(--surface))",
                      color: "hsl(var(--ink))",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="hsl(346 48% 25%)"
                    strokeWidth={2.5}
                    fill="url(#outcomeFill)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
        <Card>
          <CardHead
            title="Acceptance readiness"
            note="Your internal checks for the integration."
            action={
              <Link href="/readiness" className="text-xs font-medium text-brand hover:underline">
                Review all
              </Link>
            }
          />
          <div className="p-5">
            <div className="flex items-end gap-2">
              <span className="font-display text-5xl">{ready}</span>
              <span className="pb-1 text-sm text-muted">of {all} checked</span>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-canvas">
              <div
                className="h-full rounded-full bg-brand transition-all"
                style={{ width: `${all ? (ready / all) * 100 : 0}%` }}
              />
            </div>
            <div className="mt-5 space-y-3">
              {acceptance.data?.slice(0, 3).map((item) => (
                <div key={item.key} className="flex items-center gap-3 text-sm">
                  <span
                    className={`grid size-5 place-items-center rounded-full ${item.completed ? "bg-sage text-ink" : "border text-muted"}`}
                  >
                    {item.completed ? <CheckCheck className="size-3" /> : null}
                  </span>
                  <span className={item.completed ? "text-muted line-through" : ""}>
                    {item.title}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
      <Card className="mt-6">
        <CardHead
          title="Latest results"
          note="Most recent captured call outcomes."
          action={
            <Button asChild variant="ghost" size="sm">
              <Link href="/results">
                View results <ArrowUpRight className="size-3.5" />
              </Link>
            </Button>
          }
        />
        {latest.length === 0 && !results.isLoading ? (
          <EmptyState
            title="Your result inbox is quiet"
            description="Webhook results will show up here when the integration returns structured data."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wider text-muted">
                <tr>
                  <th className="px-6 py-3 font-medium">Visitor</th>
                  <th className="px-6 py-3 font-medium">Outcome</th>
                  <th className="px-6 py-3 font-medium">Next action</th>
                  <th className="px-6 py-3 font-medium">Captured</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {latest.map((r) => (
                  <tr key={r.id} className="border-t">
                    <td className="px-6 py-4 font-medium">
                      {r.customerName.value || "Name not captured"}
                    </td>
                    <td className="px-6 py-4">
                      <StatusPill status={r.callOutcome} />
                    </td>
                    <td className="px-6 py-4 text-muted">{humanize(r.nextAction)}</td>
                    <td className="px-6 py-4 text-muted">{formatDate(r.createdAt)}</td>
                    <td className="px-6 py-4">
                      <Link href="/results" className="text-brand hover:underline">
                        Review
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {[
          { href: "/visitors", label: "Build visitor context", icon: Users },
          { href: "/agent-preview", label: "Preview agent metadata", icon: WandSparkles },
          { href: "/test-lab", label: "Walk through scenarios", icon: FlaskConical },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 rounded-2xl border bg-surface p-4 text-sm font-medium hover:border-brand/30"
          >
            <item.icon className="size-4 text-brand" />
            {item.label}
            <ArrowUpRight className="ml-auto size-4 text-muted" />
          </Link>
        ))}
      </div>
    </>
  );
}
