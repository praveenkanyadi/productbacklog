// Shared helpers for backlog UI

export const STATUS_STYLES: Record<string, string> = {
  Idea: "bg-secondary text-secondary-foreground",
  "Product Review": "bg-yellow-100 text-yellow-800",
  "Engineering Review": "bg-amber-100 text-amber-800",
  Approved: "bg-green-100 text-green-800",
  "In Progress": "bg-blue-100 text-blue-800",
  Deferred: "bg-slate-100 text-slate-600",
  Closed: "bg-red-100 text-red-800",
};

export const INITIATIVE_STYLES: Record<string, string> = {
  AI: "bg-purple-100 text-purple-800",
  Enterprise: "bg-orange-100 text-orange-800",
  "Cross Sell": "bg-amber-100 text-amber-800",
  Retention: "bg-violet-100 text-violet-800",
  Healthcare: "bg-teal-100 text-teal-800",
  Hospitality: "bg-cyan-100 text-cyan-800",
  "K-12": "bg-indigo-100 text-indigo-800",
  "Public Safety": "bg-blue-100 text-blue-800",
  Compliance: "bg-red-100 text-red-800",
  Platform: "bg-gray-100 text-gray-700",
};

export const CHURN_STYLES: Record<string, string> = {
  Critical: "bg-red-100 text-red-800",
  High: "bg-orange-100 text-orange-800",
  "Medium-High": "bg-amber-100 text-amber-800",
  Medium: "bg-yellow-100 text-yellow-800",
  Low: "bg-green-100 text-green-800",
  None: "bg-secondary text-secondary-foreground",
};

export const EFFORT_LABELS: Record<string, string> = {
  XS: "Extra Small",
  S: "Small",
  M: "Medium",
  L: "Large",
  XL: "Extra Large",
};

export const CHANGE_TYPE_LABELS: Record<string, string> = {
  create: "Created",
  status_change: "Status Changed",
  field_edit: "Fields Updated",
  rank_change: "Rank Changed",
  eng_review: "Engineering Review",
  jira_export: "Jira Ticket Created",
  comment: "Comment",
};

export function scoreColor(score: number | null): string {
  if (score === null) return "bg-secondary text-secondary-foreground";
  if (score >= 80) return "bg-green-100 text-green-800";
  if (score >= 60) return "bg-yellow-100 text-yellow-800";
  return "bg-secondary text-secondary-foreground";
}

export function initiativeStyle(name: string): string {
  return INITIATIVE_STYLES[name] ?? "bg-secondary text-secondary-foreground";
}

export function statusStyle(name: string): string {
  return STATUS_STYLES[name] ?? "bg-secondary text-secondary-foreground";
}

export function churnStyles(risk: string): string {
  return CHURN_STYLES[risk] ?? "bg-secondary text-secondary-foreground";
}

export function formatArr(val: string | number | null): string {
  if (!val) return "—";
  const n = Number(val);
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}

export function timeAgo(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export const CHURN_RISK_OPTIONS = ["None", "Low", "Medium", "Medium-High", "High", "Critical"];
export const EFFORT_OPTIONS = ["XS", "S", "M", "L", "XL"];
export const COMPLEXITY_OPTIONS = ["Low", "Medium", "High"];
export const CONFIDENCE_OPTIONS = ["Low", "Medium", "High"];
export const DISCOVERY_OPTIONS = ["Not Started", "In Progress", "Complete"];
export const QUARTER_OPTIONS = ["Q1 2026", "Q2 2026", "Q3 2026", "Q4 2026", "Q1 2027", "Q2 2027"];
