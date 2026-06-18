import { NextResponse } from "next/server";
import { getJobForTrack } from "@/lib/job-query";
import { computeJobProgress } from "@/lib/job-progress";
import { summarizeJobTrack } from "@/lib/job-track";

export async function GET(_req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const job = await getJobForTrack(decodeURIComponent(code));
  if (!job) return NextResponse.json({ error: "ไม่พบงาน" }, { status: 404 });

  const summary = summarizeJobTrack(job);
  const steps = computeJobProgress(job);

  return NextResponse.json({
    code: job.code,
    title: job.title,
    customer: job.customer.name,
    quantity: job.quantity,
    stage: job.stage,
    status: job.status,
    summary,
    steps,
    quotation: job.quotation
      ? { number: job.quotation.number, soNumber: job.quotation.soNumber }
      : null,
    updatedAt: new Date().toISOString(),
  });
}
