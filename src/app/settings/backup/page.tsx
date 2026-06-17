import { requirePermission } from "@/lib/auth/session";
import BackupManager from "@/components/BackupManager";

export const dynamic = "force-dynamic";

export default async function BackupPage() {
  await requirePermission("manageUsers");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800">สำรองข้อมูล (Backup)</h1>
        <p className="text-sm text-slate-500">
          ระบบรันบน VPS — ตั้ง cron สำรองอัตโนมัติทุกสัปดาห์ และดึงไฟล์กลับมาเก็บที่บริษัทเพื่อกันระบบพัง
        </p>
      </div>

      <BackupManager />

      <div className="card p-5 text-sm text-slate-600">
        <h2 className="mb-2 font-semibold text-slate-700">ตั้งสำรองอัตโนมัติรายสัปดาห์บน VPS</h2>
        <p className="mb-2 text-xs text-slate-500">เพิ่มใน crontab ของ VPS (ทุกวันอาทิตย์ ตี 2):</p>
        <pre className="overflow-x-auto rounded-lg bg-slate-900 p-3 text-xs text-slate-100">
{`0 2 * * 0  cd /var/www/bmbox-erp && /usr/bin/npm run db:backup >> /var/log/bmbox-backup.log 2>&1`}
        </pre>
        <p className="mb-2 mt-4 text-xs text-slate-500">ดึงไฟล์สำรองกลับมาที่บริษัทอัตโนมัติ (รันบนเครื่องที่บริษัท ทุกวันอาทิตย์ ตี 3):</p>
        <pre className="overflow-x-auto rounded-lg bg-slate-900 p-3 text-xs text-slate-100">
{`0 3 * * 0  rsync -avz -e ssh user@vps-ip:/var/www/bmbox-erp/backups/ /backup/bmbox/`}
        </pre>
        <p className="mt-3 text-xs text-slate-400">
          ดูรายละเอียดการ deploy และกู้คืนเพิ่มเติมที่ไฟล์ <code className="text-brand-600">DEPLOY.md</code>
        </p>
      </div>
    </div>
  );
}
