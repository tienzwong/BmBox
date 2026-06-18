import Link from "next/link";
import { notFound } from "next/navigation";
import { getJobForPrint } from "@/lib/job-query";
import { jobTrackUrl } from "@/lib/app-url";
import { qrDataUrl } from "@/lib/qr";
import { num, thaiDate } from "@/lib/format";
import { computeJobProgress } from "@/lib/job-progress";
import {
  DESIGN_STATUS,
  PLATE_STATUS,
  PRODUCTION_STATUS,
  POSTPRESS_STATUS,
  SHIPMENT_STATUS,
  optLabel,
} from "@/lib/labels";
import PrintButton from "@/components/PrintButton";
import { requireUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function JobPrintPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;
  const job = await getJobForPrint(Number(id));
  if (!job) notFound();

  const trackUrl = jobTrackUrl(job.code);
  const qr = await qrDataUrl(trackUrl, 160);
  const steps = computeJobProgress(job);
  const q = job.quotation;

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 print:hidden">
        <Link href={`/jobs/${job.id}`} className="text-sm text-brand-600 hover:underline">
          ← กลับรายละเอียดงาน
        </Link>
        <PrintButton />
      </div>

      <div className="card p-8 print:border-0 print:shadow-none">
        <div className="flex items-start justify-between border-b border-line pb-6">
          <div>
            <div className="text-lg font-bold text-slate-800">บริษัท เบลสโมทีฟ จำกัด</div>
            <div className="text-xs text-slate-500">BmBox · โรงพิมพ์แพคเกจจิ้งกระดาษ</div>
          </div>
          <div className="text-right">
            <div className="text-xl font-bold text-brand-700">ใบสั่งงาน</div>
            <div className="text-sm font-semibold text-slate-800">{job.code}</div>
            {q?.soNumber && <div className="text-xs text-slate-500">SO: {q.soNumber}</div>}
            {q?.number && <div className="text-xs text-slate-500">อ้างอิง QT: {q.number}</div>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 py-6 text-sm">
          <div>
            <div className="mb-1 text-xs font-medium text-slate-400">ลูกค้า</div>
            <div className="font-semibold text-slate-800">{job.customer.name}</div>
            {job.customer.phone && <div className="text-slate-500">โทร: {job.customer.phone}</div>}
          </div>
          <div className="text-right">
            <div className="text-slate-500">วันที่เปิดงาน: {thaiDate(job.createdAt)}</div>
            <div className="text-slate-500">จำนวน: {num(job.quantity)} ชิ้น</div>
            {job.dueDate && <div className="text-slate-500">กำหนดส่ง: {thaiDate(job.dueDate)}</div>}
          </div>
        </div>

        <div className="mb-6 rounded-lg bg-slate-50 px-4 py-3 text-sm">
          <div className="font-medium text-slate-800">{job.title}</div>
          {q?.jobType && <div className="mt-1 text-xs text-slate-500">ลักษณะงาน: {q.jobType}</div>}
          {q?.specDetail && (
            <pre className="mt-2 whitespace-pre-wrap text-xs text-slate-600">{q.specDetail}</pre>
          )}
        </div>

        {q && q.items.length > 0 && (
          <div className="mb-6 table-scroll">
            <table className="w-full text-sm">
              <thead className="border-y border-line bg-slate-50 text-left text-xs text-slate-500">
                <tr>
                  <th className="px-3 py-2">รายการ</th>
                  <th className="px-3 py-2 text-center">ขนาด</th>
                  <th className="px-3 py-2 text-center">จำนวน</th>
                  <th className="px-3 py-2">กระดาษ / เครื่อง</th>
                </tr>
              </thead>
              <tbody>
                {q.items.map((it) => (
                  <tr key={it.id} className="border-b border-line align-top">
                    <td className="px-3 py-2 font-medium text-slate-800">{it.description}</td>
                    <td className="px-3 py-2 text-center text-slate-600">
                      {num(it.pieceW, 1)}×{num(it.pieceH, 1)}
                    </td>
                    <td className="px-3 py-2 text-center text-slate-600">{num(it.quantity)}</td>
                    <td className="px-3 py-2 text-xs text-slate-500">
                      {it.paper?.name ?? "-"}
                      {it.pressName ? ` · ${it.pressName}` : ""}
                      <br />
                      พิมพ์ {it.colorsFront}
                      {it.colorsBack > 0 ? `+${it.colorsBack}` : ""} สี · {num(it.sheetsNeeded)} แผ่นใหญ่
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mb-6">
          <div className="mb-2 text-xs font-medium text-slate-400">สถานะแผนก (ตอนพิมพ์)</div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <DeptCell
              label="พรีเพลส"
              value={`${optLabel(DESIGN_STATUS, job.prepress?.designStatus ?? "waiting").label} / ${optLabel(PLATE_STATUS, job.prepress?.plateStatus ?? "waiting").label}`}
            />
            <DeptCell
              label="ผลิต"
              value={`${optLabel(PRODUCTION_STATUS, job.production?.status ?? "queued").label} · ${num(job.production?.printedSheets ?? 0)}/${num(job.production?.plannedSheets ?? 0)} แผ่น`}
            />
            <DeptCell label="หลังพิมพ์" value={optLabel(POSTPRESS_STATUS, job.postpress?.status ?? "queued").label} />
            <DeptCell label="จัดส่ง" value={optLabel(SHIPMENT_STATUS, job.shipment?.status ?? "preparing").label} />
          </div>
        </div>

        <div className="flex items-end justify-between gap-6 border-t border-line pt-6">
          <div className="flex-1 text-xs text-slate-500">
            <div className="mb-2 font-medium text-slate-700">ขั้นตอนปัจจุบัน</div>
            <ul className="space-y-1">
              {steps.map((s) => (
                <li key={s.key} className={s.state === "active" ? "font-semibold text-brand-700" : ""}>
                  {s.state === "done" ? "✓" : s.state === "active" ? "▶" : "○"} {s.label}
                  {s.subLabel && s.state === "active" ? ` — ${s.subLabel}` : ""}
                </li>
              ))}
            </ul>
            {job.note && (
              <p className="mt-3">
                <span className="font-medium">หมายเหตุ:</span> {job.note}
              </p>
            )}
          </div>

          <div className="shrink-0 text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qr} alt="" width={140} height={140} className="mx-auto rounded-lg border border-line" />
            <div className="mt-2 text-[10px] font-medium text-slate-600">สแกนติดตามสถานะ</div>
            <div className="mt-0.5 max-w-[9rem] break-all text-[9px] text-slate-400">{trackUrl}</div>
          </div>
        </div>

        <div className="mt-10 grid grid-cols-3 gap-4 text-center text-xs text-slate-400">
          <div>
            <div className="mb-8">ผู้สั่งงาน</div>
            <div className="border-t border-line pt-1">ฝ่ายขาย</div>
          </div>
          <div>
            <div className="mb-8">ผู้รับงานผลิต</div>
            <div className="border-t border-line pt-1">ฝ่ายผลิต</div>
          </div>
          <div>
            <div className="mb-8">QC / ส่งมอบ</div>
            <div className="border-t border-line pt-1">ฝ่ายจัดส่ง</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DeptCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line bg-white px-3 py-2">
      <div className="text-slate-400">{label}</div>
      <div className="font-medium text-slate-700">{value}</div>
    </div>
  );
}
