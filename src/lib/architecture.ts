/**
 * โครงสร้างระบบสำหรับ UI + graphify — อ่านจาก Module Registry
 */
import { MODULES, type ModuleDef } from "@/modules/registry";

export interface SystemNode {
  id: string;
  label: string;
  path: string;
  layer: "module" | "crosscut" | "infra";
  description: string;
}

export const CROSS_CUTTING: SystemNode[] = [
  {
    id: "job",
    label: "Job (ใบสั่งงาน)",
    path: "/jobs",
    layer: "crosscut",
    description: "เชื่อมทุกแผนก — stage prepress → production → postpress → shipping → done",
  },
  {
    id: "jobevent",
    label: "JobEvent + Timeline",
    path: "/jobs",
    layer: "crosscut",
    description: "บันทึกประวัติอัตโนมัติจาก 5 API hooks",
  },
  {
    id: "notification",
    label: "Notification",
    path: "/api/notifications",
    layer: "crosscut",
    description: "แจ้งเตือนในระบบ · กระดิ่ง header",
  },
  {
    id: "packaging",
    label: "Final Packaging Import",
    path: "/quotations/packaging-template",
    layer: "crosscut",
    description: "Import JSON/PDF template → ใบเสนอราคา",
  },
  {
    id: "graphify",
    label: "graphify Graph",
    path: "/settings/architecture",
    layer: "infra",
    description: "Knowledge graph จาก codebase — graphify-out/",
  },
];

export function moduleNodes(): SystemNode[] {
  return MODULES.map((m: ModuleDef) => ({
    id: m.key,
    label: m.name,
    path: m.path,
    layer: "module" as const,
    description: m.description,
  }));
}

/** Mermaid flowchart สำหรับหน้า Architecture */
export function jobFlowMermaid(): string {
  const stages = MODULES.filter((m) =>
    ["prepress", "production", "postpress", "shipping"].includes(m.key)
  );
  const lines = [
    "flowchart LR",
    "  Q[ใบเสนอราคา] --> J[Job]",
    ...stages.map((s, i) => {
      const prev = i === 0 ? "J" : stages[i - 1].key.toUpperCase();
      const node = s.key.toUpperCase();
      return `  ${prev} --> ${node}[${s.short}]`;
    }),
    `  SHIPPING --> DONE[เสร็จสิ้น]`,
    "  J -.-> EV[JobEvent]",
    "  EV -.-> NT[Notification]",
  ];
  return lines.join("\n");
}

export const GRAPHIFY_PATHS = {
  graphJson: "graphify-out/graph.json",
  graphHtml: "graphify-out/graph.html",
  publicHtml: "/architecture/graph.html",
  structure: "docs/graphify-structure.json",
  architectureDoc: "docs/ARCHITECTURE.md",
} as const;
