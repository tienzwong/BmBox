import { prisma } from "@/lib/prisma";
import PaperManager from "@/components/PaperManager";
import { requireUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";

export const dynamic = "force-dynamic";

export default async function PapersPage() {
  const user = await requireUser();
  const papers = await prisma.paper.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800">คลังกระดาษ</h1>
        <p className="text-sm text-slate-500">ชนิดกระดาษและขนาดแผ่นใหญ่สำหรับคำนวณการตัด</p>
      </div>
      <PaperManager
        papers={papers}
        canViewCost={can(user.role, "viewCost")}
        canManage={can(user.role, "manageMasterData")}
      />
    </div>
  );
}
