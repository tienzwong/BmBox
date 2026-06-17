import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireModule } from "@/lib/auth/session";
import { num } from "@/lib/format";
import { SHIPMENT_STATUS } from "@/lib/labels";
import StatusSelect from "@/components/StatusSelect";
import TextInline from "@/components/TextInline";

export const dynamic = "force-dynamic";

export default async function ShippingPage() {
  await requireModule("shipping");
  const jobs = await prisma.job.findMany({
    where: { stage: { in: ["shipping", "done"] } },
    orderBy: { createdAt: "asc" },
    include: { customer: true, shipment: true },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800">จัดส่ง</h1>
        <p className="text-sm text-slate-500">งานที่พร้อมจัดส่ง/จัดส่งแล้ว ({jobs.length} งาน)</p>
      </div>

      <div className="card overflow-hidden">
        <div className="table-scroll">
          <table>
          <thead className="bg-slate-50 text-left text-xs text-slate-400">
            <tr>
              <th className="px-5 py-2.5 font-medium">ใบสั่งงาน</th>
              <th className="px-5 py-2.5 font-medium">ลูกค้า</th>
              <th className="px-5 py-2.5 text-center font-medium">จำนวน</th>
              <th className="px-5 py-2.5 font-medium">ขนส่ง</th>
              <th className="px-5 py-2.5 font-medium">เลขพัสดุ</th>
              <th className="px-5 py-2.5 font-medium">สถานะ</th>
            </tr>
          </thead>
          <tbody>
            {jobs.length === 0 ? (
              <tr><td colSpan={6} className="p-8 text-center text-slate-400">ยังไม่มีงานรอจัดส่ง</td></tr>
            ) : jobs.map((j) => (
              <tr key={j.id} className="border-t border-line hover:bg-slate-50">
                <td className="px-5 py-3">
                  <Link href={`/jobs/${j.id}`} className="font-medium text-brand-700 hover:underline">{j.code}</Link>
                </td>
                <td className="px-5 py-3 text-slate-700">{j.customer.name}</td>
                <td className="px-5 py-3 text-center text-slate-600">{num(j.quantity)}</td>
                <td className="px-5 py-3">
                  {j.shipment && (
                    <TextInline endpoint="/api/shipping" id={j.shipment.id} field="carrier" value={j.shipment.carrier} placeholder="ขนส่ง" />
                  )}
                </td>
                <td className="px-5 py-3">
                  {j.shipment && (
                    <TextInline endpoint="/api/shipping" id={j.shipment.id} field="trackingNo" value={j.shipment.trackingNo} placeholder="tracking" />
                  )}
                </td>
                <td className="px-5 py-3">
                  {j.shipment && (
                    <StatusSelect endpoint="/api/shipping" id={j.shipment.id} field="status" value={j.shipment.status} options={SHIPMENT_STATUS} />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
