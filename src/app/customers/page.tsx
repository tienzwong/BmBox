import { redirect } from "next/navigation";

export default async function CustomersRedirect({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const params = await searchParams;
  const tab = params.tab ? `?tab=${params.tab}` : "?tab=customer";
  redirect(`/contacts${tab}`);
}
