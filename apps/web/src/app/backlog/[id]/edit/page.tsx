"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import Link from "next/link";
import { api, type BacklogItem, type BacklogTaxonomy, type BacklogPortfolio } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingState } from "@/components/loading-state";
import { getCurrentUser } from "@/lib/auth";
import {
  CHURN_RISK_OPTIONS, EFFORT_OPTIONS, COMPLEXITY_OPTIONS,
  CONFIDENCE_OPTIONS, QUARTER_OPTIONS, DISCOVERY_OPTIONS, initiativeStyle,
} from "@/lib/backlog";

const TABS = [
  { key: "general", label: "General" },
  { key: "customer", label: "Customer Impact" },
  { key: "business", label: "Business Impact" },
  { key: "product", label: "Product Assessment" },
  { key: "eng", label: "Eng. Assessment" },
  { key: "planning", label: "Planning" },
];

export default function EditBacklogItemPage() {
  const params = useParams();
  const id = params.id as string;
  const searchParams = useSearchParams();
  const router = useRouter();
  const user = getCurrentUser();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [item, setItem] = useState<BacklogItem | null>(null);
  const [taxonomy, setTaxonomy] = useState<BacklogTaxonomy | null>(null);
  const [portfolio, setPortfolio] = useState<BacklogPortfolio[]>([]);
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") ?? "general");
  const [selectedInitiatives, setSelectedInitiatives] = useState<string[]>([]);
  const [form, setForm] = useState<Record<string, string | boolean | number | null>>({});

  useEffect(() => {
    Promise.all([api.backlog.get(id), api.backlog.taxonomy(), api.backlog.portfolio()])
      .then(([it, tax, port]) => {
        setItem(it);
        setTaxonomy(tax);
        setPortfolio(port);
        setSelectedInitiatives(it.initiatives.map(({ initiative }) => initiative.id));
        setForm({
          title: it.title ?? "",
          description: it.description ?? "",
          productId: it.productId ?? "",
          productAreaId: it.productAreaId ?? "",
          statusId: it.statusId ?? "",
          sourceId: it.sourceId ?? "",
          customersImpacted: it.customersImpacted ?? "",
          arrRepresented: it.arrRepresented ?? "",
          opportunitiesBlocked: it.opportunitiesBlocked ?? "",
          churnRisk: it.churnRisk ?? "",
          customerSegment: it.customerSegment ?? "",
          vertical: it.vertical ?? "",
          supportingEvidence: it.supportingEvidence ?? "",
          revenueOpportunity: it.revenueOpportunity ?? "",
          crossSellOpportunity: it.crossSellOpportunity ?? "",
          retentionImpact: it.retentionImpact ?? "",
          isComplianceRequirement: it.isComplianceRequirement ?? false,
          isCompetitiveGap: it.isCompetitiveGap ?? false,
          customerSatisfaction: it.customerSatisfaction ?? "",
          strategicNotes: it.strategicNotes ?? "",
          problemStatement: it.problemStatement ?? "",
          discoveryStatus: it.discoveryStatus ?? "",
          assumptions: it.assumptions ?? "",
          successMetrics: it.successMetrics ?? "",
          alternativesConsidered: it.alternativesConsidered ?? "",
          productNotes: it.productNotes ?? "",
          estimatedEffort: it.estimatedEffort ?? "",
          complexity: it.complexity ?? "",
          timelineEstimate: it.timelineEstimate ?? "",
          technicalDependencies: it.technicalDependencies ?? "",
          risks: it.risks ?? "",
          architectureNotes: it.architectureNotes ?? "",
          confidenceLevel: it.confidenceLevel ?? "",
          targetReleaseId: it.targetReleaseId ?? "",
          roadmapQuarter: it.roadmapQuarter ?? "",
        });
      })
      .finally(() => setLoading(false));
  }, [id]);

  const set = (key: string, value: string | boolean | number | null) =>
    setForm((f) => ({ ...f, [key]: value }));

  const field = (key: string) => String(form[key] ?? "");
  const bool = (key: string) => Boolean(form[key]);

  const selectedProduct = portfolio.flatMap((p) => p.products).find((p) => p.id === form.productId);

  function toggleInitiative(initId: string) {
    setSelectedInitiatives((prev) =>
      prev.includes(initId) ? prev.filter((i) => i !== initId) : [...prev, initId]
    );
  }

  async function handleSave() {
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        ...form,
        initiativeIds: selectedInitiatives,
        actorId: user.id,
        actorName: user.name,
        actorRole: user.role,
      };
      for (const f of ["customersImpacted", "arrRepresented", "opportunitiesBlocked", "revenueOpportunity"]) {
        if (payload[f] !== "" && payload[f] !== null) payload[f] = Number(payload[f]);
        else delete payload[f];
      }
      for (const k of Object.keys(payload)) {
        if (payload[k] === "") payload[k] = null;
      }

      if (activeTab === "eng") {
        await api.backlog.submitEngReview(id, payload);
      } else {
        await api.backlog.update(id, payload);
      }
      router.push(`/backlog/${id}`);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingState message="Loading…" />;
  if (!item) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold line-clamp-1">{item.title}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Editing backlog item</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild><Link href={`/backlog/${id}`}>Cancel</Link></Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save Changes"}</Button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex border-b">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 -mb-px transition-colors ${
              activeTab === tab.key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="rounded-xl border bg-card p-6 space-y-4">

        {/* General */}
        {activeTab === "general" && (
          <div className="space-y-4">
            <div>
              <Label>Title <span className="text-red-500">*</span></Label>
              <Input className="mt-1" value={field("title")} onChange={(e) => set("title", e.target.value)} />
            </div>
            <div>
              <Label>Description</Label>
              <textarea className="mt-1 w-full text-sm border rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none" rows={3} value={field("description")} onChange={(e) => set("description", e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Product</Label>
                <select className="mt-1 w-full text-sm border rounded-lg px-3 py-2 bg-background" value={field("productId")} onChange={(e) => { set("productId", e.target.value); set("productAreaId", ""); }}>
                  {portfolio.flatMap((p) => p.products).map((prod) => <option key={prod.id} value={prod.id}>{prod.name}</option>)}
                </select>
              </div>
              <div>
                <Label>Product Area</Label>
                <select className="mt-1 w-full text-sm border rounded-lg px-3 py-2 bg-background" value={field("productAreaId")} onChange={(e) => set("productAreaId", e.target.value)}>
                  <option value="">None</option>
                  {selectedProduct?.productAreas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              <div>
                <Label>Status</Label>
                <select className="mt-1 w-full text-sm border rounded-lg px-3 py-2 bg-background" value={field("statusId")} onChange={(e) => set("statusId", e.target.value)}>
                  {taxonomy?.statuses.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <Label>Source</Label>
                <select className="mt-1 w-full text-sm border rounded-lg px-3 py-2 bg-background" value={field("sourceId")} onChange={(e) => set("sourceId", e.target.value)}>
                  <option value="">None</option>
                  {taxonomy?.sources.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            </div>
            <div>
              <Label className="mb-2 block">Strategic Initiatives</Label>
              <div className="flex flex-wrap gap-2">
                {taxonomy?.initiatives.map((init) => (
                  <button key={init.id} type="button" onClick={() => toggleInitiative(init.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${selectedInitiatives.includes(init.id) ? initiativeStyle(init.name) + " border-current" : "border-border text-muted-foreground hover:border-muted-foreground"}`}>
                    {init.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Customer Impact */}
        {activeTab === "customer" && (
          <div className="grid grid-cols-2 gap-4">
            {[
              { key: "customersImpacted", label: "Customers Impacted", type: "number", placeholder: "e.g. 24" },
              { key: "arrRepresented", label: "ARR Represented ($)", type: "number", placeholder: "e.g. 1500000" },
              { key: "opportunitiesBlocked", label: "Opportunities Blocked", type: "number", placeholder: "e.g. 4" },
              { key: "customerSegment", label: "Customer Segment", type: "text", placeholder: "e.g. Enterprise" },
              { key: "vertical", label: "Vertical", type: "text", placeholder: "e.g. Healthcare" },
            ].map(({ key, label, type, placeholder }) => (
              <div key={key}>
                <Label>{label}</Label>
                <Input className="mt-1" type={type} placeholder={placeholder} value={field(key)} onChange={(e) => set(key, e.target.value)} />
              </div>
            ))}
            <div>
              <Label>Churn Risk</Label>
              <select className="mt-1 w-full text-sm border rounded-lg px-3 py-2 bg-background" value={field("churnRisk")} onChange={(e) => set("churnRisk", e.target.value)}>
                <option value="">Select…</option>
                {CHURN_RISK_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <Label>Supporting Evidence</Label>
              <textarea className="mt-1 w-full text-sm border rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none" rows={3} value={field("supportingEvidence")} onChange={(e) => set("supportingEvidence", e.target.value)} />
            </div>
          </div>
        )}

        {/* Business Impact */}
        {activeTab === "business" && (
          <div className="grid grid-cols-2 gap-4">
            {[
              { key: "revenueOpportunity", label: "Revenue Opportunity ($)", type: "number", placeholder: "e.g. 500000" },
              { key: "customerSatisfaction", label: "Customer Satisfaction Impact", type: "text", placeholder: "e.g. +15 CSAT" },
              { key: "crossSellOpportunity", label: "Cross-Sell Opportunity", type: "text" },
              { key: "retentionImpact", label: "Retention Impact", type: "text" },
            ].map(({ key, label, type, placeholder }) => (
              <div key={key}>
                <Label>{label}</Label>
                <Input className="mt-1" type={type} placeholder={placeholder} value={field(key)} onChange={(e) => set(key, e.target.value)} />
              </div>
            ))}
            <div className="col-span-2 flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={bool("isComplianceRequirement")} onChange={(e) => set("isComplianceRequirement", e.target.checked)} className="w-4 h-4" />
                <span className="text-sm font-medium">Compliance Requirement</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={bool("isCompetitiveGap")} onChange={(e) => set("isCompetitiveGap", e.target.checked)} className="w-4 h-4" />
                <span className="text-sm font-medium">Competitive Gap</span>
              </label>
            </div>
          </div>
        )}

        {/* Product Assessment */}
        {activeTab === "product" && (
          <div className="space-y-4">
            {[
              { key: "problemStatement", label: "Problem Statement" },
              { key: "successMetrics", label: "Success Metrics" },
              { key: "assumptions", label: "Assumptions" },
              { key: "alternativesConsidered", label: "Alternatives Considered" },
              { key: "productNotes", label: "Product Notes" },
            ].map(({ key, label }) => (
              <div key={key}>
                <Label>{label}</Label>
                <textarea className="mt-1 w-full text-sm border rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none" rows={3} value={field(key)} onChange={(e) => set(key, e.target.value)} />
              </div>
            ))}
            <div>
              <Label>Discovery Status</Label>
              <select className="mt-1 w-full text-sm border rounded-lg px-3 py-2 bg-background" value={field("discoveryStatus")} onChange={(e) => set("discoveryStatus", e.target.value)}>
                <option value="">Select…</option>
                {DISCOVERY_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          </div>
        )}

        {/* Engineering Assessment */}
        {activeTab === "eng" && (
          <div className="space-y-4">
            <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
              Saving from this tab records an engineering review event and updates your name as the reviewer.
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Estimated Effort</Label>
                <select className="mt-1 w-full text-sm border rounded-lg px-3 py-2 bg-background" value={field("estimatedEffort")} onChange={(e) => set("estimatedEffort", e.target.value)}>
                  <option value="">Select…</option>
                  {EFFORT_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <Label>Complexity</Label>
                <select className="mt-1 w-full text-sm border rounded-lg px-3 py-2 bg-background" value={field("complexity")} onChange={(e) => set("complexity", e.target.value)}>
                  <option value="">Select…</option>
                  {COMPLEXITY_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <Label>Confidence Level</Label>
                <select className="mt-1 w-full text-sm border rounded-lg px-3 py-2 bg-background" value={field("confidenceLevel")} onChange={(e) => set("confidenceLevel", e.target.value)}>
                  <option value="">Select…</option>
                  {CONFIDENCE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <Label>Timeline Estimate</Label>
                <Input className="mt-1" placeholder="e.g. 8–13 weeks" value={field("timelineEstimate")} onChange={(e) => set("timelineEstimate", e.target.value)} />
              </div>
              <div className="col-span-2">
                <Label>Technical Dependencies</Label>
                <Input className="mt-1" value={field("technicalDependencies")} onChange={(e) => set("technicalDependencies", e.target.value)} />
              </div>
              <div className="col-span-2">
                <Label>Risks</Label>
                <textarea className="mt-1 w-full text-sm border rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none" rows={2} value={field("risks")} onChange={(e) => set("risks", e.target.value)} />
              </div>
              <div className="col-span-2">
                <Label>Architecture Notes</Label>
                <textarea className="mt-1 w-full text-sm border rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none" rows={3} value={field("architectureNotes")} onChange={(e) => set("architectureNotes", e.target.value)} />
              </div>
            </div>
          </div>
        )}

        {/* Planning */}
        {activeTab === "planning" && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Target Release</Label>
              <select className="mt-1 w-full text-sm border rounded-lg px-3 py-2 bg-background" value={field("targetReleaseId")} onChange={(e) => set("targetReleaseId", e.target.value)}>
                <option value="">None</option>
                {taxonomy?.releases.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
            <div>
              <Label>Roadmap Quarter</Label>
              <select className="mt-1 w-full text-sm border rounded-lg px-3 py-2 bg-background" value={field("roadmapQuarter")} onChange={(e) => set("roadmapQuarter", e.target.value)}>
                <option value="">None</option>
                {QUARTER_OPTIONS.map((q) => <option key={q} value={q}>{q}</option>)}
              </select>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" asChild><Link href={`/backlog/${id}`}>Cancel</Link></Button>
        <Button onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save Changes"}</Button>
      </div>
    </div>
  );
}
