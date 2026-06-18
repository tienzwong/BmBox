import { notFound } from "next/navigation";
import { getJobForTrack } from "@/lib/job-query";
import { computeJobProgress } from "@/lib/job-progress";
import { summarizeJobTrack } from "@/lib/job-track";
import JobTrackClient from "./JobTrackClient";

export const dynamic = "force-dynamic";

export default async function JobTrackPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const job = await getJobForTrack(decodeURIComponent(code));
  if (!job) notFound();

  const initial = {
    code: job.code,
    title: job.title,
    customer: job.customer.name,
    quantity: job.quantity,
    summary: summarizeJobTrack(job),
    steps: computeJobProgress(job),
    quotation: job.quotation
      ? { number: job.quotation.number, soNumber: job.quotation.soNumber }
      : null,
    updatedAt: new Date().toISOString(),
  };

  return <JobTrackClient code={job.code} initial={initial} />;
}
