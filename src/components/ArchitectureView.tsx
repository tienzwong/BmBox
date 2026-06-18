"use client";

import { CROSS_CUTTING, GRAPHIFY_PATHS, jobFlowMermaid, moduleNodes } from "@/lib/architecture";

export default function ArchitectureView() {
  const modules = moduleNodes();

  return (
    <div className="space-y-6">
      {/* Job flow */}
      <section className="card p-5">
        <h2 className="mb-3 text-sm font-semibold text-slate-700">Job Lifecycle (แผนก → แผนก)</h2>
        <div className="overflow-x-auto rounded-lg bg-slate-50 p-4">
          <pre className="text-xs leading-relaxed text-slate-600">{jobFlowMermaid()}</pre>
        </div>
      </section>

      {/* Module grid */}
      <section className="card p-5">
        <h2 className="mb-3 text-sm font-semibold text-slate-700">โมดูลแผนก</h2>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map((m) => (
            <a
              key={m.id}
              href={m.path}
              className="rounded-lg border border-line p-3 transition hover:border-brand-300 hover:bg-brand-50/30"
            >
              <div className="text-sm font-medium text-slate-800">{m.label}</div>
              <div className="text-[11px] text-brand-600">{m.path}</div>
              <div className="mt-1 text-xs text-slate-500">{m.description}</div>
            </a>
          ))}
        </div>
      </section>

      {/* Cross-cutting */}
      <section className="card p-5">
        <h2 className="mb-3 text-sm font-semibold text-slate-700">ชั้นกลาง (Cross-cutting)</h2>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {CROSS_CUTTING.map((n) => (
            <div key={n.id} className="rounded-lg border border-dashed border-violet-200 bg-violet-50/30 p-3">
              <div className="text-sm font-medium text-violet-900">{n.label}</div>
              <div className="text-[11px] text-violet-600">{n.path}</div>
              <div className="mt-1 text-xs text-slate-600">{n.description}</div>
            </div>
          ))}
        </div>
      </section>

      {/* graphify embed */}
      <section className="card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-5 py-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-700">graphify Knowledge Graph</h2>
            <p className="text-xs text-slate-500">
              {GRAPHIFY_PATHS.graphJson} → {GRAPHIFY_PATHS.publicHtml}
            </p>
          </div>
          <a
            href={GRAPHIFY_PATHS.publicHtml}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-outline text-xs"
          >
            เปิดเต็มจอ
          </a>
        </div>
        <iframe
          title="graphify architecture graph"
          src={GRAPHIFY_PATHS.publicHtml}
          className="h-[min(520px,70vh)] w-full border-0 bg-white"
        />
      </section>
    </div>
  );
}
