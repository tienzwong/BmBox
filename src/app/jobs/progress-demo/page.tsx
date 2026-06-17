import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { computeJobProgress, PROGRESS_DEMO_SAMPLES } from "@/lib/job-progress";
import JobProgressBar from "@/components/JobProgressBar";

export const dynamic = "force-dynamic";

export default async function ProgressDemoPage() {
  await requireUser();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Link href="/" className="text-sm text-brand-600 hover:underline">← หน้าหลัก</Link>
        <h1 className="mt-2 text-xl font-bold text-slate-800">ตัวอย่าง Progress Bar — สถานะงาน</h1>
        <p className="text-sm text-slate-500">
          🎨 🖨️ ✂️ 🚚 ✅ · ✓ เสร็จ · ⟳ กำลังทำ · ○ รอ
        </p>
      </div>

      <div className="card p-4 text-sm text-slate-600">
        <div className="mb-2 text-xs font-medium text-slate-400">ไอคอนแต่ละขั้น</div>
        <div className="flex flex-wrap gap-4 text-lg">
          <span>🎨 พรีเพลส</span>
          <span>🖨️ ฝ่ายผลิต</span>
          <span>✂️ หลังพิมพ์</span>
          <span>🚚 จัดส่ง</span>
          <span>✅ เสร็จสิ้น</span>
        </div>
        <div className="mt-3 flex flex-wrap gap-4 text-xs">
          <Legend dot="bg-emerald-500" label="✓ เสร็จแล้ว" />
          <Legend dot="bg-brand-600" label="⟳ กำลังทำ" />
          <Legend dot="bg-slate-100 ring-2 ring-slate-300" label="○ ยังไမဖึง" />
        </div>
      </div>

      <div className="space-y-5">
        {PROGRESS_DEMO_SAMPLES.map((sample) => {
          const steps = computeJobProgress(sample.job);
          return (
            <div key={sample.title} className="card overflow-hidden">
              <div className="border-b border-line bg-slate-50 px-5 py-3">
                <div className="font-semibold text-slate-800">{sample.title}</div>
                <div className="text-xs text-slate-500">{sample.desc}</div>
              </div>
              <div className="px-4 py-6 sm:px-6">
                <JobProgressBar steps={steps} />
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-center text-xs text-slate-400">
        ดูงานจริงได้ที่หน้าใบสั่งงาน · เช่น จากเมนูพรีเพลส / ฝ่ายผลิต → คลิกเลข JOB
      </p>
    </div>
  );
}

function Legend({ dot, label }: { dot: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className={`inline-block h-3 w-3 rounded-full ${dot}`} />
      {label}
    </span>
  );
}
