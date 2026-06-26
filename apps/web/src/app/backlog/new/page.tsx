"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, type BacklogTaxonomy, type BacklogPortfolio } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { getCurrentUser } from "@/lib/auth";
import {
  CHURN_RISK_OPTIONS, EFFORT_OPTIONS, COMPLEXITY_OPTIONS,
  CONFIDENCE_OPTIONS, QUARTER_OPTIONS, DISCOVERY_OPTIONS, initiativeStyle,
} from "@/lib/backlog";

const STEPS = [
  "General",
  "Customer Impact",
  "Business Impact",
  "Product Assessment",
  "Eng. Assessment",
  "Planning",
];

export default function NewBacklogItemPage() {
  const router = useRouter();
  const user = getCurrentUser();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [taxonomy, setTaxonomy] = useState<BacklogTaxonomy | null>(null);
  const [portfolio, setPortfolio] = useState<BacklogPortfolio[]>([]);
  const [selectedInitiatives, setSelectedInitiatives] = useState<string[]>([]);

  // Form state
  const [form, setForm] = useState<Record<string, string | boolean | number | null>>({
    title: "", description: "",
    productId: "", productAreaId: "", statusId: "", sourceId: "", ownerId: "",
    customersImpacted: "", arrRepresented: "", opportunitiesBlocked: "",
    churnRisk: "", customerSegment: "", vertical: "", supportingEvidence: "",
    revenueOpportunity: "", crossSellOpportunity: "", retentionImpact: "",
    isComplianceRequirement: false, isCompetitiveGap: false,
    customerSatisfaction: "", strategicNotes: "",
    problemStatement: "", discoveryStatus: "", assumptions: "",
    successMetrics: "", alternativesConsidered: "", productNotes: "",
    estimatedEffort: "", complexity: "", timelineEstimate: "",
    technicalDependencies: "", risks: "", architectureNotes: "", confidenceLevel: "",
    targetReleaseId: "", roadmapQuarter: "",
  });

  useEffect(() => {
    Promise.all([api.backlog.taxonomy(), api.backlog.portfolio()])
      .then(([tax, port]) => {
        setTaxonomy(tax);
        setPortfolio(port);
        const defaultStatus = tax.statuses.find((s) => s.name === "Idea");
        if (defaultStatus) setForm((f) => ({ ...f, statusId: defaultStatus.id }));
      });
  }, []);

  const set = (key: string, value: string | boolean | number | null) =>
    setForm((f) => ({ ...f, [key]: value }));

  const selectedProduct = portfolio.flatMap((p) => p.products).find((p) => p.id === form.productId);

  function toggleInitiative(id: string) {
    setSelectedInitiatives((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }

  async function handleSubmit() {
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        ...form,
        initiativeIds: selectedInitiatives,
        actorId: user.id,
        actorName: user.name,
        actorRole: user.role,
      };
      // Convert numeric strings
      for (const f of ["customersImpacted", "arrRepresented", "opportunitiesBlocked", "revenueOpportunity"]) {
        if (payload[f] !== "" && payload[f] !== null) payload[f] = Number(payload[f]);
        else delete payload[f];
      }
      // Remove empty strings
      for (const k of Object.keys(payload)) {
        if (payload[k] === "") delete payload[k];
      }
      const item = await api.backlog.create(payload);
      router.push(`/backlog/${item.id}`);
    } finally {
      setSaving(false);
    }
  }

  const field = (key: string) => String(form[key] ?? "");
  const bool = (key: string) => Boolean(form[key]);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">New Backlog Item</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Step {step + 1} of {STEPS.length} — {STEPS[step]}</p>
        </div>
        <Button variant="outline" asChild><Link href="/backlog">Cancel</Link></Button>
      </div>

      {/* Step nav */}
      <div className="rounded-xl border bg-card overflow-hidden flex">
        {STEPS.map((label, i) => (
          <button
            key={i}
            onClick={() => i < step && setStep(i)}
            className={`flex-1 flex items-center gap-2 px-3 py-3 border-r last:border-r-0 text-xs font-semibold transition-colors ${
              i === step ? "bg-blue-50 text-blue-700" :
              i < step ? "bg-green-50 text-green-700 cursor-pointer" : "text-muted-foreground"
            }`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
              i === step ? "bg-blue-600 text-white" :
              i < step ? "bg-green-500 text-white" : "bg-muted text-muted-foreground"
            }`}>
              {i < step ? "✓" : i + 1}
            </span>
            <span className="hidden sm:block">{label}</span>
          </button>
        ))}
      </div>

      {/* Step content */}
      <div className="rounded-xl border bg-card p-6 space-y-4">

        {/* Step 0: General */}
        {step === 0 && (
          <>
            <h2 className="font-bold text-base mb-4">General Information</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title <span className="text-red-500">*</span></Label>
                <Input id="title" className="mt-1" placeholder="Short, clear title for this opportunity…" value={field("title")} onChange={(e) => set("title", e.target.value)} />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <textarea id="description" className="mt-1 w-full text-sm border rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none" rows={3} placeholder="What problem does this solve? Who benefits?" value={field("description")} onChange={(e) => set("description", e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Product <span className="text-red-500">*</span></Label>
                  <select className="mt-1 w-full text-sm border rounded-lg px-3 py-2 bg-background" value={field("productId")} onChange={(e) => { set("productId", e.target.value); set("productAreaId", ""); }}>
                    <option value="">Select product…</option>
                    {portfolio.flatMap((p) => p.products).map((prod) => (
                      <option key={prod.id} value={prod.id}>{prod.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Product Area</Label>
                  <select className="mt-1 w-full text-sm border rounded-lg px-3 py-2 bg-background" value={field("productAreaId")} onChange={(e) => set("productAreaId", e.target.value)} disabled={!selectedProduct}>
                    <option value="">Select area…</option>
                    {selectedProduct?.productAreas.map((a) => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
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
                    <option value="">Select source…</option>
                    {taxonomy?.sources.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <Label className="mb-2 block">Strategic Initiatives</Label>
                <div className="flex flex-wrap gap-2">
                  {taxonomy?.initiatives.map((init) => (
                    <button
                      key={init.id}
                      type="button"
                      onClick={() => toggleInitiative(init.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                        selectedInitiatives.includes(init.id)
                          ? initiativeStyle(init.name) + " border-current"
                          : "border-border text-muted-foreground hover:border-muted-foreground"
                      }`}
                    >
                      {init.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Step 1: Customer Impact */}
        {step === 1 && (
          <>
            <h2 className="font-bold text-base mb-4">Customer Impact</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Customers Impacted</Label>
                <Input className="mt-1" type="number" placeholder="e.g. 24" value={field("customersImpacted")} onChange={(e) => set("customersImpacted", e.target.value)} />
              </div>
              <div>
                <Label>ARR Represented ($)</Label>
                <Input className="mt-1" type="number" placeholder="e.g. 1500000" value={field("arrRepresented")} onChange={(e) => set("arrRepresented", e.target.value)} />
              </div>
              <div>
                <Label>Opportunities Blocked</Label>
                <Input className="mt-1" type="number" placeholder="e.g. 4" value={field("opportunitiesBlocked")} onChange={(e) => set("opportunitiesBlocked", e.target.value)} />
              </div>
              <div>
                <Label>Churn Risk</Label>
                <select className="mt-1 w-full text-sm border rounded-lg px-3 py-2 bg-background" value={field("churnRisk")} onChange={(e) => set("churnRisk", e.target.value)}>
                  <option value="">Select…</option>
                  {CHURN_RISK_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <Label>Customer Segment</Label>
                <Input className="mt-1" placeholder="e.g. Enterprise, Mid-Market" value={field("customerSegment")} onChange={(e) => set("customerSegment", e.target.value)} />
              </div>
              <div>
                <Label>Vertical</Label>
                <Input className="mt-1" placeholder="e.g. Healthcare, Hospitality" value={field("vertical")} onChange={(e) => set("vertical", e.target.value)} />
              </div>
              <div className="col-span-2">
                <Label>Supporting Evidence</Label>
                <textarea className="mt-1 w-full text-sm border rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none" rows={3} placeholder="Links, Salesforce cases, support tickets…" value={field("supportingEvidence")} onChange={(e) => set("supportingEvidence", e.target.value)} />
              </div>
            </div>
          </>
        )}

        {/* Step 2: Business Impact */}
        {step === 2 && (
          <>
            <h2 className="font-bold text-base mb-4">Business Impact</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Revenue Opportunity ($)</Label>
                <Input className="mt-1" type="number" placeholder="e.g. 500000" value={field("revenueOpportunity")} onChange={(e) => set("revenueOpportunity", e.target.value)} />
              </div>
              <div>
                <Label>Customer Satisfaction Impact</Label>
                <Input className="mt-1" placeholder="e.g. +15 CSAT points" value={field("customerSatisfaction")} onChange={(e) => set("customerSatisfaction", e.target.value)} />
              </div>
              <div>
                <Label>Cross-Sell Opportunity</Label>
                <Input className="mt-1" placeholder="e.g. Upsell to analytics tier" value={field("crossSellOpportunity")} onChange={(e) => set("crossSellOpportunity", e.target.value)} />
              </div>
              <div>
                <Label>Retention Impact</Label>
                <Input className="mt-1" placeholder="e.g. Reduce churn by 10%" value={field("retentionImpact")} onChange={(e) => set("retentionImpact", e.target.value)} />
              </div>
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
              <div className="col-span-2">
                <Label>Strategic Notes</Label>
                <textarea className="mt-1 w-full text-sm border rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none" rows={3} value={field("strategicNotes")} onChange={(e) => set("strategicNotes", e.target.value)} />
              </div>
            </div>
          </>
        )}

        {/* Step 3: Product Assessment */}
        {step === 3 && (
          <>
            <h2 className="font-bold text-base mb-4">Product Assessment</h2>
            <div className="space-y-4">
              {[
                { key: "problemStatement", label: "Problem Statement", placeholder: "What is the core problem? Who experiences it? What is the impact?" },
                { key: "successMetrics", label: "Success Metrics", placeholder: "How will we know this is working? What are the measurable outcomes?" },
                { key: "assumptions", label: "Assumptions", placeholder: "What assumptions are we making that need validation?" },
                { key: "alternativesConsidered", label: "Alternatives Considered", placeholder: "What other approaches were evaluated?" },
                { key: "productNotes", label: "Product Notes", placeholder: "Additional notes for the product team…" },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <Label>{label}</Label>
                  <textarea className="mt-1 w-full text-sm border rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none" rows={3} placeholder={placeholder} value={field(key)} onChange={(e) => set(key, e.target.value)} />
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
          </>
        )}

        {/* Step 4: Engineering Assessment */}
        {step === 4 && (
          <>
            <h2 className="font-bold text-base mb-4">Engineering Assessment</h2>
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
                <Input className="mt-1" placeholder="e.g. ML platform, Data pipeline, vendor API" value={field("technicalDependencies")} onChange={(e) => set("technicalDependencies", e.target.value)} />
              </div>
              <div className="col-span-2">
                <Label>Risks</Label>
                <textarea className="mt-1 w-full text-sm border rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none" rows={2} placeholder="Key technical risks…" value={field("risks")} onChange={(e) => set("risks", e.target.value)} />
              </div>
              <div className="col-span-2">
                <Label>Architecture Notes</Label>
                <textarea className="mt-1 w-full text-sm border rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none" rows={3} placeholder="Architecture considerations, constraints, approach…" value={field("architectureNotes")} onChange={(e) => set("architectureNotes", e.target.value)} />
              </div>
            </div>
          </>
        )}

        {/* Step 5: Planning */}
        {step === 5 && (
          <>
            <h2 className="font-bold text-base mb-4">Planning</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Target Release</Label>
                <select className="mt-1 w-full text-sm border rounded-lg px-3 py-2 bg-background" value={field("targetReleaseId")} onChange={(e) => set("targetReleaseId", e.target.value)}>
                  <option value="">Select…</option>
                  {taxonomy?.releases.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
              <div>
                <Label>Roadmap Quarter</Label>
                <select className="mt-1 w-full text-sm border rounded-lg px-3 py-2 bg-background" value={field("roadmapQuarter")} onChange={(e) => set("roadmapQuarter", e.target.value)}>
                  <option value="">Select…</option>
                  {QUARTER_OPTIONS.map((q) => <option key={q} value={q}>{q}</option>)}
                </select>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="rounded-xl border bg-card px-5 py-4 flex items-center justify-between">
        <p className="text-xs text-muted-foreground">Step {step + 1} of {STEPS.length}</p>
        <div className="flex gap-2">
          {step > 0 && (
            <Button variant="outline" onClick={() => setStep(step - 1)}>← Back</Button>
          )}
          {step < STEPS.length - 1 ? (
            <Button onClick={() => setStep(step + 1)} disabled={step === 0 && (!form.title || !form.productId || !form.statusId)}>
              Next: {STEPS[step + 1]} →
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={saving || !form.title || !form.productId}>
              {saving ? "Saving…" : "Create Item"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
