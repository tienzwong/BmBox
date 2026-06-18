import { baht } from "@/lib/format";
import type { DielineImport } from "@/lib/packaging-import";
import { estimateDieCutCost } from "@/lib/packaging-import";

export interface PackagingMeta {
  imageName?: string | null;
  imageDataUrl?: string | null;
  dielineSvg?: string | null;
  dieline?: DielineImport | null;
}

export default function PackagingPreview({ data }: { data: PackagingMeta }) {
  const dieCut = estimateDieCutCost(data.dieline);
  if (!data.imageDataUrl && !data.dielineSvg) return null;

  return (
    <div className="mb-4 rounded-lg border border-line bg-white p-4 print:break-inside-avoid">
      <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Final Packaging</div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {data.imageDataUrl && (
          <div>
            <div className="mb-1 text-xs text-slate-500">{data.imageName ?? "รูปสินค้า"}</div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={data.imageDataUrl} alt="" className="max-h-52 w-full rounded border border-line object-contain" />
          </div>
        )}
        {data.dielineSvg && (
          <div>
            <div className="mb-1 text-xs text-slate-500">เส้นไดคัท</div>
            <div className="rounded border border-line bg-slate-50 p-2" dangerouslySetInnerHTML={{ __html: data.dielineSvg }} />
            {dieCut != null && <p className="mt-1 text-xs text-slate-500">ต้นทุนไดคัท: {baht(dieCut)}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
