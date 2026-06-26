"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api, type BacklogItem, type CustomerQuote } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/loading-state";
import { InlineError } from "@/components/inline-error";
import {
  scoreColor, statusStyle, initiativeStyle, churnStyles,
  formatArr, formatDate, timeAgo, CHANGE_TYPE_LABELS, EFFORT_LABELS,
} from "@/lib/backlog";
import { getCurrentUser } from "@/lib/auth";

// Score breakdown weights
function scoreBreakdown(item: BacklogItem) {
  const arr = Number(item.arrRepresented ?? 0);
  const rev = Number(item.revenueOpportunity ?? 0);
  const churnMap: Record<string, number> = { Critical: 20, High: 15, "Medium-High": 12, Medium: 8, Low: 4, None: 0 };
  const churnPts = churnMap[item.churnRisk ?? ""] ?? 0;
  const initPts = Math.min(15, item.initiatives.length * 5);
  const compPts = item.isComplianceRequirement ? 10 : 0;
  const gapPts = item.isCompetitiveGap ? 5 : 0;
  const complexBonus: Record<string, number> = { XS: 5, S: 4, M: 3, L: 2, XL: 1 };
  const complexPts = complexBonus[item.estimatedEffort ?? ""] ?? 0;
  return [
    { label: "Customer Impact (ARR)", pts: Math.min(30, Math.round((arr / 5_000_000) * 30)), max: 30 },
    { label: "Revenue Opportunity", pts: Math.min(15, Math.round((rev / 2_000_000) * 15)), max: 15 },
    { label: "Strategic Fit", pts: initPts, max: 15 },
    { label: "Churn Risk", pts: churnPts, max: 20 },
    { label: "Compliance/Competitive", pts: compPts + gapPts, max: 15 },
    { label: "Eng Complexity Bonus", pts: complexPts, max: 5 },
  ];
}

export default function BacklogDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [item, setItem] = useState<BacklogItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"quotes" | "impact" | "opportunities">("quotes");
  const [comment, setComment] = useState("");
  const [commentSaving, setCommentSaving] = useState(false);
  const [jiraModal, setJiraModal] = useState(false);
  const [jiraKey, setJiraKey] = useState("");
  const [jiraUrl, setJiraUrl] = useState("");
  const [jiraSaving, setJiraSaving] = useState(false);
  const user = getCurrentUser();

  const fetchItem = useCallback(() => {
    setLoading(true);
    api.backlog.get(id)
      .then(setItem)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { fetchItem(); }, [fetchItem]);

  async function handleComment(e: React.FormEvent) {
    e.preventDefault();
    if (!comment.trim()) return;
    setCommentSaving(true);
    try {
      await api.backlog.addComment(id, comment);
      setComment("");
      fetchItem();
    } finally {
      setCommentSaving(false);
    }
  }

  async function handleJiraLink(e: React.FormEvent) {
    e.preventDefault();
    if (!jiraKey || !jiraUrl) return;
    setJiraSaving(true);
    try {
      await api.backlog.linkJira(id, { jiraIssueKey: jiraKey, jiraUrl });
      setJiraModal(false);
      fetchItem();
    } finally {
      setJiraSaving(false);
    }
  }

  if (loading) return <LoadingState message="Loading backlog item…" />;
  if (error) return <InlineError message={error} onRetry={fetchItem} />;
  if (!item) return null;

  const breakdown = scoreBreakdown(item);
  const quotes: CustomerQuote[] = Array.isArray(item.customerQuotes) ? item.customerQuotes as CustomerQuote[] : [];

  return (
    <div className="space-y-4">
      {/* Breadcrumb + actions */}
      <div className="flex items-center justify-between gap-4">
        <nav className="text-sm text-muted-foreground flex items-center gap-1">
          <Link href="/backlog" className="hover:text-primary">Backlog</Link>
          <span>›</span>
          <span>{item.product.name}</span>
          <span>›</span>
          <span className="text-foreground font-medium line-clamp-1 max-w-sm">{item.title}</span>
        </nav>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" size="sm" asChild>
            <Link href="/backlog">← Back</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/backlog/${id}/edit`}>Edit</Link>
          </Button>
          {!item.jiraIssueKey && (
            <Button variant="outline" size="sm" onClick={() => setJiraModal(true)}>
              Create in Jira
            </Button>
          )}
        </div>
      </div>

      {/* Title + meta */}
      <div>
        <h1 className="text-2xl font-bold mb-2">{item.title}</h1>
        <div className="flex flex-wrap items-center gap-2">
          <Badge className={statusStyle(item.status.name)}>{item.status.name}</Badge>
          <Badge variant="outline">{item.product.name}</Badge>
          {item.productArea && <Badge variant="secondary">{item.productArea.name}</Badge>}
          {item.initiatives.map(({ initiative }) => (
            <Badge key={initiative.id} className={initiativeStyle(initiative.name)}>{initiative.name}</Badge>
          ))}
          {item.jiraIssueKey && (
            <a href={item.jiraUrl ?? "#"} target="_blank" rel="noopener noreferrer"
               className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded hover:underline">
              {item.jiraIssueKey} ↗
            </a>
          )}
          {item.createdBy && (
            <span className="text-xs text-muted-foreground">
              · Created {item.createdAt ? formatDate(item.createdAt) : ""} by {item.createdBy.name}
            </span>
          )}
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-[1fr_288px] gap-4 items-start">

        {/* Main column */}
        <div className="space-y-4">

          {/* Problem Statement */}
          <div className="rounded-xl border bg-card overflow-hidden">
            <div className="px-4 py-3 border-b flex items-center justify-between">
              <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Problem Statement</h2>
              <Button variant="ghost" size="sm" className="text-xs h-6" asChild>
                <Link href={`/backlog/${id}/edit`}>Edit ✎</Link>
              </Button>
            </div>
            <div className="p-4 space-y-4">
              {item.problemStatement ? (
                <p className="text-sm leading-relaxed">{item.problemStatement}</p>
              ) : (
                <p className="text-sm text-muted-foreground italic">No problem statement added yet.</p>
              )}
              {item.successMetrics && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Success Metrics</p>
                  <p className="text-sm whitespace-pre-line">{item.successMetrics}</p>
                </div>
              )}
              {item.alternativesConsidered && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Alternatives Considered</p>
                  <p className="text-sm">{item.alternativesConsidered}</p>
                </div>
              )}
            </div>
          </div>

          {/* Customer Evidence */}
          <div className="rounded-xl border bg-card overflow-hidden">
            <div className="px-4 py-3 border-b flex items-center justify-between">
              <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Customer Evidence</h2>
              <Button variant="ghost" size="sm" className="text-xs h-6" asChild>
                <Link href={`/backlog/${id}/edit`}>+ Add Quote</Link>
              </Button>
            </div>
            <div className="flex border-b">
              {(["quotes", "impact", "opportunities"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2.5 text-xs font-medium border-b-2 -mb-px transition-colors ${activeTab === tab ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
                >
                  {tab === "quotes" ? `Quotes (${quotes.length})` : tab === "impact" ? "Impact Data" : "Opportunities"}
                </button>
              ))}
            </div>
            <div className="p-4 space-y-3">
              {activeTab === "quotes" && (
                quotes.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">No customer quotes added yet.</p>
                ) : (
                  quotes.map((q, i) => (
                    <div key={i} className="bg-muted/40 rounded-lg p-3 border">
                      <p className="text-sm italic leading-relaxed mb-2">"{q.quote}"</p>
                      <p className="text-xs text-muted-foreground">
                        {q.customer}{q.arr ? ` · ${formatArr(q.arr)} ARR` : ""}{q.source ? ` · ${q.source}` : ""}{q.date ? ` · ${q.date}` : ""}
                      </p>
                    </div>
                  ))
                )
              )}
              {activeTab === "impact" && (
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: "Customers Impacted", value: item.customersImpacted ?? "—" },
                    { label: "ARR Represented", value: formatArr(item.arrRepresented) },
                    { label: "Opportunities Blocked", value: item.opportunitiesBlocked ?? "—" },
                    { label: "Churn Risk", value: item.churnRisk ?? "—" },
                    { label: "Customer Segment", value: item.customerSegment ?? "—" },
                    { label: "Vertical", value: item.vertical ?? "—" },
                  ].map((f) => (
                    <div key={f.label}>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">{f.label}</p>
                      <p className="text-sm font-semibold">{String(f.value)}</p>
                    </div>
                  ))}
                </div>
              )}
              {activeTab === "opportunities" && (
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: "Revenue Opportunity", value: formatArr(item.revenueOpportunity) },
                    { label: "Cross-Sell Opportunity", value: item.crossSellOpportunity ?? "—" },
                    { label: "Retention Impact", value: item.retentionImpact ?? "—" },
                    { label: "Compliance Req.", value: item.isComplianceRequirement ? "Yes" : "No" },
                    { label: "Competitive Gap", value: item.isCompetitiveGap ? "Yes" : "No" },
                    { label: "Customer Satisfaction", value: item.customerSatisfaction ?? "—" },
                  ].map((f) => (
                    <div key={f.label}>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">{f.label}</p>
                      <p className="text-sm font-semibold">{String(f.value)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Activity */}
          <div className="rounded-xl border bg-card overflow-hidden">
            <div className="px-4 py-3 border-b">
              <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Activity</h2>
            </div>
            <div className="p-4 space-y-4">
              {/* Comment form */}
              <form onSubmit={handleComment} className="flex gap-2">
                <input
                  className="flex-1 text-sm border rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Add a comment…"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
                <Button type="submit" size="sm" disabled={!comment.trim() || commentSaving}>
                  {commentSaving ? "Saving…" : "Comment"}
                </Button>
              </form>

              {/* Activity list */}
              {(item.activities ?? []).map((activity) => (
                <div key={activity.id} className="flex gap-3">
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                    activity.changeType === "status_change" ? "bg-amber-500" :
                    activity.changeType === "rank_change" ? "bg-blue-500" :
                    activity.changeType === "eng_review" ? "bg-orange-500" :
                    activity.changeType === "jira_export" ? "bg-blue-700" :
                    activity.changeType === "comment" ? "bg-gray-400" :
                    activity.changeType === "create" ? "bg-green-500" : "bg-muted-foreground"
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">{activity.summary}</p>
                    {activity.comment && (
                      <blockquote className="mt-1 text-sm italic text-muted-foreground bg-muted/40 rounded px-3 py-2 border-l-2 border-border">
                        {activity.comment}
                      </blockquote>
                    )}
                    <p className="text-xs text-muted-foreground mt-0.5">{timeAgo(activity.createdAt)}</p>
                  </div>
                </div>
              ))}
              {(!item.activities || item.activities.length === 0) && (
                <p className="text-sm text-muted-foreground italic">No activity yet.</p>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-3">

          {/* Priority Score */}
          <div className="rounded-xl border bg-card overflow-hidden">
            <div className="p-4 text-center border-b">
              <div className={`text-5xl font-extrabold mb-1 ${item.priorityScore != null && item.priorityScore >= 80 ? "text-green-600" : item.priorityScore != null && item.priorityScore >= 60 ? "text-amber-600" : "text-foreground"}`}>
                {item.priorityScore ?? "—"}
              </div>
              <p className="text-xs text-muted-foreground">Priority Score</p>
            </div>
            <div className="p-3 space-y-2">
              {breakdown.map((row) => (
                <div key={row.label} className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-32 shrink-0">{row.label}</span>
                  <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${Math.round((row.pts / row.max) * 100)}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold w-6 text-right">{row.pts}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Item details */}
          <div className="rounded-xl border bg-card overflow-hidden divide-y">
            {[
              { key: "Status", value: <Badge className={statusStyle(item.status.name)}>{item.status.name}</Badge> },
              { key: "Product", value: item.product.name },
              { key: "Product Area", value: item.productArea?.name ?? "—" },
              {
                key: "Initiatives",
                value: item.initiatives.length > 0
                  ? <div className="flex flex-wrap gap-1 justify-end">{item.initiatives.map(({ initiative }) => <Badge key={initiative.id} className={`text-xs ${initiativeStyle(initiative.name)}`}>{initiative.name}</Badge>)}</div>
                  : "—"
              },
              { key: "Owner", value: item.owner?.name ?? "—" },
              { key: "Source", value: item.source?.name ?? "—" },
              { key: "Quarter", value: item.roadmapQuarter ?? "—" },
              { key: "Rank", value: item.businessPriority != null ? `#${item.businessPriority}` : "Unranked" },
              { key: "Target Release", value: item.targetRelease?.name ?? "—" },
            ].map(({ key, value }) => (
              <div key={key} className="flex items-start justify-between px-3 py-2.5">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{key}</span>
                <span className="text-xs font-medium text-right max-w-[140px]">
                  {typeof value === "string" ? value : value}
                </span>
              </div>
            ))}
          </div>

          {/* Engineering Assessment */}
          <div className="rounded-xl border bg-card overflow-hidden">
            <div className="px-3 py-2.5 border-b flex items-center justify-between">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Engineering Assessment</h3>
              {(user.role === "engineering" || user.role === "pm") && (
                <Button variant="ghost" size="sm" className="text-xs h-6" asChild>
                  <Link href={`/backlog/${id}/edit?tab=eng`}>Edit ✎</Link>
                </Button>
              )}
            </div>
            <div className="divide-y">
              {[
                { key: "Effort", value: item.estimatedEffort ? `${EFFORT_LABELS[item.estimatedEffort] ?? item.estimatedEffort} (${item.estimatedEffort})` : "—" },
                { key: "Complexity", value: item.complexity ?? "—" },
                { key: "Timeline", value: item.timelineEstimate ?? "—" },
                { key: "Confidence", value: item.confidenceLevel ?? "—" },
                { key: "Dependencies", value: item.technicalDependencies ?? "—" },
                ...(item.engReviewedBy ? [{ key: "Reviewed By", value: item.engReviewedBy.name }] : []),
              ].map(({ key, value }) => (
                <div key={key} className="flex items-start justify-between px-3 py-2">
                  <span className="text-xs text-muted-foreground">{key}</span>
                  <span className="text-xs font-semibold text-right max-w-[140px]">{value}</span>
                </div>
              ))}
              {!item.estimatedEffort && (
                <div className="p-3">
                  {user.role === "engineering" ? (
                    <Button size="sm" className="w-full text-xs" asChild>
                      <Link href={`/backlog/${id}/edit?tab=eng`}>Start Review</Link>
                    </Button>
                  ) : (
                    <p className="text-xs text-muted-foreground text-center italic">Awaiting engineering review</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* AI Actions (stubbed) */}
          <div className="rounded-xl border bg-card overflow-hidden">
            <div className="px-3 py-2.5 border-b flex items-center gap-2">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wide">AI Actions</h3>
              <Badge variant="outline" className="text-xs py-0 px-1.5">Coming Soon</Badge>
            </div>
            <div className="p-3 space-y-2">
              {["Generate Product Spec", "Generate Epics", "Generate User Stories", "Export to Jira"].map((label) => (
                <button
                  key={label}
                  disabled
                  className="w-full text-left text-xs text-muted-foreground border border-dashed rounded-lg px-3 py-2 cursor-not-allowed opacity-60 hover:opacity-80"
                >
                  ✦ {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Jira modal */}
      {jiraModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-xl border shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-[#0052cc] text-white px-5 py-4 flex items-center justify-between">
              <h2 className="font-bold text-sm">Create Jira Ticket</h2>
              <button onClick={() => setJiraModal(false)} className="text-white/80 hover:text-white text-lg leading-none">✕</button>
            </div>
            <form onSubmit={handleJiraLink} className="p-5 space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1">Jira Issue Key</label>
                <input
                  className="w-full text-sm border rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="e.g. HUM-1234"
                  value={jiraKey}
                  onChange={(e) => setJiraKey(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1">Jira URL</label>
                <input
                  className="w-full text-sm border rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="https://yourcompany.atlassian.net/browse/HUM-1234"
                  value={jiraUrl}
                  onChange={(e) => setJiraUrl(e.target.value)}
                  type="url"
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Enter the Jira issue key and URL after creating the ticket manually. Direct Jira API integration is coming in a future release.
              </p>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setJiraModal(false)}>Cancel</Button>
                <Button type="submit" size="sm" disabled={jiraSaving} className="bg-[#0052cc] hover:bg-[#0043a8]">
                  {jiraSaving ? "Linking…" : "Link Ticket"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
