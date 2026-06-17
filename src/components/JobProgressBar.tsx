import type { ProgressStep, StageKey } from "@/lib/job-progress";

interface Props {
  steps: ProgressStep[];
  compact?: boolean;
}

const STAGE_EMOJI: Record<StageKey, string> = {
  prepress: "🎨",
  production: "🖨️",
  postpress: "✂️",
  shipping: "🚚",
  done: "✅",
};

function iconWrapCls(state: ProgressStep["state"]): string {
  if (state === "done") return "bg-emerald-50 shadow-sm ring-1 ring-emerald-100";
  if (state === "active") return "bg-brand-50 shadow-md ring-2 ring-brand-200 scale-105";
  return "bg-slate-50 ring-1 ring-slate-100 opacity-60 grayscale-[0.35]";
}

function StepIcon({ stage }: { stage: StageKey }) {
  return (
    <span className="select-none text-[1.85rem] leading-none" role="img" aria-hidden>
      {STAGE_EMOJI[stage]}
    </span>
  );
}

function NodeMark({ state }: { state: ProgressStep["state"] }) {
  if (state === "done") {
    return (
      <svg className="h-3.5 w-3.5 text-white" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 0 1 0 1.414l-8 8a1 1 0 0 1-1.414 0l-4-4a1 1 0 1 1 1.414-1.414L8 12.586l7.293-7.293a1 1 0 0 1 1.414 0Z" clipRule="evenodd" />
      </svg>
    );
  }
  if (state === "active") {
    return (
      <svg className="h-3.5 w-3.5 animate-spin text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 0 0 4.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 0 1-15.357-2m15.357 2H15" />
      </svg>
    );
  }
  return <span className="block h-2.5 w-2.5 rounded-full border-2 border-slate-300" aria-hidden />;
}

function nodeCls(state: ProgressStep["state"]): string {
  if (state === "done") return "bg-emerald-500 ring-4 ring-emerald-100";
  if (state === "active") return "bg-brand-600 ring-4 ring-brand-100";
  return "bg-white ring-2 ring-slate-200";
}

function lineCls(leftDone: boolean): string {
  return leftDone ? "bg-emerald-400" : "bg-slate-200";
}

function numCls(state: ProgressStep["state"]): string {
  if (state === "done") return "bg-emerald-500 text-white shadow-sm";
  if (state === "active") return "bg-brand-600 text-white shadow-sm";
  return "bg-slate-100 text-slate-400 ring-1 ring-slate-200";
}

/// แถบความคืบหน้างาน 5 ขั้น — emoji + ✓/⟳/○
export default function JobProgressBar({ steps, compact = false }: Props) {
  return (
    <div className={`job-progress overflow-x-auto ${compact ? "" : "px-1 py-2"}`} role="list" aria-label="ความคืบหน้างาน">
      <div className={`flex min-w-[36rem] ${compact ? "gap-0" : "gap-1"}`}>
        {steps.map((step, i) => (
          <div key={step.key} className="flex min-w-0 flex-1 flex-col items-center" role="listitem">
            <div
              className={`mb-3 flex h-12 w-12 items-center justify-center rounded-xl transition-all ${iconWrapCls(step.state)}`}
              title={step.label}
            >
              <StepIcon stage={step.key} />
            </div>

            <div className="flex w-full items-center">
              <div className={`h-1 flex-1 rounded-full ${i === 0 ? "opacity-0" : lineCls(steps[i - 1].state === "done")}`} />
              <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${nodeCls(step.state)}`}>
                <NodeMark state={step.state} />
              </div>
              <div className={`h-1 flex-1 rounded-full ${i === steps.length - 1 ? "opacity-0" : lineCls(step.state === "done")}`} />
            </div>

            <div className={`mt-2.5 text-center font-semibold ${compact ? "text-[10px]" : "text-xs"} ${
              step.state === "active" ? "text-brand-700" : step.state === "done" ? "text-emerald-700" : "text-slate-400"
            }`}>
              {step.label}
            </div>

            {!compact && step.subLabel && step.state === "active" && (
              <div className="mt-1 max-w-[8rem] text-center text-[10px] leading-snug text-slate-500">
                {step.subLabel}
              </div>
            )}

            <div className={`mt-2.5 flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${numCls(step.state)}`}>
              {i + 1}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
