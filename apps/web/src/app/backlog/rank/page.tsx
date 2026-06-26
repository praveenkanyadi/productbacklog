"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { api, type BacklogItem, type BacklogPortfolio } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/loading-state";
import { InlineError } from "@/components/inline-error";
import { scoreColor, statusStyle, initiativeStyle, formatArr } from "@/lib/backlog";
import { getCurrentUser } from "@/lib/auth";

export default function StackRankPage() {
  const user = getCurrentUser();
  const [items, setItems] = useState<BacklogItem[]>([]);
  const [portfolio, setPortfolio] = useState<BacklogPortfolio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterProduct, setFilterProduct] = useState("");
  const [ranked, setRanked] = useState<BacklogItem[]>([]);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);

  const fetchData = useCallback(() => {
    setLoading(true);
    Promise.all([
      api.backlog.list({ orderBy: "businessPriority", orderDir: "asc", take: 100 }),
      api.backlog.portfolio(),
    ])
      .then(([result, port]) => {
        setPortfolio(port);
        setItems(result.items);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    const filtered = filterProduct
      ? items.filter((i) => i.productId === filterProduct)
      : items;
    // Sort: items with businessPriority first (ascending), then unranked
    const withRank = filtered.filter((i) => i.businessPriority != null).sort((a, b) => (a.businessPriority ?? 999) - (b.businessPriority ?? 999));
    const withoutRank = filtered.filter((i) => i.businessPriority == null);
    setRanked([...withRank, ...withoutRank]);
    setDirty(false);
  }, [items, filterProduct]);

  function moveItem(id: string, direction: "up" | "down") {
    setRanked((prev) => {
      const idx = prev.findIndex((i) => i.id === id);
      if (direction === "up" && idx === 0) return prev;
      if (direction === "down" && idx === prev.length - 1) return prev;
      const next = [...prev];
      const swap = direction === "up" ? idx - 1 : idx + 1;
      [next[idx], next[swap]] = [next[swap], next[idx]];
      return next;
    });
    setDirty(true);
  }

  function onDragStart(id: string) { setDragging(id); }
  function onDragOver(e: React.DragEvent, id: string) { e.preventDefault(); setDragOver(id); }
  function onDrop(targetId: string) {
    if (!dragging || dragging === targetId) { setDragging(null); setDragOver(null); return; }
    setRanked((prev) => {
      const from = prev.findIndex((i) => i.id === dragging);
      const to = prev.findIndex((i) => i.id === targetId);
      if (from === -1 || to === -1) return prev;
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
    setDirty(true);
    setDragging(null);
    setDragOver(null);
  }

  async function handlePublish() {
    setSaving(true);
    try {
      const productId = filterProduct || ranked[0]?.productId || "";
      const updates = ranked.map((item, i) => ({ id: item.id, businessPriority: i + 1 }));
      await api.backlog.publishRanking(productId, updates);
      setDirty(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      fetchData();
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingState message="Loading stack ranking…" />;
  if (error) return <InlineError message={error} onRetry={fetchData} />;

  const cutlineIndex = ranked.findIndex((_, i) => i === 2); // Show cutline after rank 3

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Stack Ranking</h1>
          <p className="text-sm text-muted-foreground mt-1">Drag items to set PM priority · Engineering sees this order</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-muted rounded-lg p-0.5 gap-0.5">
            <Button variant="ghost" size="sm" className="text-xs h-7" asChild>
              <Link href="/backlog">Scored View</Link>
            </Button>
            <Button size="sm" className="text-xs h-7">⠿ Stack Rank</Button>
          </div>
          {dirty && (
            <Button variant="outline" size="sm" onClick={fetchData}>Discard</Button>
          )}
          <Button
            size="sm"
            onClick={handlePublish}
            disabled={saving || !dirty}
            className={saved ? "bg-green-600 hover:bg-green-700" : ""}
          >
            {saving ? "Publishing…" : saved ? "✓ Published!" : "Publish Ranking"}
          </Button>
        </div>
      </div>

      {/* Filter */}
      <div className="rounded-xl border bg-card p-3 flex items-center gap-3">
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
        <span className="text-xs text-muted-foreground">{ranked.length} items</span>
        {dirty && (
          <span className="text-xs text-amber-600 font-semibold">⚠ Unsaved changes — engineering won't see updates until you publish</span>
        )}
      </div>

      {/* Rank list */}
      <div className="space-y-2">
        {ranked.map((item, i) => {
          const rank = i + 1;
          const isDragging = dragging === item.id;
          const isDragOver = dragOver === item.id;

          return (
            <div key={item.id}>
              {i === 3 && (
                <div className="flex items-center gap-3 my-3">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                    Items below this line are in the next planning cycle
                  </span>
                  <div className="flex-1 h-px bg-border" />
                </div>
              )}
              <div
                draggable
                onDragStart={() => onDragStart(item.id)}
                onDragOver={(e) => onDragOver(e, item.id)}
                onDrop={() => onDrop(item.id)}
                onDragEnd={() => { setDragging(null); setDragOver(null); }}
                className={`rounded-xl border bg-card flex items-center gap-3 px-4 py-3 cursor-grab transition-all ${
                  isDragging ? "opacity-50 shadow-lg border-primary" : ""
                } ${isDragOver && !isDragging ? "border-primary bg-blue-50/50 scale-[1.01] shadow-md" : "hover:shadow-sm hover:border-muted-foreground/30"}`}
              >
                <span className="text-muted-foreground/40 text-lg select-none">⠿</span>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-extrabold shrink-0 ${
                  rank === 1 ? "bg-yellow-100 text-yellow-700" :
                  rank <= 3 ? "bg-muted text-foreground" : "bg-muted/50 text-muted-foreground"
                }`}>
                  {rank}
                </div>
                <div className="flex-1 min-w-0">
                  <Link href={`/backlog/${item.id}`} className="font-semibold text-sm hover:text-primary line-clamp-1">
                    {item.title}
                  </Link>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <Badge className={statusStyle(item.status.name)}>{item.status.name}</Badge>
                    {item.initiatives.slice(0, 2).map(({ initiative }) => (
                      <Badge key={initiative.id} className={initiativeStyle(initiative.name)}>{initiative.name}</Badge>
                    ))}
                    <span className="text-xs text-muted-foreground">{item.product.name}{item.productArea ? ` · ${item.productArea.name}` : ""}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right">
                    <p className="text-sm font-bold">{formatArr(item.arrRepresented)}</p>
                    <p className="text-xs text-muted-foreground">ARR</p>
                  </div>
                  <div className="text-center">
                    <span className={`inline-flex items-center justify-center w-9 h-6 rounded text-xs font-bold ${scoreColor(item.priorityScore)}`}>
                      {item.priorityScore ?? "—"}
                    </span>
                    <p className="text-xs text-muted-foreground">score</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => moveItem(item.id, "up")} disabled={i === 0} className="w-6 h-6 rounded border bg-background text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 flex items-center justify-center text-xs">↑</button>
                    <button onClick={() => moveItem(item.id, "down")} disabled={i === ranked.length - 1} className="w-6 h-6 rounded border bg-background text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 flex items-center justify-center text-xs">↓</button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {ranked.length === 0 && (
        <div className="text-center py-16 text-muted-foreground text-sm">
          No items to rank. <Link href="/backlog/new" className="text-primary hover:underline">Create a backlog item</Link> to get started.
        </div>
      )}
    </div>
  );
}
