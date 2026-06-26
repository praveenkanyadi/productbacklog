"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  api,
  type BacklogPortfolio, type BacklogProduct, type BacklogProductArea,
  type BacklogTaxonomy, type BacklogStatus, type BacklogSource,
  type BacklogRelease, type BacklogInitiative,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingState } from "@/components/loading-state";

// ── Generic inline row editor ─────────────────────────────────────────────────

const INITIATIVE_COLOR_OPTIONS = [
  "purple", "orange", "amber", "violet", "teal", "cyan", "indigo", "blue", "red", "gray", "green",
];

const STATUS_COLOR_OPTIONS = [
  "gray", "yellow", "amber", "green", "blue", "slate", "red", "purple", "orange",
];

const STATUS_COLOR_BADGE: Record<string, string> = {
  gray: "bg-gray-100 text-gray-700", yellow: "bg-yellow-100 text-yellow-800",
  amber: "bg-amber-100 text-amber-800", green: "bg-green-100 text-green-800",
  blue: "bg-blue-100 text-blue-800", slate: "bg-slate-100 text-slate-600",
  red: "bg-red-100 text-red-800", purple: "bg-purple-100 text-purple-800",
  orange: "bg-orange-100 text-orange-800",
};

const INITIATIVE_COLOR_BADGE: Record<string, string> = {
  purple: "bg-purple-100 text-purple-800", orange: "bg-orange-100 text-orange-800",
  amber: "bg-amber-100 text-amber-800", violet: "bg-violet-100 text-violet-800",
  teal: "bg-teal-100 text-teal-800", cyan: "bg-cyan-100 text-cyan-800",
  indigo: "bg-indigo-100 text-indigo-800", blue: "bg-blue-100 text-blue-800",
  red: "bg-red-100 text-red-800", gray: "bg-gray-100 text-gray-700",
  green: "bg-green-100 text-green-800",
};

const TABS = [
  { key: "products", label: "Products & Areas" },
  { key: "statuses", label: "Statuses" },
  { key: "sources", label: "Sources" },
  { key: "initiatives", label: "Strategic Initiatives" },
  { key: "releases", label: "Target Releases" },
  { key: "discovery", label: "Discovery Status" },
  { key: "quarters", label: "Roadmap Quarters" },
];

// ── Simple list manager (for config-backed string lists) ──────────────────────

function ConfigListEditor({
  configKey, label,
}: { configKey: string; label: string }) {
  const [values, setValues] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [newValue, setNewValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [editVal, setEditVal] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const data = await api.backlog.admin.getConfig(configKey);
    setValues(data.values);
    setLoading(false);
  }, [configKey]);

  useEffect(() => { load(); }, [load]);

  async function save(next: string[]) {
    setSaving(true);
    await api.backlog.admin.setConfig(configKey, next);
    setValues(next);
    setSaving(false);
  }

  async function addValue() {
    const v = newValue.trim();
    if (!v || values.includes(v)) return;
    await save([...values, v]);
    setNewValue("");
  }

  async function removeValue(idx: number) {
    if (!confirm(`Remove "${values[idx]}"?`)) return;
    await save(values.filter((_, i) => i !== idx));
  }

  async function saveEdit(idx: number) {
    const v = editVal.trim();
    if (!v) return;
    const next = values.map((val, i) => (i === idx ? v : val));
    await save(next);
    setEditIdx(null);
  }

  async function moveUp(idx: number) {
    if (idx === 0) return;
    const next = [...values];
    [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
    await save(next);
  }

  async function moveDown(idx: number) {
    if (idx === values.length - 1) return;
    const next = [...values];
    [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
    await save(next);
  }

  if (loading) return <div className="py-8 text-center text-sm text-muted-foreground">Loading…</div>;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border overflow-hidden">
        {values.length === 0 && (
          <div className="py-8 text-center text-sm text-muted-foreground italic">No {label.toLowerCase()} yet.</div>
        )}
        {values.map((val, idx) => (
          <div key={idx} className="flex items-center gap-2 px-4 py-2.5 border-b last:border-b-0 bg-card hover:bg-muted/40">
            {editIdx === idx ? (
              <>
                <Input autoFocus className="flex-1 h-7 text-sm" value={editVal}
                  onChange={e => setEditVal(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") saveEdit(idx); if (e.key === "Escape") setEditIdx(null); }}
                />
                <Button size="sm" className="h-7 text-xs" onClick={() => saveEdit(idx)} disabled={saving}>Save</Button>
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setEditIdx(null)}>Cancel</Button>
              </>
            ) : (
              <>
                <span className="flex-1 text-sm">{val}</span>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => moveUp(idx)} disabled={idx === 0} className="w-5 h-5 rounded border bg-background text-muted-foreground hover:text-foreground disabled:opacity-30 flex items-center justify-center text-xs">↑</button>
                  <button onClick={() => moveDown(idx)} disabled={idx === values.length - 1} className="w-5 h-5 rounded border bg-background text-muted-foreground hover:text-foreground disabled:opacity-30 flex items-center justify-center text-xs">↓</button>
                  <button className="text-xs text-muted-foreground hover:text-foreground px-2 py-0.5 rounded hover:bg-muted"
                    onClick={() => { setEditIdx(idx); setEditVal(val); }}>Edit</button>
                  <button className="text-xs text-red-500 hover:text-red-700 px-2 py-0.5 rounded hover:bg-red-50"
                    onClick={() => removeValue(idx)}>Delete</button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Input placeholder={`Add ${label.toLowerCase()}…`} value={newValue}
          onChange={e => setNewValue(e.target.value)}
          onKeyDown={e => e.key === "Enter" && addValue()}
          className="flex-1"
        />
        <Button onClick={addValue} disabled={saving || !newValue.trim()}>Add</Button>
      </div>
    </div>
  );
}

// ── Taxonomy row editor (for DB-backed records) ───────────────────────────────

type TaxRow = { id: string; name: string; color?: string | null; isDefault?: boolean; sortOrder?: number };

function TaxonomyEditor<T extends TaxRow>({
  items,
  onSave,
  onDelete,
  onReload,
  withColor,
  colorOptions,
  colorBadge,
  withDefault,
  placeholder,
}: {
  items: T[];
  onSave: (data: Partial<T> & { name: string }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onReload: () => Promise<void>;
  withColor?: boolean;
  colorOptions?: string[];
  colorBadge?: Record<string, string>;
  withDefault?: boolean;
  placeholder?: string;
}) {
  const [form, setForm] = useState<Partial<TaxRow> | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const sorted = [...items].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  function openNew() {
    setForm({ name: "", color: colorOptions?.[0] ?? "", sortOrder: sorted.length });
    setError("");
  }

  function openEdit(item: T) {
    setForm({ ...item });
    setError("");
  }

  async function handleSave() {
    if (!form?.name?.trim()) { setError("Name is required."); return; }
    setSaving(true);
    setError("");
    try {
      await onSave(form as Partial<T> & { name: string });
      setForm(null);
      await onReload();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(item: T) {
    if (!confirm(`Delete "${item.name}"?`)) return;
    try {
      await onDelete(item.id);
      await onReload();
    } catch {
      alert("Delete failed — this item may be in use by backlog items.");
    }
  }

  return (
    <div className="space-y-4">
      {/* Inline form */}
      {form && (
        <div className="rounded-xl border bg-card p-4 space-y-3 shadow-sm">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            {form.id ? "Edit" : "New"}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs font-medium text-muted-foreground block mb-1">Name <span className="text-red-500">*</span></label>
              <Input autoFocus value={form.name ?? ""} placeholder={placeholder}
                onChange={e => setForm(f => ({ ...f!, name: e.target.value }))}
                onKeyDown={e => e.key === "Enter" && handleSave()}
              />
            </div>
            {withColor && colorOptions && (
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Color</label>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {colorOptions.map(c => (
                    <button key={c} type="button"
                      onClick={() => setForm(f => ({ ...f!, color: c }))}
                      className={`px-2 py-0.5 rounded-full text-xs font-semibold border-2 transition-all ${colorBadge?.[c] ?? "bg-gray-100 text-gray-700"} ${form.color === c ? "border-foreground" : "border-transparent"}`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Sort Order</label>
              <Input type="number" value={form.sortOrder ?? 0}
                onChange={e => setForm(f => ({ ...f!, sortOrder: Number(e.target.value) }))}
              />
            </div>
            {withDefault && (
              <div className="col-span-2 flex items-center gap-2">
                <input type="checkbox" id="isDefault" checked={!!form.isDefault}
                  onChange={e => setForm(f => ({ ...f!, isDefault: e.target.checked }))}
                  className="w-4 h-4"
                />
                <label htmlFor="isDefault" className="text-sm cursor-pointer">Default status for new items</label>
              </div>
            )}
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={() => setForm(null)}>Cancel</Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
          </div>
        </div>
      )}

      {/* Row list */}
      <div className="rounded-xl border overflow-hidden">
        {sorted.length === 0 && !form && (
          <div className="py-8 text-center text-sm text-muted-foreground italic">Nothing here yet.</div>
        )}
        {sorted.map(item => (
          <div key={item.id} className="flex items-center gap-3 px-4 py-2.5 border-b last:border-b-0 bg-card hover:bg-muted/40">
            {withColor && item.color && colorBadge && (
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold shrink-0 ${colorBadge[item.color] ?? "bg-gray-100 text-gray-700"}`}>
                {item.color}
              </span>
            )}
            <span className="flex-1 text-sm font-medium">{item.name}</span>
            {withDefault && item.isDefault && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full shrink-0">Default</span>
            )}
            <div className="flex gap-1 shrink-0">
              <button className="text-xs text-muted-foreground hover:text-foreground px-2 py-0.5 rounded hover:bg-muted"
                onClick={() => openEdit(item)}>Edit</button>
              <button className="text-xs text-red-500 hover:text-red-700 px-2 py-0.5 rounded hover:bg-red-50"
                onClick={() => handleDelete(item)}>Delete</button>
            </div>
          </div>
        ))}
      </div>

      {!form && (
        <Button variant="outline" size="sm" onClick={openNew}>+ Add</Button>
      )}
    </div>
  );
}

// ── Products & Areas tab (unchanged from before) ───────────────────────────────

function ProductsTab({ portfolio, onReload }: { portfolio: BacklogPortfolio[]; onReload: () => Promise<void> }) {
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);
  const [productForm, setProductForm] = useState<{ id?: string; name: string; portfolioId: string; sortOrder: number } | null>(null);
  const [areaForm, setAreaForm] = useState<{ id?: string; name: string; productId: string; sortOrder: number } | null>(null);
  const [savingProduct, setSavingProduct] = useState(false);
  const [savingArea, setSavingArea] = useState(false);
  const [productError, setProductError] = useState("");
  const [areaError, setAreaError] = useState("");

  const allProducts = portfolio.flatMap(p => p.products).sort((a, b) => ((a as BacklogProduct & { sortOrder?: number }).sortOrder ?? 0) - ((b as BacklogProduct & { sortOrder?: number }).sortOrder ?? 0));

  function openNewProduct() {
    const portfolioId = portfolio[0]?.id ?? "";
    const maxOrder = Math.max(0, ...allProducts.map(p => (p as BacklogProduct & { sortOrder?: number }).sortOrder ?? 0));
    setProductForm({ name: "", portfolioId, sortOrder: maxOrder + 1 });
    setProductError("");
  }

  async function saveProduct() {
    if (!productForm?.name.trim()) { setProductError("Name is required."); return; }
    setSavingProduct(true);
    try {
      await api.backlog.admin.upsertProduct(productForm);
      setProductForm(null);
      await onReload();
    } catch (e: unknown) { setProductError(e instanceof Error ? e.message : "Save failed."); }
    finally { setSavingProduct(false); }
  }

  async function deleteProduct(product: BacklogProduct) {
    const count = product.productAreas?.length ?? 0;
    if (!confirm(`Delete "${product.name}"${count > 0 ? ` and its ${count} area(s)` : ""}? Linked backlog items will be affected.`)) return;
    try { await api.backlog.admin.deleteProduct(product.id); await onReload(); }
    catch { alert("Delete failed — the product may have linked backlog items."); }
  }

  async function saveArea() {
    if (!areaForm?.name.trim()) { setAreaError("Name is required."); return; }
    setSavingArea(true);
    try {
      await api.backlog.admin.upsertProductArea(areaForm);
      setAreaForm(null);
      await onReload();
    } catch (e: unknown) { setAreaError(e instanceof Error ? e.message : "Save failed."); }
    finally { setSavingArea(false); }
  }

  async function deleteArea(area: BacklogProductArea) {
    if (!confirm(`Delete product area "${area.name}"?`)) return;
    try { await api.backlog.admin.deleteProductArea(area.id); await onReload(); }
    catch { alert("Delete failed — this area may have linked backlog items."); }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={openNewProduct}>+ Add Product</Button>
      </div>

      {productForm && (
        <div className="rounded-xl border bg-card p-4 space-y-3 shadow-sm">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{productForm.id ? "Edit Product" : "New Product"}</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs font-medium text-muted-foreground block mb-1">Name <span className="text-red-500">*</span></label>
              <Input autoFocus value={productForm.name} placeholder="e.g. TimeClock Plus"
                onChange={e => setProductForm(f => f ? { ...f, name: e.target.value } : f)}
                onKeyDown={e => e.key === "Enter" && saveProduct()}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Sort Order</label>
              <Input type="number" value={productForm.sortOrder}
                onChange={e => setProductForm(f => f ? { ...f, sortOrder: Number(e.target.value) } : f)}
              />
            </div>
          </div>
          {productError && <p className="text-xs text-red-600">{productError}</p>}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={() => setProductForm(null)}>Cancel</Button>
            <Button size="sm" onClick={saveProduct} disabled={savingProduct}>{savingProduct ? "Saving…" : "Save Product"}</Button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {allProducts.map(product => {
          const isExpanded = expandedProduct === product.id;
          const areas = product.productAreas ?? [];
          return (
            <div key={product.id} className="rounded-xl border bg-card overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3">
                <button onClick={() => setExpandedProduct(isExpanded ? null : product.id)}
                  className="flex items-center gap-2 flex-1 text-left hover:text-primary">
                  <span className={`text-muted-foreground text-xs transition-transform ${isExpanded ? "rotate-90" : ""}`}>▶</span>
                  <span className="font-semibold text-sm">{product.name}</span>
                  <span className="text-xs text-muted-foreground">{areas.length} area{areas.length !== 1 ? "s" : ""}</span>
                </button>
                <div className="flex gap-1 shrink-0">
                  <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setProductForm({ id: product.id, name: product.name, portfolioId: product.portfolioId, sortOrder: (product as BacklogProduct & { sortOrder?: number }).sortOrder ?? 0 })}>Edit</Button>
                  <Button variant="ghost" size="sm" className="h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => deleteProduct(product)}>Delete</Button>
                </div>
              </div>

              {isExpanded && (
                <div className="border-t bg-muted/30">
                  {areaForm?.productId === product.id && (
                    <div className="px-4 py-4 border-b bg-background space-y-3">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{areaForm.id ? "Edit Area" : "New Area"}</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2">
                          <label className="text-xs font-medium text-muted-foreground block mb-1">Area Name <span className="text-red-500">*</span></label>
                          <Input autoFocus value={areaForm.name} placeholder="e.g. Forecasting"
                            onChange={e => setAreaForm(f => f ? { ...f, name: e.target.value } : f)}
                            onKeyDown={e => e.key === "Enter" && saveArea()}
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground block mb-1">Sort Order</label>
                          <Input type="number" value={areaForm.sortOrder}
                            onChange={e => setAreaForm(f => f ? { ...f, sortOrder: Number(e.target.value) } : f)}
                          />
                        </div>
                      </div>
                      {areaError && <p className="text-xs text-red-600">{areaError}</p>}
                      <div className="flex gap-2 justify-end">
                        <Button variant="outline" size="sm" onClick={() => setAreaForm(null)}>Cancel</Button>
                        <Button size="sm" onClick={saveArea} disabled={savingArea}>{savingArea ? "Saving…" : "Save Area"}</Button>
                      </div>
                    </div>
                  )}
                  {areas.length === 0 && !areaForm && <p className="px-6 py-3 text-xs text-muted-foreground italic">No areas yet.</p>}
                  {areas.map((area, idx) => (
                    <div key={area.id} className="flex items-center gap-2 px-6 py-2 border-b last:border-b-0 hover:bg-muted/40">
                      <span className="w-5 text-xs text-muted-foreground text-right shrink-0">{idx + 1}</span>
                      <span className="flex-1 text-sm">{area.name}</span>
                      <div className="flex gap-1 shrink-0">
                        <button className="text-xs text-muted-foreground hover:text-foreground px-2 py-0.5 rounded hover:bg-muted"
                          onClick={() => { setAreaForm({ id: area.id, name: area.name, productId: area.productId, sortOrder: idx }); setAreaError(""); setExpandedProduct(product.id); }}>Edit</button>
                        <button className="text-xs text-red-500 hover:text-red-700 px-2 py-0.5 rounded hover:bg-red-50"
                          onClick={() => deleteArea(area)}>Delete</button>
                      </div>
                    </div>
                  ))}
                  {areaForm?.productId !== product.id && (
                    <div className="px-6 py-2">
                      <button className="text-xs text-primary hover:underline"
                        onClick={() => { setAreaForm({ name: "", productId: product.id, sortOrder: areas.length }); setAreaError(""); }}>
                        + Add product area
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function BacklogAdminPage() {
  const [tab, setTab] = useState("products");
  const [portfolio, setPortfolio] = useState<BacklogPortfolio[]>([]);
  const [taxonomy, setTaxonomy] = useState<BacklogTaxonomy | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [port, tax] = await Promise.all([api.backlog.portfolio(), api.backlog.taxonomy()]);
    setPortfolio(port);
    setTaxonomy(tax);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <LoadingState message="Loading admin…" />;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Backlog Administration</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage all dropdown options and taxonomy used across the backlog</p>
        </div>
        <Button variant="outline" size="sm" asChild><Link href="/backlog">← Backlog</Link></Button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 border-b pb-0">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-3 py-2 text-xs font-semibold border-b-2 -mb-px transition-colors whitespace-nowrap ${tab === t.key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {tab === "products" && <ProductsTab portfolio={portfolio} onReload={load} />}

        {tab === "statuses" && taxonomy && (
          <TaxonomyEditor<BacklogStatus>
            items={taxonomy.statuses}
            withColor colorOptions={STATUS_COLOR_OPTIONS} colorBadge={STATUS_COLOR_BADGE}
            withDefault placeholder="e.g. In Review"
            onSave={data => api.backlog.admin.upsertStatus(data as { id?: string; name: string; color?: string; isDefault?: boolean; sortOrder?: number })}
            onDelete={id => api.backlog.admin.deleteStatus(id).then(() => {})}
            onReload={load}
          />
        )}

        {tab === "sources" && taxonomy && (
          <TaxonomyEditor<BacklogSource>
            items={taxonomy.sources}
            placeholder="e.g. Customer Success"
            onSave={data => api.backlog.admin.upsertSource(data as { id?: string; name: string; sortOrder?: number })}
            onDelete={id => api.backlog.admin.deleteSource(id).then(() => {})}
            onReload={load}
          />
        )}

        {tab === "initiatives" && taxonomy && (
          <TaxonomyEditor<BacklogInitiative>
            items={taxonomy.initiatives}
            withColor colorOptions={INITIATIVE_COLOR_OPTIONS} colorBadge={INITIATIVE_COLOR_BADGE}
            placeholder="e.g. Healthcare"
            onSave={data => api.backlog.admin.upsertInitiative(data as { id?: string; name: string; color?: string; sortOrder?: number })}
            onDelete={id => api.backlog.admin.deleteInitiative(id).then(() => {})}
            onReload={load}
          />
        )}

        {tab === "releases" && taxonomy && (
          <TaxonomyEditor<BacklogRelease>
            items={taxonomy.releases}
            placeholder="e.g. Q4 2026"
            onSave={data => api.backlog.admin.upsertRelease(data as { id?: string; name: string; sortOrder?: number })}
            onDelete={id => api.backlog.admin.deleteRelease(id).then(() => {})}
            onReload={load}
          />
        )}

        {tab === "discovery" && (
          <ConfigListEditor configKey="discovery_statuses" label="Discovery Status" />
        )}

        {tab === "quarters" && (
          <ConfigListEditor configKey="roadmap_quarters" label="Roadmap Quarter" />
        )}
      </div>
    </div>
  );
}
