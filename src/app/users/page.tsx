import { prisma } from "@/lib/prisma";
import UserManager from "@/components/UserManager";
import { requirePermission } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  await requirePermission("manageUsers");
  const users = await prisma.user.findMany({
    orderBy: { id: "asc" },
    select: { id: true, username: true, name: true, role: true, department: true, active: true },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800">ผู้ใช้งาน & สิทธิ์</h1>
        <p className="text-sm text-slate-500">
          กำหนดบทบาทเพื่อคุมการมองเห็นต้นทุน — ฝ่ายผลิตเห็นเฉพาะสเปกงาน ไม่เห็นต้นทุน/ราคา
        </p>
      </div>
      <UserManager users={users} />
    </div>
  );
}
