"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { api, type BacklogItem, type BacklogTaxonomy, type BacklogPortfolio } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/empty-state";
import { LoadingState } from "@/components/loading-state";
import { InlineError } from "@/components/inline-error";
import { scoreColor, statusStyle, initiativeStyle, formatArr, formatDate } from "@/lib/backlog";

const EFFORT_WIDTHS: Record<string, string> = { XS: "w-1/5", S: "w-2/5", M: "w-3/5", L: "w-4/5", XL: "w-full" };
const EFFORT_COLORS: Record<string, string> = { XS: "bg-green-500", S: "bg-green-400", M: "bg-blue-500", L: "bg-amber-500", XL: "bg-red-500" };

export default function BacklogPage() {
  const [items, setItems] = useState<BacklogItem[]>([]);
  const [total, setTotal] = useState(0);
  const [taxonomy, setTaxonomy] = useState<BacklogTaxonomy | null>(null);
  const [portfolio, setPortfolio] = useState<BacklogPortfolio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterProduct, setFilterProduct] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterInitiative, setFilterInitiative] = useState("");
  const [filterQuarter, setFilterQuarter] = useState("");

  const fetchData = useCallback(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      api.backlog.list({
        ...(search && { search }),
        ...(filterProduct && { productId: filterProduct }),
        ...(filterStatus && { statusId: filterStatus }),
        ...(filterInitiative && { initiativeId: filterInitiative }),
        ...(filterQuarter && { roadmapQuarter: filterQuarter }),
        orderBy: "businessPriority",
        orderDir: "asc",
        take: 50,
      }),
      api.backlog.taxonomy(),
      api.backlog.portfolio(),
    ])
      .then(([result, tax, port]) => {
        setItems(result.items);
        setTotal(result.total);
        setTaxonomy(tax);
        setPortfolio(port);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [search, filterProduct, filterStatus, filterInitiative, filterQuarter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const kpiApproved = items.filter((i) => i.status.name === "Approved").length;
  const kpiPendingReview = items.filter((i) => ["Product Review", "Engineering Review"].includes(i.status.name)).length;
  const kpiTotalArr = items.reduce((sum, i) => sum + Number(i.arrRepresented ?? 0), 0);
  const kpiChurn = items.filter((i) => ["High", "Critical", "Medium-High"].includes(i.churnRisk ?? "")).length;

  if (loading) return <LoadingState message="Loading backlog…" />;
  if (error) return <InlineError message={error} onRetry={fetchData} />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">AI Product Backlog</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Workforce Management Portfolio · {total} item{total !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/backlog/rank">⠿ Stack Rank</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/backlog/activity">Activity</Link>
          </Button>
          <Button asChild>
            <Link href="/backlog/new">+ New Item</Link>
          </Button>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Total Items", value: total, sub: `Across ${portfolio.flatMap((p) => p.products).length} products` },
          { label: "Pending Review", value: kpiPendingReview, sub: "Awaiting review", valueClass: "text-amber-600" },
          { label: "ARR Represented", value: formatArr(kpiTotalArr), sub: "Across all items", valueClass: "text-red-600" },
          { label: "Approved", value: kpiApproved, sub: "Ready for planning", valueClass: "text-green-600" },
        ].map((k) => (
          <div key={k.label} className="rounded-xl border bg-card p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">{k.label}</p>
            <p className={`text-2xl font-bold ${k.valueClass ?? ""}`}>{k.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="rounded-xl border bg-card p-3 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 bg-muted rounded-md px-3 py-1.5 flex-1 min-w-[180px]">
          <svg className="w-3.5 h-3.5 text-muted-foreground" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          <Input
            className="border-0 bg-transparent p-0 h-auto text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
            placeholder="Search backlog items…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="text-sm border rounded-md px-3 py-1.5 bg-background"
          value={filterProduct}
          onChange={(e) => setFilterProduct(e.target.value)}
        >
          <option value="">All Products</option>
          {portfolio.flatMap((p) => p.products).map((prod) => (
            <option key={prod.id} value={prod.id}>{prod.name}</option>
          ))}
        </select>
        <select
          className="text-sm border rounded-md px-3 py-1.5 bg-background"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">All Statuses</option>
          {taxonomy?.statuses.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        <select
          className="text-sm border rounded-md px-3 py-1.5 bg-background"
          value={filterInitiative}
          onChange={(e) => setFilterInitiative(e.target.value)}
        >
          <option value="">All Initiatives</option>
          {taxonomy?.initiatives.map((i) => (
            <option key={i.id} value={i.id}>{i.name}</option>
          ))}
        </select>
        <select
          className="text-sm border rounded-md px-3 py-1.5 bg-background"
          value={filterQuarter}
          onChange={(e) => setFilterQuarter(e.target.value)}
        >
          <option value="">All Quarters</option>
          {["Q1 2026", "Q2 2026", "Q3 2026", "Q4 2026", "Q1 2027"].map((q) => (
            <option key={q} value={q}>{q}</option>
          ))}
        </select>
        {(filterProduct || filterStatus || filterInitiative || filterQuarter || search) && (
          <Button
            variant="ghost"
            size="sm"
            className="text-xs"
            onClick={() => { setFilterProduct(""); setFilterStatus(""); setFilterInitiative(""); setFilterQuarter(""); setSearch(""); }}
          >
            Clear
          </Button>
        )}
      </div>

      {/* Table */}
      {items.length === 0 ? (
        <EmptyState title="No items found" description="Try adjusting your filters or create a new backlog item." />
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 text-muted-foreground text-xs font-semibold uppercase tracking-wide">
                <th className="text-left px-4 py-3">Title</th>
                <th className="text-left px-4 py-3">Product · Area</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Initiatives</th>
                <th className="text-left px-4 py-3">ARR</th>
                <th className="text-left px-4 py-3">Effort</th>
                <th className="text-left px-4 py-3">Score</th>
                <th className="text-left px-4 py-3">Quarter</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-t hover:bg-muted/30 cursor-pointer">
                  <td className="px-4 py-3 max-w-xs">
                    <Link href={`/backlog/${item.id}`} className="block">
                      <p className="font-semibold text-foreground line-clamp-1">{item.title}</p>
                      {item.description && (
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{item.description}</p>
                      )}
                      {item.jiraIssueKey && (
                        <span className="text-xs text-blue-600 font-medium">{item.jiraIssueKey}</span>
                      )}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-medium">{item.product.name}</span>
                    {item.productArea && (
                      <p className="text-xs text-muted-foreground">{item.productArea.name}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={statusStyle(item.status.name)}>{item.status.name}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {item.initiatives.slice(0, 2).map(({ initiative }) => (
                        <Badge key={initiative.id} className={initiativeStyle(initiative.name)}>
                          {initiative.name}
                        </Badge>
                      ))}
                      {item.initiatives.length > 2 && (
                        <Badge variant="outline">+{item.initiatives.length - 2}</Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-semibold">{formatArr(item.arrRepresented)}</span>
                    {item.churnRisk && item.churnRisk !== "None" && (
                      <p className="text-xs text-red-600">{item.churnRisk} churn</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {item.estimatedEffort ? (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">{item.estimatedEffort}</p>
                        <div className="h-1.5 w-14 bg-muted rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${EFFORT_WIDTHS[item.estimatedEffort] ?? "w-1/2"} ${EFFORT_COLORS[item.estimatedEffort] ?? "bg-primary"}`} />
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {item.priorityScore != null ? (
                      <span className={`inline-flex items-center justify-center w-9 h-6 rounded text-xs font-bold ${scoreColor(item.priorityScore)}`}>
                        {item.priorityScore}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {item.roadmapQuarter ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="border-t px-4 py-3 flex items-center justify-between text-xs text-muted-foreground">
            <span>Showing {items.length} of {total} items</span>
            <span>Sorted by PM stack rank</span>
          </div>
        </div>
      )}
    </div>
  );
}
