"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { api, type BacklogActivity } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/loading-state";
import { InlineError } from "@/components/inline-error";
import { timeAgo, formatDate, CHANGE_TYPE_LABELS } from "@/lib/backlog";

const CHANGE_TYPE_ICON: Record<string, string> = {
  create: "✦",
  status_change: "◈",
  field_edit: "✎",
  rank_change: "⠿",
  eng_review: "⚙",
  jira_export: "J",
  comment: "💬",
};

const CHANGE_TYPE_COLOR: Record<string, string> = {
  create: "bg-green-100 text-green-700",
  status_change: "bg-amber-100 text-amber-700",
  field_edit: "bg-violet-100 text-violet-700",
  rank_change: "bg-blue-100 text-blue-700",
  eng_review: "bg-orange-100 text-orange-700",
  jira_export: "bg-blue-100 text-blue-800",
  comment: "bg-muted text-muted-foreground",
};

const ROLE_COLOR: Record<string, string> = {
  pm: "bg-blue-100 text-blue-700",
  engineering: "bg-orange-100 text-orange-700",
  executive: "bg-purple-100 text-purple-700",
  manager: "bg-teal-100 text-teal-700",
};

function groupByDay(activities: BacklogActivity[]): { day: string; items: BacklogActivity[] }[] {
  const groups: Map<string, BacklogActivity[]> = new Map();
  for (const a of activities) {
    const day = new Date(a.createdAt).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
    const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
    const yesterday = new Date(Date.now() - 86400000).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
    const label = day === today ? "Today" : day === yesterday ? "Yesterday" : day;
    if (!groups.has(label)) groups.set(label, []);
    groups.get(label)!.push(a);
  }
  return [...groups.entries()].map(([day, items]) => ({ day, items }));
}

export default function ActivityPage() {
  const [activities, setActivities] = useState<BacklogActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState("");
  const [view, setView] = useState<"all" | "rank" | "status" | "mine">("all");

  const fetch = useCallback(() => {
    setLoading(true);
    api.backlog.activity({ ...(filterType && { changeType: filterType }) })
      .then(setActivities)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [filterType]);

  useEffect(() => { fetch(); }, [fetch]);

  const filtered = activities.filter((a) => {
    if (view === "rank") return a.changeType === "rank_change";
    if (view === "status") return a.changeType === "status_change";
    return true;
  });

  const grouped = groupByDay(filtered);

  type ChangesShape = { field?: string; from?: unknown; to?: unknown } | Array<{ field?: string; from?: unknown; to?: unknown }>;

  function renderChanges(activity: BacklogActivity) {
    if (!activity.changes) return null;
    const changes = activity.changes as ChangesShape;

    if (activity.changeType === "field_edit" && Array.isArray(changes)) {
      return (
        <div className="mt-2 bg-muted/50 rounded-lg p-3 border text-xs space-y-1.5">
          {(changes as { field: string; from: unknown; to: unknown }[]).map((c, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-muted-foreground w-24 shrink-0">{String(c.field)}</span>
              <span className="line-through text-muted-foreground">{String(c.from ?? "—")}</span>
              <span className="text-muted-foreground">→</span>
              <span className="font-semibold">{String(c.to ?? "—")}</span>
            </div>
          ))}
        </div>
      );
    }

    if (activity.changeType === "status_change" && !Array.isArray(changes)) {
      const c = changes as { field?: string; from?: unknown; to?: unknown };
      return (
        <div className="mt-2 bg-muted/50 rounded-lg px-3 py-2 border text-xs flex items-center gap-2">
          <span className="line-through text-muted-foreground">{String(c.from ?? "—")}</span>
          <span className="text-muted-foreground">→</span>
          <span className="font-semibold">{String(c.to ?? "—")}</span>
        </div>
      );
    }

    if (activity.changeType === "eng_review") {
      const c = changes as Record<string, unknown>;
      return (
        <div className="mt-2 bg-muted/50 rounded-lg p-3 border text-xs space-y-1">
          {["effort", "complexity", "confidence"].filter((k) => c[k]).map((k) => (
            <div key={k} className="flex gap-2">
              <span className="text-muted-foreground capitalize w-20">{k}</span>
              <span className="font-semibold">{String(c[k])}</span>
            </div>
          ))}
        </div>
      );
    }

    return null;
  }

  if (loading) return <LoadingState message="Loading activity feed…" />;
  if (error) return <InlineError message={error} onRetry={fetch} />;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Activity Feed</h1>
          <p className="text-sm text-muted-foreground mt-1">Every change, by whom, across the full portfolio</p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/backlog">← Backlog</Link>
        </Button>
      </div>

      {/* View tabs + filter */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex bg-muted rounded-lg p-0.5 gap-0.5">
          {(["all", "rank", "status", "mine"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${view === v ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              {v === "all" ? "All Activity" : v === "rank" ? "Ranking Changes" : v === "status" ? "Status Changes" : "My Items"}
            </button>
          ))}
        </div>
        <select
          className="text-sm border rounded-md px-3 py-1.5 bg-background"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="">All Change Types</option>
          {Object.entries(CHANGE_TYPE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <span className="text-xs text-muted-foreground">{filtered.length} events</span>
      </div>

      {/* Feed */}
      <div className="space-y-1">
        {grouped.map(({ day, items }) => (
          <div key={day}>
            {/* Day divider */}
            <div className="flex items-center gap-3 py-3">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{day}</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <div className="space-y-2">
              {items.map((activity) => (
                <div
                  key={activity.id}
                  className="rounded-xl border bg-card px-4 py-3 flex items-start gap-3 hover:shadow-sm transition-shadow"
                >
                  {/* Icon */}
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${CHANGE_TYPE_COLOR[activity.changeType] ?? "bg-muted text-muted-foreground"}`}>
                    {CHANGE_TYPE_ICON[activity.changeType] ?? "·"}
                  </div>

                  {/* Body */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">{activity.summary}</p>
                    {activity.item && (
                      <Link href={`/backlog/${activity.item.id}`} className="text-xs text-primary hover:underline">
                        {activity.item.title} · {activity.item.product?.name}
                      </Link>
                    )}
                    {activity.comment && (
                      <blockquote className="mt-2 text-sm italic text-muted-foreground bg-muted/40 rounded px-3 py-2 border-l-2 border-border">
                        {activity.comment}
                      </blockquote>
                    )}
                    {renderChanges(activity)}
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-xs text-muted-foreground">{timeAgo(activity.createdAt)}</span>
                    </div>
                  </div>

                  {/* Actor */}
                  {activity.actorName && (
                    <div className="flex items-center gap-2 shrink-0">
                      <div className={`text-xs font-semibold px-2 py-0.5 rounded-md ${ROLE_COLOR[activity.actorRole ?? ""] ?? "bg-muted text-muted-foreground"}`}>
                        {activity.actorRole?.toUpperCase() ?? ""}
                      </div>
                      <div className="flex items-center gap-1.5 bg-muted rounded-md px-2 py-1">
                        <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
                          {activity.actorName.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                        </div>
                        <span className="text-xs font-semibold">{activity.actorName.split(" ")[0]}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-16 text-muted-foreground text-sm">
            No activity found.
          </div>
        )}
      </div>
    </div>
  );
}
