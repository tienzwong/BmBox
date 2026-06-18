import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { redirect } from "next/navigation";
import ArchitectureView from "@/components/ArchitectureView";

export const dynamic = "force-dynamic";

export default async function ArchitecturePage() {
  const user = await requireUser();
  if (!can(user.role, "manageMasterData") && !can(user.role, "manageUsers")) {
    redirect("/");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800">โครงสร้างระบบ & graphify</h1>
        <p className="text-sm text-slate-500">
          แผนที่โมดูล BmBox ERP · เชื่อมกับ knowledge graph จาก graphify
        </p>
      </div>
      <ArchitectureView />
      <div className="card p-4 text-xs text-slate-500">
        <div className="font-medium text-slate-700">อัปเดต graph (นักพัฒนา)</div>
        <pre className="mt-2 overflow-x-auto rounded bg-slate-50 p-3 text-[11px] text-slate-600">
{`/graphify .              # สкан codebase → graphify-out/
npm run graphify:sync    # รวม ARCHITECTURE + copy HTML → public/`}
        </pre>
        <p className="mt-2">
          เอกสาร: <code className="rounded bg-slate-100 px-1">docs/ARCHITECTURE.md</code>
          {" · "}
          <Link href="/settings/backup" className="text-brand-600 hover:underline">สำรองข้อมูล</Link>
        </p>
      </div>
    </div>
  );
}
