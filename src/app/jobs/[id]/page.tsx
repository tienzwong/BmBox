import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { num, thaiDate } from "@/lib/format";
import {
  JOB_STAGE,
  DESIGN_STATUS,
  PLATE_STATUS,
  PRODUCTION_STATUS,
  POSTPRESS_STATUS,
  SHIPMENT_STATUS,
  optLabel,
} from "@/lib/labels";
import { STAGE_ORDER } from "@/lib/jobs";

export const dynamic = "force-dynamic";

function Badge({ o }: { o: { label: string; cls: string } }) {
  return <span className={`badge ${o.cls}`}>{o.label}</span>;
}

export default async function JobDetail({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const job = await prisma.job.findUnique({
    where: { id: Number(id) },
    include: {
      customer: true,
      quotation: true,
      prepress: true,
      production: true,
      postpress: true,
      shipment: true,
    },
  });
  if (!job) notFound();

  const stages = STAGE_ORDER;
  const currentIdx = stages.indexOf(job.stage as (typeof stages)[number]);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link href="/" className="text-sm text-brand-600 hover:underline">← หน้าหลัก</Link>

      <div className="card p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-lg font-bold text-slate-800">{job.code}</div>
            <div className="text-sm text-slate-500">{job.customer.name} · {job.title}</div>
          </div>
          <div className="text-right text-sm">
            <Badge o={JOB_STAGE[job.stage] ?? JOB_STAGE.prepress} />
            <div className="mt-1 text-xs text-slate-400">จำนวน {num(job.quantity)} ชิ้น</div>
          </div>
        </div>

        {/* แถบความคืบหน้า */}
        <div className="mt-5 flex items-center">
          {stages.map((s, i) => (
            <div key={s} className="flex flex-1 items-center last:flex-none">
              <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                i <= currentIdx ? "bg-brand-600 text-white" : "bg-slate-200 text-slate-500"
              }`}>
                {i + 1}
              </div>
              {i < stages.length - 1 && (
                <div className={`mx-1 h-0.5 flex-1 ${i < currentIdx ? "bg-brand-600" : "bg-slate-200"}`} />
              )}
            </div>
          ))}
        </div>
        <div className="mt-1 flex justify-between text-[11px] text-slate-400">
          {stages.map((s) => <span key={s}>{JOB_STAGE[s]?.label}</span>)}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card title="พรีเพลส" href="/prepress">
          <Row label="ออกแบบ"><Badge o={optLabel(DESIGN_STATUS, job.prepress?.designStatus ?? "waiting")} /></Row>
          <Row label="ทำเพลท"><Badge o={optLabel(PLATE_STATUS, job.prepress?.plateStatus ?? "waiting")} /></Row>
        </Card>

        <Card title="ฝ่ายผลิต" href="/production">
          <Row label="เครื่อง"><span className="text-slate-600">{job.production?.pressName ?? "-"}</span></Row>
          <Row label="พิมพ์">
            <span className="text-slate-600">{num(job.production?.printedSheets ?? 0)}/{num(job.production?.plannedSheets ?? 0)} แผ่น</span>
          </Row>
          <Row label="สถานะ"><Badge o={optLabel(PRODUCTION_STATUS, job.production?.status ?? "queued")} /></Row>
        </Card>

        <Card title="หลังพิมพ์" href="/postpress">
          <Row label="สถานะ"><Badge o={optLabel(POSTPRESS_STATUS, job.postpress?.status ?? "queued")} /></Row>
          <div className="text-xs text-slate-400">{procSummary(job.postpress?.processes)}</div>
        </Card>

        <Card title="จัดส่ง" href="/shipping">
          <Row label="ขนส่ง"><span className="text-slate-600">{job.shipment?.carrier ?? "-"}</span></Row>
          <Row label="เลขพัสดุ"><span className="text-slate-600">{job.shipment?.trackingNo ?? "-"}</span></Row>
          <Row label="สถานะ"><Badge o={optLabel(SHIPMENT_STATUS, job.shipment?.status ?? "preparing")} /></Row>
        </Card>
      </div>

      <div className="card p-4 text-sm text-slate-500">
        <div className="flex flex-wrap gap-x-6 gap-y-1">
          <span>สร้างเมื่อ {thaiDate(job.createdAt)}</span>
          {job.quotation && (
            <Link href={`/quotations/${job.quotation.id}`} className="text-brand-600 hover:underline">
              อ้างอิงใบเสนอราคา {job.quotation.number}
            </Link>
          )}
          {can(user.role, "viewCost") && (
            <Link href={`/costing/${job.id}`} className="text-rose-600 hover:underline">ดูต้นทุนงานนี้</Link>
          )}
        </div>
      </div>
    </div>
  );
}

function Card({ title, href, children }: { title: string; href: string; children: React.ReactNode }) {
  return (
    <div className="card p-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
        <Link href={href} className="text-xs text-brand-600 hover:underline">เปิดโมดูล</Link>
      </div>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-slate-400">{label}</span>
      {children}
    </div>
  );
}

function procSummary(json?: string): string {
  if (!json) return "";
  try {
    const arr = JSON.parse(json) as { name: string; done: boolean }[];
    const done = arr.filter((p) => p.done).length;
    return `${arr.map((p) => (p.done ? "✓" : "○") + p.name).join("  ")} (${done}/${arr.length})`;
  } catch {
    return "";
  }
}
