import { requirePermission } from "@/lib/auth/session";
import PackagingTemplateClient from "@/components/PackagingTemplateClient";

export const dynamic = "force-dynamic";

export default async function PackagingTemplatePage() {
  await requirePermission("createQuotation");
  return <PackagingTemplateClient />;
}
