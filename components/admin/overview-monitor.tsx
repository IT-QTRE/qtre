"use client";

import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { useReducedMotion } from "motion/react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { api } from "@/convex/_generated/api";

const MAROON = "#6A1017";
const GOLD = "#C8A15B";
const INK = "#1F1F1F";
const GRID = "#E7E3DD";
const MUTED = "#6B6459";

const tooltipStyle = {
  background: "#FFFFFF",
  border: `1px solid ${GRID}`,
  borderRadius: 8,
  fontSize: 12,
  color: INK,
};

function formatActivityWhen(ms: number) {
  const now = Date.now();
  const date = new Date(ms);
  const sameDay = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Dubai" }).format(date)
    === new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Dubai" }).format(now);
  if (sameDay) {
    return new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Asia/Dubai",
    }).format(date);
  }
  const yesterday = now - 24 * 60 * 60 * 1000;
  const wasYesterday = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Dubai" }).format(date)
    === new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Dubai" }).format(yesterday);
  if (wasYesterday) return "Yesterday";
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "Asia/Dubai" }).format(date);
}

function Panel({
  title,
  children,
  footer,
  className,
  scroll,
}: {
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  scroll?: boolean;
}) {
  return (
    <section className={`flex min-h-0 flex-col overflow-hidden border border-border bg-background p-4 sm:p-5 ${className ?? ""}`}>
      <h2 className="shrink-0 font-heading text-sm font-semibold tracking-tight">{title}</h2>
      <div className={`mt-4 min-h-0 flex-1 ${scroll ? "overflow-y-auto" : "overflow-hidden"}`}>{children}</div>
      {footer ? <div className="mt-3 shrink-0">{footer}</div> : null}
    </section>
  );
}

function ChartFrame({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(true);
  }, []);
  if (!ready) {
    return <div className="h-full min-h-0 bg-muted/60" aria-hidden />;
  }
  return (
    <div className="h-full min-h-0 overflow-hidden">
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  );
}

function KpiStrip({
  kpis,
}: {
  kpis: { label: string; value: string; hint: string }[];
}) {
  return (
    <div className="grid grid-cols-2 border border-border lg:grid-cols-4">
      {kpis.map((kpi, index) => (
        <div
          key={kpi.label}
          className={[
            "px-4 py-3 sm:px-5 sm:py-4",
            index > 0 ? "lg:border-s lg:border-border" : "",
            index % 2 === 1 ? "border-s border-border" : "",
            index >= 2 ? "border-t border-border lg:border-t-0" : "",
          ].join(" ")}
        >
          <p className="text-xs text-muted-foreground">{kpi.label}</p>
          <p className="mt-1 font-heading text-2xl font-semibold tabular-nums tracking-tight">{kpi.value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{kpi.hint}</p>
        </div>
      ))}
    </div>
  );
}

export function OverviewMonitor() {
  const reduced = useReducedMotion() ?? false;
  const animate = !reduced;
  const data = useQuery(api.overview.dashboard);

  if (data === undefined) {
    return (
      <div className="space-y-4">
        <KpiStrip
          kpis={[
            { label: "Live listings", value: "—", hint: "Sale + rent published" },
            { label: "Open leads", value: "—", hint: "New and contacted" },
            { label: "Drafts", value: "—", hint: "Waiting to publish" },
            { label: "Off-plan", value: "—", hint: "Active projects" },
          ]}
        />
        <div className="grid gap-4 lg:grid-cols-3">
          <Panel title="Published listings · 30 days" className="h-80 lg:col-span-2">
            <div className="h-full bg-muted/60" aria-hidden />
          </Panel>
          <Panel title="Lead applications" className="h-80">
            <div className="h-full bg-muted/60" aria-hidden />
          </Panel>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <Panel title="Inventory mix" className="h-80 lg:col-span-2">
            <div className="h-full bg-muted/60" aria-hidden />
          </Panel>
          <Panel title="Recent activity" className="h-80">
            <div className="h-full bg-muted/60" aria-hidden />
          </Panel>
        </div>
      </div>
    );
  }

  const applicationTotal = data.applications.reduce((sum, slice) => sum + slice.value, 0);

  return (
    <div className="space-y-4">
      <KpiStrip kpis={data.kpis} />

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Published listings · 30 days" className="h-80 lg:col-span-2">
          <ChartFrame>
            <AreaChart data={data.trend} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
              <CartesianGrid stroke={GRID} vertical={false} />
              <XAxis dataKey="day" tick={{ fill: MUTED, fontSize: 11 }} axisLine={false} tickLine={false} minTickGap={28} />
              <YAxis tick={{ fill: MUTED, fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area
                type="monotone"
                dataKey="listings"
                name="Listings"
                stroke={MAROON}
                fill={MAROON}
                fillOpacity={0.12}
                strokeWidth={2}
                isAnimationActive={animate}
              />
              <Area
                type="monotone"
                dataKey="leads"
                name="Leads"
                stroke={GOLD}
                fill={GOLD}
                fillOpacity={0.16}
                strokeWidth={2}
                isAnimationActive={animate}
              />
            </AreaChart>
          </ChartFrame>
        </Panel>

        <Panel
          title="Lead applications"
          className="h-80"
          footer={
            <ul className="grid grid-cols-1 gap-y-1 text-xs text-muted-foreground">
              {data.applications.map((slice) => (
                <li key={slice.name} className="flex items-center gap-2">
                  <span className="size-2 shrink-0 rounded-full" style={{ background: slice.color }} />
                  {slice.name}
                  <span className="ms-auto tabular-nums text-foreground">{slice.value}</span>
                </li>
              ))}
            </ul>
          }
        >
          {applicationTotal > 0 ? (
            <ChartFrame>
              <PieChart>
                <Pie
                  data={data.applications}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={52}
                  outerRadius={78}
                  paddingAngle={2}
                  isAnimationActive={animate}
                >
                  {data.applications.map((slice) => (
                    <Cell key={slice.name} fill={slice.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ChartFrame>
          ) : (
            <p className="text-sm text-muted-foreground">No inquiries yet.</p>
          )}
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Inventory mix" className="h-80 lg:col-span-2">
          <ChartFrame>
            <BarChart data={data.inventory} layout="vertical" margin={{ top: 8, right: 16, left: 4, bottom: 8 }}>
              <CartesianGrid stroke={GRID} horizontal={false} />
              <XAxis type="number" tick={{ fill: MUTED, fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <YAxis type="category" dataKey="name" tick={{ fill: INK, fontSize: 12 }} axisLine={false} tickLine={false} width={72} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(106,16,23,0.06)" }} />
              <Bar dataKey="value" name="Listings" fill={MAROON} radius={[0, 4, 4, 0]} barSize={18} isAnimationActive={animate} />
            </BarChart>
          </ChartFrame>
        </Panel>

        <Panel title="Recent activity" className="h-80" scroll>
          {data.activities.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing logged yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {data.activities.map((item) => (
                <li key={item.id} className="flex items-baseline justify-between gap-3 py-2.5 first:pt-0 last:pb-1">
                  <span className="min-w-0">
                    <span className="block truncate text-sm text-foreground">{item.title}</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">{item.kind}</span>
                  </span>
                  <time className="shrink-0 text-xs tabular-nums text-muted-foreground" dateTime={new Date(item.at).toISOString()}>
                    {formatActivityWhen(item.at)}
                  </time>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
