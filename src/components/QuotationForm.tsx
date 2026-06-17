"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  rankPlans,
  type EstimateParams,
  type PaperLike,
  type PlanResult,
  type PressLike,
} from "@/lib/estimate";
import { DEFAULT_RATES, type CostRates } from "@/lib/cost";
import type { LayoutCategory } from "@/lib/imposition";
import { baht, num } from "@/lib/format";
import SheetView from "./SheetView";

export interface PaperOption extends PaperLike {}
export interface CustomerOption {
  id: number;
  name: string;
}
export interface PressOption extends PressLike {}

const CATEGORIES: { value: LayoutCategory; label: string; hint: string }[] = [
  { value: "twoSide", label: "งาน 2 หน้า", hint: "ใบปลิว/แผ่นพับ/สติกเกอร์/กล่อง" },
  { value: "book", label: "งานหนังสือ", hint: "หนังสือ/แคตตาล็อก (ระบุจำนวนหน้า)" },
  { value: "set", label: "งานเป็นชุด", hint: "ใบเสร็จ/สมุด (ใช้เพลทกรอบเดียว)" },
];

interface Item {
  id: string;
  description: string;
  pieceW: number;
  pieceH: number;
  bleed: number;
  layoutCategory: LayoutCategory;
  pageCount: number;
  setsPerBook: number;
  paperIds: number[]; // กระดาษที่นำมาเทียบ (ชนิด/ขนาดต่าง ๆ)
  pressId: number | "auto";
  colorsFront: number;
  colorsBack: number;
  gap: number;
  edge: number;
  spoilagePct: number;
  makeReady: number;
  priceMode: "margin" | "unit";
  unitPrice: number;
  expanded: boolean;
}

interface ItemComputed {
  perQty: { qty: number; best: PlanResult | null }[];
  ranked: PlanResult[]; // จัดอันดับสำหรับยอดที่กำลังแสดง
  best: PlanResult | null; // ดีที่สุดของยอดที่กำลังแสดง
}

function newItem(paperId: number | null): Item {
  return {
    id: crypto.randomUUID(),
    description: "",
    pieceW: 9,
    pieceH: 5.4,
    bleed: 0.3,
    layoutCategory: "twoSide",
    pageCount: 8,
    setsPerBook: 50,
    paperIds: paperId != null ? [paperId] : [],
    pressId: "auto",
    colorsFront: 4,
    colorsBack: 0,
    gap: 0,
    edge: 0.5,
    spoilagePct: 3,
    makeReady: 50,
    priceMode: "margin",
    unitPrice: 0,
    expanded: true,
  };
}

export default function QuotationForm({
  papers,
  customers,
  presses,
  canViewCost = true,
}: {
  papers: PaperOption[];
  customers: CustomerOption[];
  presses: PressOption[];
  canViewCost?: boolean;
}) {
  const router = useRouter();
  const defaultPaper = papers[0]?.id ?? null;

  // ส่วนหัวงานประเมิน
  const [customerId, setCustomerId] = useState<number | "new">(customers[0]?.id ?? "new");
  const [newCustomerName, setNewCustomerName] = useState("");
  const [title, setTitle] = useState("");
  const [jobType, setJobType] = useState("");
  const [specDetail, setSpecDetail] = useState("");
  const [salesperson, setSalesperson] = useState("");
  const [validDays, setValidDays] = useState(30);
  const [vatPercent, setVatPercent] = useState(7);
  const [discount, setDiscount] = useState(0);
  const [note, setNote] = useState("");

  // ยอดพิมพ์เปรียบเทียบ (สูงสุด 4)
  const [quantities, setQuantities] = useState<number[]>([1000]);
  const [primaryQty, setPrimaryQty] = useState(1000);

  const [rates, setRates] = useState<CostRates>({ ...DEFAULT_RATES });
  const [showRates, setShowRates] = useState(false);
  const [items, setItems] = useState<Item[]>([newItem(defaultPaper)]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function updateItem(id: string, patch: Partial<Item>) {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  }
  function addItem() {
    setItems((prev) => [...prev, newItem(defaultPaper)]);
  }
  function removeItem(id: string) {
    setItems((prev) => prev.filter((it) => it.id !== id));
  }
  function toggleItemPaper(id: string, paperId: number) {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        const has = it.paperIds.includes(paperId);
        const paperIds = has ? it.paperIds.filter((p) => p !== paperId) : [...it.paperIds, paperId];
        return { ...it, paperIds: paperIds.length ? paperIds : it.paperIds };
      })
    );
  }

  function setQty(idx: number, value: number) {
    setQuantities((prev) => prev.map((q, i) => (i === idx ? value : q)));
  }
  function addQty() {
    setQuantities((prev) => (prev.length >= 4 ? prev : [...prev, prev[prev.length - 1] * 2]));
  }
  function removeQty(idx: number) {
    setQuantities((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== idx)));
  }

  // ยอดที่ใช้แสดง/บันทึก ต้องอยู่ในรายการ quantities
  const shownQty = quantities.includes(primaryQty) ? primaryQty : quantities[0];

  const paramsFor = (it: Item): EstimateParams => ({
    category: it.layoutCategory,
    pieceW: it.pieceW,
    pieceH: it.pieceH,
    bleed: it.bleed,
    gap: it.gap,
    edge: it.edge,
    colorsFront: it.colorsFront,
    colorsBack: it.colorsBack,
    pageCount: it.pageCount,
    setsPerBook: it.setsPerBook,
    spoilagePct: it.spoilagePct,
    makeReady: it.makeReady,
    rates,
    priceMode: it.priceMode,
    unitPrice: it.priceMode === "unit" ? it.unitPrice : undefined,
  });

  const computed = useMemo<ItemComputed[]>(() => {
    return items.map((it) => {
      const selPapers = papers.filter((p) => it.paperIds.includes(p.id));
      const candidatePapers = selPapers.length ? selPapers : papers.slice(0, 1);
      const candidatePresses = it.pressId === "auto" ? presses : presses.filter((p) => p.id === it.pressId);

      const params = paramsFor(it);
      const perQty = quantities.map((qty) => ({
        qty,
        best: rankPlans(candidatePapers, candidatePresses, qty, params)[0] ?? null,
      }));
      const ranked = rankPlans(candidatePapers, candidatePresses, shownQty, params);
      return { perQty, ranked, best: ranked[0] ?? null };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, papers, presses, rates, quantities, shownQty]);

  function subtotalForQty(qty: number): number {
    return computed.reduce((s, c) => {
      const r = c.perQty.find((p) => p.qty === qty);
      return s + (r?.best?.cost.total ?? 0);
    }, 0);
  }

  const subtotal = subtotalForQty(shownQty);
  const afterDiscount = Math.max(0, subtotal - discount);
  const vatAmount = afterDiscount * (vatPercent / 100);
  const grandTotal = afterDiscount + vatAmount;

  async function handleSave(asPattern = false) {
    setError("");
    if (customerId === "new" && !newCustomerName.trim()) {
      setError("กรุณาระบุชื่อลูกค้า");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        customerId: customerId === "new" ? null : customerId,
        newCustomerName: customerId === "new" ? newCustomerName.trim() : null,
        validDays,
        vatPercent,
        discount,
        note,
        title: title || null,
        jobType: jobType || null,
        specDetail: specDetail || null,
        salesperson: salesperson || null,
        isPattern: asPattern,
        quantities,
        primaryQty: shownQty,
        items: items.map((it, idx) => {
          const c = computed[idx];
          const best = c.best;
          return {
            description: it.description || title || "งานพิมพ์",
            pieceW: it.pieceW,
            pieceH: it.pieceH,
            bleed: it.bleed,
            quantity: shownQty,
            layoutCategory: it.layoutCategory,
            pageCount: it.layoutCategory === "book" ? it.pageCount : null,
            setsPerBook: it.layoutCategory === "set" ? it.setsPerBook : null,
            priceMode: it.priceMode,
            paperId: best?.paper.id ?? it.paperIds[0] ?? defaultPaper,
            colorsFront: it.colorsFront,
            colorsBack: it.colorsBack,
            pressId: best?.press.id ?? null,
            pressName: best?.press.name ?? null,
            cutsPerParent: best?.layout.plan.cutsPerParent ?? 1,
            pressSheets: best?.layout.pressSheets ?? 0,
            upsPerSheet: best?.layout.plan.upsPerPressSheet ?? 0,
            sheetsNeeded: best?.layout.parentSheets ?? 0,
            efficiency: best?.layout.plan.imp.efficiency ?? 0,
            unitPrice: best?.cost.unitPrice ?? 0,
            amount: best?.cost.total ?? 0,
            meta: JSON.stringify({
              method: best?.layout.plan.imp.method,
              cell: best
                ? { w: best.layout.plan.cellW, h: best.layout.plan.cellH, nx: best.layout.plan.nx, ny: best.layout.plan.ny }
                : null,
              signatures: best?.layout.signatures,
              plateCount: best?.layout.plateCount,
              netPress: best?.layout.netPress,
              spoilage: best?.layout.spoilage,
              cost: best?.cost,
              perQty: c.perQty.map((p) => ({
                qty: p.qty,
                total: p.best?.cost.total ?? null,
                unitPrice: p.best?.cost.unitPrice ?? null,
                paper: p.best?.paper.name ?? null,
                press: p.best?.press.name ?? null,
                parentSheets: p.best?.layout.parentSheets ?? null,
              })),
            }),
          };
        }),
      };
      const res = await fetch("/api/quotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error((await res.json()).error || "บันทึกไม่สำเร็จ");
      const data = await res.json();
      router.push(`/quotations/${data.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
      setSaving(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        <section className="card p-5">
          <h2 className="mb-4 text-sm font-semibold text-slate-700">ข้อมูลงานประเมินราคา</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label">ลูกค้า</label>
              <select
                className="input"
                value={String(customerId)}
                onChange={(e) => setCustomerId(e.target.value === "new" ? "new" : Number(e.target.value))}
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
                <option value="new">+ เพิ่มลูกค้าใหม่…</option>
              </select>
              {customerId === "new" && (
                <input className="input mt-2" placeholder="ชื่อลูกค้าใหม่" value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)} />
              )}
            </div>
            <div>
              <label className="label">ชื่องาน</label>
              <input className="input" placeholder="เช่น กล่องสบู่สมุนไพร" value={title}
                onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div>
              <label className="label">ลักษณะงานพิมพ์</label>
              <input className="input" placeholder="เช่น กล่องบรรจุภัณฑ์ / หนังสือ" value={jobType}
                onChange={(e) => setJobType(e.target.value)} list="jobtype-list" />
              <datalist id="jobtype-list">
                <option value="กล่องบรรจุภัณฑ์" />
                <option value="ใบปลิว" />
                <option value="แผ่นพับ" />
                <option value="หนังสือ" />
                <option value="แคตตาล็อก" />
                <option value="สติกเกอร์" />
                <option value="ใบเสร็จ/บิล" />
              </datalist>
            </div>
            <div>
              <label className="label">พนักงานขาย</label>
              <input className="input" placeholder="ผู้รับผิดชอบ" value={salesperson}
                onChange={(e) => setSalesperson(e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <label className="label">รายละเอียด Spec ที่ลูกค้ากำหนด</label>
              <input className="input" placeholder="เช่น พิมพ์ 4 สี เคลือบด้าน ปั๊มนูน" value={specDetail}
                onChange={(e) => setSpecDetail(e.target.value)} />
            </div>
            <div>
              <label className="label">ยืนราคา (วัน)</label>
              <input type="number" className="input" value={validDays}
                onChange={(e) => setValidDays(Number(e.target.value))} />
            </div>
            <div>
              <label className="label">หมายเหตุ</label>
              <input className="input" placeholder="เงื่อนไขการชำระเงิน ฯลฯ" value={note}
                onChange={(e) => setNote(e.target.value)} />
            </div>
          </div>

          {/* ยอดพิมพ์เปรียบเทียบ */}
          <div className="mt-4 rounded-lg border border-line bg-slate-50 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">ยอดพิมพ์เปรียบเทียบ (สูงสุด 4 ยอด)</span>
              {quantities.length < 4 && (
                <button onClick={addQty} className="text-xs text-brand-600 hover:underline">＋ เพิ่มยอด</button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {quantities.map((q, i) => (
                <div key={i} className="flex items-center gap-1">
                  <input
                    type="number"
                    className={`w-28 rounded-md border px-2 py-1 text-right text-sm ${q === shownQty ? "border-brand-500 ring-2 ring-brand-100" : "border-line"}`}
                    value={q}
                    onChange={(e) => setQty(i, Number(e.target.value))}
                    onFocus={() => setPrimaryQty(q)}
                  />
                  {quantities.length > 1 && (
                    <button onClick={() => removeQty(i)} className="text-xs text-red-400 hover:text-red-600">✕</button>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span>ยอดที่ใช้ออกใบเสนอราคา:</span>
              {quantities.map((q, i) => (
                <button
                  key={i}
                  onClick={() => setPrimaryQty(q)}
                  className={`badge ${q === shownQty ? "bg-brand-600 text-white" : "bg-white text-slate-600 ring-1 ring-inset ring-line"}`}
                >
                  {num(q)}
                </button>
              ))}
            </div>
          </div>
        </section>

        {items.map((it, idx) => {
          const c = computed[idx];
          const best = c?.best ?? null;
          return (
            <section key={it.id} className="card overflow-hidden">
              <div className="flex items-center justify-between gap-3 border-b border-line bg-slate-50 px-5 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
                    {idx + 1}
                  </span>
                  <input
                    className="w-56 bg-transparent text-sm font-medium outline-none placeholder:text-slate-400"
                    placeholder="ชื่อรายการ เช่น กล่อง / ใบแทรก"
                    value={it.description}
                    onChange={(e) => updateItem(it.id, { description: e.target.value })}
                  />
                </div>
                <div className="flex items-center gap-3">
                  {best ? (
                    <span className="badge bg-brand-50 text-brand-700">
                      {best.press.name} · {num(best.layout.plan.upsPerPressSheet)}/แผ่นพิมพ์
                    </span>
                  ) : (
                    <span className="badge bg-red-50 text-red-600">วางไม่ลง</span>
                  )}
                  <button className="text-xs text-slate-400 hover:text-slate-600"
                    onClick={() => updateItem(it.id, { expanded: !it.expanded })}>
                    {it.expanded ? "ย่อ" : "ขยาย"}
                  </button>
                  {items.length > 1 && (
                    <button className="text-xs text-red-400 hover:text-red-600" onClick={() => removeItem(it.id)}>ลบ</button>
                  )}
                </div>
              </div>

              {it.expanded && (
                <div className="grid grid-cols-1 gap-5 p-5 lg:grid-cols-[1fr_300px]">
                  <div className="space-y-4">
                    {/* ประเภทงาน */}
                    <div>
                      <label className="label">ประเภทงาน (วิธีวางเลย์เอ้าท์)</label>
                      <div className="flex flex-wrap gap-2">
                        {CATEGORIES.map((cat) => (
                          <button
                            key={cat.value}
                            onClick={() => updateItem(it.id, { layoutCategory: cat.value })}
                            className={`rounded-lg border px-3 py-1.5 text-xs ${
                              it.layoutCategory === cat.value
                                ? "border-brand-500 bg-brand-50 text-brand-700"
                                : "border-line bg-white text-slate-600 hover:bg-slate-50"
                            }`}
                            title={cat.hint}
                          >
                            {cat.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <div>
                        <label className="label">กว้างงาน (ซม.)</label>
                        <input type="number" step="0.1" className="input" value={it.pieceW}
                          onChange={(e) => updateItem(it.id, { pieceW: Number(e.target.value) })} />
                      </div>
                      <div>
                        <label className="label">ยาวงาน (ซม.)</label>
                        <input type="number" step="0.1" className="input" value={it.pieceH}
                          onChange={(e) => updateItem(it.id, { pieceH: Number(e.target.value) })} />
                      </div>
                      <div>
                        <label className="label">ตัดตก (ซม.)</label>
                        <input type="number" step="0.1" className="input" value={it.bleed}
                          onChange={(e) => updateItem(it.id, { bleed: Number(e.target.value) })} />
                      </div>
                      {it.layoutCategory === "book" && (
                        <div>
                          <label className="label">จำนวนหน้า</label>
                          <input type="number" className="input" value={it.pageCount}
                            onChange={(e) => updateItem(it.id, { pageCount: Number(e.target.value) })} />
                        </div>
                      )}
                      {it.layoutCategory === "set" && (
                        <div>
                          <label className="label">ชุด/เล่ม</label>
                          <input type="number" className="input" value={it.setsPerBook}
                            onChange={(e) => updateItem(it.id, { setsPerBook: Number(e.target.value) })} />
                        </div>
                      )}
                    </div>

                    {/* เลือกกระดาษหลายขนาดเพื่อเทียบ */}
                    <div>
                      <label className="label">กระดาษที่นำมาเทียบ (เลือกได้หลายขนาด)</label>
                      <div className="flex flex-wrap gap-2">
                        {papers.map((p) => {
                          const on = it.paperIds.includes(p.id);
                          return (
                            <button
                              key={p.id}
                              onClick={() => toggleItemPaper(it.id, p.id)}
                              className={`rounded-lg border px-2.5 py-1 text-xs ${
                                on ? "border-brand-500 bg-brand-50 text-brand-700" : "border-line bg-white text-slate-500 hover:bg-slate-50"
                              }`}
                            >
                              {on ? "✓ " : ""}{p.name} · {num(p.sheetW)}×{num(p.sheetH)}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <div>
                        <label className="label">เครื่องพิมพ์</label>
                        <select className="input" value={String(it.pressId)}
                          onChange={(e) => updateItem(it.id, { pressId: e.target.value === "auto" ? "auto" : Number(e.target.value) })}>
                          <option value="auto">อัตโนมัติ (คุ้มสุด)</option>
                          {presses.map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}
                        </select>
                      </div>
                      <div>
                        <label className="label">สีหน้า</label>
                        <input type="number" min={0} max={8} className="input" value={it.colorsFront}
                          onChange={(e) => updateItem(it.id, { colorsFront: Number(e.target.value) })} />
                      </div>
                      <div>
                        <label className="label">สีหลัง</label>
                        <input type="number" min={0} max={8} className="input" value={it.colorsBack}
                          onChange={(e) => updateItem(it.id, { colorsBack: Number(e.target.value) })} />
                      </div>
                      {canViewCost && (
                        <div>
                          <label className="label">โหมดราคา</label>
                          <select className="input" value={it.priceMode}
                            onChange={(e) => updateItem(it.id, { priceMode: e.target.value as "margin" | "unit" })}>
                            <option value="margin">บวกกำไร %</option>
                            <option value="unit">ระบุราคา/หน่วย</option>
                          </select>
                        </div>
                      )}
                    </div>

                    {canViewCost && it.priceMode === "unit" && (
                      <div className="w-40">
                        <label className="label">ราคาขาย/หน่วย (บาท)</label>
                        <input type="number" step="0.01" className="input" value={it.unitPrice}
                          onChange={(e) => updateItem(it.id, { unitPrice: Number(e.target.value) })} />
                      </div>
                    )}

                    <details className="rounded-lg border border-line bg-slate-50 px-3 py-2 text-sm">
                      <summary className="cursor-pointer text-xs font-medium text-slate-500">ตั้งค่าการตัด/เผื่อเสีย (ขั้นสูง)</summary>
                      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <div>
                          <label className="label">ร่องมีด (ซม.)</label>
                          <input type="number" step="0.1" className="input" value={it.gap}
                            onChange={(e) => updateItem(it.id, { gap: Number(e.target.value) })} />
                        </div>
                        <div>
                          <label className="label">ขอบ (ซม.)</label>
                          <input type="number" step="0.1" className="input" value={it.edge}
                            onChange={(e) => updateItem(it.id, { edge: Number(e.target.value) })} />
                        </div>
                        <div>
                          <label className="label">เผื่อเสีย (%)</label>
                          <input type="number" step="0.5" className="input" value={it.spoilagePct}
                            onChange={(e) => updateItem(it.id, { spoilagePct: Number(e.target.value) })} />
                        </div>
                        <div>
                          <label className="label">เซ็ตเครื่อง (แผ่น/ยก)</label>
                          <input type="number" className="input" value={it.makeReady}
                            onChange={(e) => updateItem(it.id, { makeReady: Number(e.target.value) })} />
                        </div>
                      </div>
                    </details>

                    {best && (
                      <>
                        <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                          <Stat label="ชิ้น/แผ่นพิมพ์" value={num(best.layout.plan.upsPerPressSheet)} accent />
                          <Stat label="ตัดซอย/แผ่นใหญ่" value={`${num(best.layout.plan.cutsPerParent)} ตัด`} />
                          {best.layout.signatures > 1 && <Stat label="จำนวนยก" value={`${num(best.layout.signatures)} ยก`} />}
                          <Stat label="ราคา/หน่วย" value={baht(best.cost.unitPrice)} accent />
                        </div>

                        <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
                          <div className="mb-1 font-medium text-slate-600">
                            เลือกใช้ {best.paper.name} ({num(best.paper.sheetW)}×{num(best.paper.sheetH)}) · {best.press.name} ·
                            ตัด {best.layout.plan.nx}×{best.layout.plan.ny} = {num(best.layout.plan.cutsPerParent)} แผ่นพิมพ์
                          </div>
                          <div className="flex flex-wrap gap-x-4 gap-y-1">
                            <span>การวาง: {best.layout.plan.imp.method}</span>
                            <span>คุ้มกระดาษ {num(best.layout.plan.imp.efficiency * 100, 1)}%</span>
                            <span>แผ่นพิมพ์ {num(best.layout.pressSheets)} (สุทธิ {num(best.layout.netPress)} + เผื่อ {num(best.layout.spoilage)})</span>
                            <span>แผ่นใหญ่ {num(best.layout.parentSheets)} แผ่น</span>
                          </div>
                          {canViewCost && (
                            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                              <span>ค่ากระดาษ {baht(best.cost.paperCost)}</span>
                              <span>ค่าเพลท {baht(best.cost.plateCost)} ({num(best.layout.plateCount)} กรอบ)</span>
                              <span>ค่าพิมพ์ {baht(best.cost.printCost)}</span>
                              <span>กำไร {baht(best.cost.margin)}</span>
                            </div>
                          )}
                        </div>

                        {/* ตารางจัดอันดับวิธีผลิต (Smart Layout) */}
                        {canViewCost && c.ranked.length > 1 && (
                          <details className="rounded-lg border border-line">
                            <summary className="cursor-pointer px-3 py-2 text-xs font-medium text-slate-600">
                              เปรียบเทียบวิธีผลิต {c.ranked.length} แบบ (เรียงดีสุด→แย่สุด) ที่ยอด {num(shownQty)}
                            </summary>
                            <div className="table-scroll border-t border-line">
                              <table className="w-full text-xs">
                                <thead className="bg-slate-50 text-left text-slate-400">
                                  <tr>
                                    <th className="px-3 py-2">#</th>
                                    <th className="px-3 py-2">กระดาษ</th>
                                    <th className="px-3 py-2">เครื่อง</th>
                                    <th className="px-3 py-2 text-right">ชิ้น/แผ่น</th>
                                    <th className="px-3 py-2 text-right">แผ่นใหญ่</th>
                                    <th className="px-3 py-2 text-right">คุ้ม %</th>
                                    <th className="px-3 py-2 text-right">ต้นทุน</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {c.ranked.slice(0, 8).map((r) => (
                                    <tr key={`${r.paper.id}-${r.press.id}`} className={`border-t border-line ${r.rank === 1 ? "bg-brand-50/40" : ""}`}>
                                      <td className="px-3 py-2">{r.rank}</td>
                                      <td className="px-3 py-2">{r.paper.name} {num(r.paper.sheetW)}×{num(r.paper.sheetH)}</td>
                                      <td className="px-3 py-2">{r.press.name}</td>
                                      <td className="px-3 py-2 text-right">{num(r.layout.plan.upsPerPressSheet)}</td>
                                      <td className="px-3 py-2 text-right">{num(r.layout.parentSheets)}</td>
                                      <td className="px-3 py-2 text-right">{num(r.layout.plan.imp.efficiency * 100, 1)}</td>
                                      <td className="px-3 py-2 text-right font-medium text-slate-700">{baht(r.cost.baseCost)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </details>
                        )}
                      </>
                    )}
                  </div>

                  <div className="rounded-lg border border-line bg-slate-50/50 p-3">
                    <div className="mb-2 text-center text-xs font-medium text-slate-500">การวางบนแผ่นพิมพ์ (1 ตัด)</div>
                    {best && <SheetView result={best.layout.plan.imp} />}
                    {best && (
                      <div className="mt-2 text-center text-xs text-slate-400">
                        แผ่นพิมพ์ {num(best.layout.plan.cellW, 1)}×{num(best.layout.plan.cellH, 1)} ซม. · {best.press.name}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </section>
          );
        })}

        <button onClick={addItem} className="btn-outline w-full border-dashed">＋ เพิ่มรายการ</button>
      </div>

      <aside className="space-y-4">
        <div className="card sticky top-6 p-5">
          <h2 className="mb-4 text-sm font-semibold text-slate-700">สรุปราคา</h2>

          {/* เทียบยอดพิมพ์ */}
          {quantities.length > 1 && (
            <div className="mb-4 table-scroll rounded-lg border border-line">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 text-left text-slate-400">
                  <tr>
                    <th className="px-3 py-2">ยอดพิมพ์</th>
                    <th className="px-3 py-2 text-right">ต้นทุนรวม</th>
                    <th className="px-3 py-2 text-right">/หน่วย</th>
                  </tr>
                </thead>
                <tbody>
                  {quantities.map((q) => {
                    const tot = subtotalForQty(q);
                    return (
                      <tr key={q} className={`border-t border-line ${q === shownQty ? "bg-brand-50/40" : ""}`}>
                        <td className="px-3 py-2">
                          <button onClick={() => setPrimaryQty(q)} className="text-brand-700 hover:underline">{num(q)}</button>
                        </td>
                        <td className="px-3 py-2 text-right">{baht(tot)}</td>
                        <td className="px-3 py-2 text-right">{baht(q > 0 ? tot / q : 0)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="space-y-2 text-sm">
            <Row label={`ยอดรวม (ที่ ${num(shownQty)})`} value={baht(subtotal)} />
            <div className="flex items-center justify-between">
              <span className="text-slate-500">ส่วนลด</span>
              <input type="number" className="w-28 rounded-md border border-line px-2 py-1 text-right text-sm"
                value={discount} onChange={(e) => setDiscount(Number(e.target.value))} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">VAT (%)</span>
              <input type="number" className="w-28 rounded-md border border-line px-2 py-1 text-right text-sm"
                value={vatPercent} onChange={(e) => setVatPercent(Number(e.target.value))} />
            </div>
            <Row label="ภาษีมูลค่าเพิ่ม" value={baht(vatAmount)} />
            <div className="my-2 border-t border-line" />
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-700">ยอดสุทธิ</span>
              <span className="text-lg font-bold text-brand-700">{baht(grandTotal)}</span>
            </div>
          </div>

          {canViewCost && (
            <button className="mt-2 text-xs text-brand-600 hover:underline" onClick={() => setShowRates((s) => !s)}>
              {showRates ? "ซ่อน" : "แก้ไข"} ต้นทุนเพิ่มเติม
            </button>
          )}
          {canViewCost && showRates && (
            <div className="mt-3 space-y-2 rounded-lg bg-slate-50 p-3">
              <RateInput label="กำไร %" v={rates.marginPct} set={(v) => setRates({ ...rates, marginPct: v })} />
              <RateInput label="เคลือบ/แผ่นพิมพ์" v={rates.coatingPerSheet} set={(v) => setRates({ ...rates, coatingPerSheet: v })} />
              <RateInput label="ไดคัท (เหมา)" v={rates.dieCut} set={(v) => setRates({ ...rates, dieCut: v })} />
              <p className="text-[11px] text-slate-400">* ค่าเพลท/ค่าพิมพ์ ดึงจากเครื่องพิมพ์โดยอัตโนมัติ</p>
            </div>
          )}

          {error && <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</div>}

          <button onClick={() => handleSave(false)} disabled={saving} className="btn-primary mt-4 w-full">
            {saving ? "กำลังบันทึก…" : "บันทึกใบเสนอราคา"}
          </button>
          <button onClick={() => handleSave(true)} disabled={saving} className="btn-outline mt-2 w-full">
            บันทึกเป็นแม่แบบ (Pattern)
          </button>
        </div>
      </aside>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`rounded-lg border p-2 text-center ${accent ? "border-brand-200 bg-brand-50" : "border-line bg-white"}`}>
      <div className="text-[11px] text-slate-400">{label}</div>
      <div className={`text-sm font-bold ${accent ? "text-brand-700" : "text-slate-700"}`}>{value}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-700">{value}</span>
    </div>
  );
}

function RateInput({ label, v, set }: { label: string; v: number; set: (v: number) => void }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-slate-500">{label}</span>
      <input type="number" className="w-24 rounded-md border border-line px-2 py-1 text-right text-sm"
        value={v} onChange={(e) => set(Number(e.target.value))} />
    </div>
  );
}
