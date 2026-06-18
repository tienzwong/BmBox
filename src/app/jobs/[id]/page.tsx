import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { num, thaiDate } from "@/lib/format";
import {
  DESIGN_STATUS,
  PLATE_STATUS,
  PRODUCTION_STATUS,
  POSTPRESS_STATUS,
  SHIPMENT_STATUS,
  optLabel,
} from "@/lib/labels";
import { computeJobProgress } from "@/lib/job-progress";
import JobProgressBar from "@/components/JobProgressBar";
import JobTimeline from "@/components/JobTimeline";

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

  const events = await prisma.jobEvent.findMany({
    where: { jobId: job.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      type: true,
      module: true,
      title: true,
      detail: true,
      actorName: true,
      createdAt: true,
    },
  });

  const progressSteps = computeJobProgress(job);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link href="/" className="text-sm text-brand-600 hover:underline">← หน้าหลัก</Link>

      <div className="card p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-lg font-bold text-slate-800">{job.code}</div>
            <div className="text-sm text-slate-500">{job.customer.name} · {job.title}</div>
          </div>
          <div className="flex flex-col items-end gap-2 text-sm">
            <Link href={`/jobs/${job.id}/print`} className="btn-outline text-xs print:hidden">
              ใบสั่งงาน + QR
            </Link>
            <div className="text-xs text-slate-400">จำนวน {num(job.quantity)} ชิ้น</div>
          </div>
        </div>

        <div className="mt-6 border-t border-line pt-5">
          <div className="mb-3 text-xs font-medium text-slate-400">ความคืบหน้างาน</div>
          <JobProgressBar steps={progressSteps} />
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

      <JobTimeline events={events} />

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
          <Link href="/jobs/progress-demo" className="text-brand-600 hover:underline">ดูตัวอย่าง progress bar</Link>
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
