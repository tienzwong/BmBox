import { prisma } from "@/lib/prisma";

export async function getJobForTrack(code: string) {
  return prisma.job.findUnique({
    where: { code },
    include: {
      customer: { select: { name: true } },
      quotation: { select: { number: true, soNumber: true, jobType: true, specDetail: true } },
      prepress: true,
      production: true,
      postpress: true,
      shipment: true,
    },
  });
}

export async function getJobForPrint(id: number) {
  return prisma.job.findUnique({
    where: { id },
    include: {
      customer: true,
      quotation: {
        include: {
          items: { include: { paper: true }, orderBy: { id: "asc" } },
        },
      },
      prepress: true,
      production: true,
      postpress: true,
      shipment: true,
    },
  });
}
