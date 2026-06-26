import { getCurrentUser } from "@/lib/auth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";

// ---------------------------------------------------------------------------
// Backlog types
// ---------------------------------------------------------------------------

export interface BacklogPortfolio {
  id: string;
  name: string;
  products: BacklogProduct[];
}

export interface BacklogProduct {
  id: string;
  name: string;
  portfolioId: string;
  productAreas: BacklogProductArea[];
}

export interface BacklogProductArea {
  id: string;
  name: string;
  productId: string;
}

export interface BacklogStatus {
  id: string;
  name: string;
  color: string | null;
}

export interface BacklogSource {
  id: string;
  name: string;
}

export interface BacklogRelease {
  id: string;
  name: string;
}

export interface BacklogInitiative {
  id: string;
  name: string;
  color: string | null;
}

export interface BacklogTaxonomy {
  statuses: BacklogStatus[];
  sources: BacklogSource[];
  releases: BacklogRelease[];
  initiatives: BacklogInitiative[];
}

export interface CustomerQuote {
  quote: string;
  customer: string;
  arr?: number;
  source?: string;
  date?: string;
}

export interface BacklogItem {
  id: string;
  title: string;
  description: string | null;
  productId: string;
  productAreaId: string | null;
  statusId: string;
  sourceId: string | null;
  ownerId: string | null;
  createdById: string | null;
  // Customer Impact
  customersImpacted: number | null;
  arrRepresented: string | null;
  opportunitiesBlocked: number | null;
  churnRisk: string | null;
  customerSegment: string | null;
  vertical: string | null;
  customerQuotes: CustomerQuote[] | null;
  supportingEvidence: string | null;
  // Business Impact
  revenueOpportunity: string | null;
  crossSellOpportunity: string | null;
  retentionImpact: string | null;
  isComplianceRequirement: boolean;
  isCompetitiveGap: boolean;
  customerSatisfaction: string | null;
  strategicNotes: string | null;
  // Product Assessment
  problemStatement: string | null;
  discoveryStatus: string | null;
  assumptions: string | null;
  successMetrics: string | null;
  alternativesConsidered: string | null;
  productNotes: string | null;
  // Engineering Assessment
  estimatedEffort: string | null;
  complexity: string | null;
  timelineEstimate: string | null;
  technicalDependencies: string | null;
  risks: string | null;
  architectureNotes: string | null;
  confidenceLevel: string | null;
  engReviewedAt: string | null;
  // Planning
  priorityScore: number | null;
  targetReleaseId: string | null;
  roadmapQuarter: string | null;
  businessPriority: number | null;
  engineeringPriority: number | null;
  rankPublishedAt: string | null;
  // Jira
  jiraIssueKey: string | null;
  jiraUrl: string | null;
  jiraCreatedAt: string | null;
  // Relations
  product: { id: string; name: string };
  productArea: { id: string; name: string } | null;
  status: BacklogStatus;
  source: BacklogSource | null;
  targetRelease: BacklogRelease | null;
  owner: { id: string; name: string } | null;
  createdBy: { id: string; name: string } | null;
  engReviewedBy: { id: string; name: string } | null;
  initiatives: { initiative: BacklogInitiative }[];
  activities?: BacklogActivity[];
  createdAt: string;
  updatedAt: string;
}

export interface BacklogActivity {
  id: string;
  itemId: string;
  actorId: string | null;
  actorName: string | null;
  actorRole: string | null;
  changeType: string;
  summary: string;
  changes: unknown;
  comment: string | null;
  createdAt: string;
  item?: { id: string; title: string; product: { name: string } };
  actor?: { id: string; name: string } | null;
}

export interface BacklogListResult {
  items: BacklogItem[];
  total: number;
}

async function fetchApi<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const user = typeof window !== "undefined" ? getCurrentUser() : undefined;
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(user && { "X-EDM-User-Id": user.id }),
      ...(user && { "x-actor-name": user.name }),
      ...(user && { "x-actor-role": user.role }),
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? res.statusText);
  }
  return res.json();
}

export const api = {
  backlog: {
    list: (params: Record<string, string | number | undefined> = {}) => {
      const qs = new URLSearchParams(
        Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)]))
      ).toString();
      return fetchApi<BacklogListResult>(`/backlog${qs ? `?${qs}` : ""}`);
    },
    get: (id: string) => fetchApi<BacklogItem>(`/backlog/${id}`),
    create: (data: Record<string, unknown>) =>
      fetchApi<BacklogItem>("/backlog", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: Record<string, unknown>) =>
      fetchApi<BacklogItem>(`/backlog/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: string) =>
      fetchApi<void>(`/backlog/${id}`, { method: "DELETE" }),
    submitEngReview: (id: string, data: Record<string, unknown>) =>
      fetchApi<BacklogItem>(`/backlog/${id}/eng-review`, { method: "POST", body: JSON.stringify(data) }),
    publishRanking: (productId: string, updates: { id: string; businessPriority: number }[]) =>
      fetchApi<{ updated: number }>("/backlog/rank", { method: "POST", body: JSON.stringify({ productId, updates }) }),
    addComment: (id: string, comment: string) =>
      fetchApi<BacklogActivity>(`/backlog/${id}/comment`, { method: "POST", body: JSON.stringify({ comment }) }),
    linkJira: (id: string, data: { jiraIssueKey: string; jiraUrl: string }) =>
      fetchApi<BacklogItem>(`/backlog/${id}/jira`, { method: "POST", body: JSON.stringify(data) }),
    portfolio: () => fetchApi<BacklogPortfolio[]>("/backlog/portfolio"),
    taxonomy: () => fetchApi<BacklogTaxonomy>("/backlog/taxonomy"),
    activity: (params: Record<string, string | undefined> = {}) => {
      const qs = new URLSearchParams(
        Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined) as [string, string][])
      ).toString();
      return fetchApi<BacklogActivity[]>(`/backlog/activity${qs ? `?${qs}` : ""}`);
    },
    admin: {
      upsertProduct: (data: { id?: string; portfolioId: string; name: string; sortOrder?: number }) =>
        fetchApi<BacklogProduct>("/backlog/admin/products", { method: "POST", body: JSON.stringify(data) }),
      deleteProduct: (id: string) =>
        fetchApi<{ ok: boolean }>(`/backlog/admin/products/${id}`, { method: "DELETE" }),
      upsertProductArea: (data: { id?: string; productId: string; name: string; sortOrder?: number }) =>
        fetchApi<BacklogProductArea>("/backlog/admin/product-areas", { method: "POST", body: JSON.stringify(data) }),
      deleteProductArea: (id: string) =>
        fetchApi<{ ok: boolean }>(`/backlog/admin/product-areas/${id}`, { method: "DELETE" }),
      upsertStatus: (data: { id?: string; name: string; color?: string; isDefault?: boolean; sortOrder?: number }) =>
        fetchApi<BacklogStatus>("/backlog/admin/statuses", { method: "POST", body: JSON.stringify(data) }),
      deleteStatus: (id: string) =>
        fetchApi<{ ok: boolean }>(`/backlog/admin/statuses/${id}`, { method: "DELETE" }),
      upsertSource: (data: { id?: string; name: string; sortOrder?: number }) =>
        fetchApi<BacklogSource>("/backlog/admin/sources", { method: "POST", body: JSON.stringify(data) }),
      deleteSource: (id: string) =>
        fetchApi<{ ok: boolean }>(`/backlog/admin/sources/${id}`, { method: "DELETE" }),
      upsertRelease: (data: { id?: string; name: string; sortOrder?: number }) =>
        fetchApi<BacklogRelease>("/backlog/admin/releases", { method: "POST", body: JSON.stringify(data) }),
      deleteRelease: (id: string) =>
        fetchApi<{ ok: boolean }>(`/backlog/admin/releases/${id}`, { method: "DELETE" }),
      upsertInitiative: (data: { id?: string; name: string; color?: string; sortOrder?: number }) =>
        fetchApi<BacklogInitiative>("/backlog/admin/initiatives", { method: "POST", body: JSON.stringify(data) }),
      deleteInitiative: (id: string) =>
        fetchApi<{ ok: boolean }>(`/backlog/admin/initiatives/${id}`, { method: "DELETE" }),
      getConfig: (key: string) =>
        fetchApi<{ key: string; values: string[] }>(`/backlog/admin/config/${key}`),
      setConfig: (key: string, values: string[]) =>
        fetchApi<{ key: string; values: string[] }>(`/backlog/admin/config/${key}`, { method: "PUT", body: JSON.stringify({ values }) }),
    },
  },
  assignments: {
    list: (orgId: string) =>
      fetchApi<Assignment[]>(`/assignments?orgId=${encodeURIComponent(orgId)}`),
    get: (id: string) => fetchApi<Assignment>(`/assignments/${id}`),
  },
  requests: {
    list: (employeeId: string, orgId: string) =>
      fetchApi<EmployeeRequest[]>(
        `/requests?employeeId=${encodeURIComponent(employeeId)}&orgId=${encodeURIComponent(orgId)}`
      ),
    get: (id: string) => fetchApi<RequestDetail>(`/requests/${id}`),
    create: (data: CreateRequestInput) =>
      fetchApi<EmployeeRequest>("/requests", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    submit: (id: string, approvalTemplateId: string) =>
      fetchApi<EmployeeRequest>(`/requests/${id}/submit`, {
        method: "POST",
        body: JSON.stringify({ approvalTemplateId }),
      }),
    withdraw: (id: string) =>
      fetchApi<EmployeeRequest>(`/requests/${id}/withdraw`, {
        method: "POST",
      }),
  },
  approvalTemplates: {
    list: (orgId: string) =>
      fetchApi<{ id: string; name: string }[]>(
        `/approval-templates?orgId=${encodeURIComponent(orgId)}`
      ),
  },
  approvals: {
    listPending: (orgId: string) =>
      fetchApi<ApprovalInstance[]>(
        `/approvals/pending?orgId=${encodeURIComponent(orgId)}`
      ),
    approve: (id: string, note?: string) =>
      fetchApi<{ approvalInstanceId: string }>(`/approvals/${id}/approve`, {
        method: "POST",
        body: JSON.stringify({ note }),
      }),
    reject: (id: string, note?: string) =>
      fetchApi<{ approvalInstanceId: string }>(`/approvals/${id}/reject`, {
        method: "POST",
        body: JSON.stringify({ note }),
      }),
    delegate: (id: string, delegatedToUserId: string) =>
      fetchApi<{ approvalInstanceId: string }>(`/approvals/${id}/delegate`, {
        method: "POST",
        body: JSON.stringify({ delegatedToUserId }),
      }),
  },
};

// Types (match API responses)
export interface Assignment {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  scheduledAt: string;
  status: string;
  payType: string;
  payAmount: string;
  createdBy?: { id: string; name: string };
}

export interface EmployeeRequest {
  id: string;
  status: string;
  note: string | null;
  assignment?: { id: string; title: string };
  employee?: { id: string; name: string; email: string };
}

export interface ApprovalTimelineStep {
  stepOrder: number;
  label: string;
  status: string;
  approverName?: string;
  actedAt?: string;
  note?: string;
}

export interface RequestDetail {
  id: string;
  status: string;
  note: string | null;
  rejectionReason?: string | null;
  createdAt: string;
  updatedAt: string;
  employee: { id: string; name: string; email: string };
  assignment: {
    id: string;
    title: string;
    location: string | null;
    scheduledAt: string;
    payType: string;
    payAmount: string;
    status: string;
  };
  eligibility: { eligible: boolean; reason: string | null } | null;
  approvalTimeline: ApprovalTimelineStep[];
  auditEvents: {
    action: string;
    actorName: string | null;
    createdAt: string;
    entityType?: string;
  }[];
}

export interface CreateRequestInput {
  orgId: string;
  employeeId: string;
  assignmentId: string;
  requestType?: string;
  note?: string;
}

export interface ApprovalInstance {
  id: string;
  requestId: string;
  currentStepStatus: string;
  request?: {
    employee?: { name: string };
    assignment?: { title: string };
  };
}
