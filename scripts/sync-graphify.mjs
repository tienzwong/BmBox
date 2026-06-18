#!/usr/bin/env node
/**
 * รวม docs/graphify-structure.json เข้า graphify-out/graph.json
 * แล้ว copy graph.html → public/architecture/ สำหรับ production
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

const root = join(import.meta.dirname, "..");
const graphPath = join(root, "graphify-out/graph.json");
const structurePath = join(root, "docs/graphify-structure.json");
const htmlSrc = join(root, "graphify-out/graph.html");
const publicDir = join(root, "public/architecture");
const htmlDst = join(publicDir, "graph.html");

function loadJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function mergeStructure(graph, structure) {
  const nodes = [...(graph.nodes ?? [])];
  const links = [...(graph.links ?? graph.edges ?? [])];
  const ids = new Set(nodes.map((n) => n.id));

  for (const n of structure.nodes ?? []) {
    if (!ids.has(n.id)) {
      nodes.push({ ...n, group: n.group ?? "architecture" });
      ids.add(n.id);
    }
  }

  for (const e of structure.edges ?? []) {
    links.push({
      source: e.source,
      target: e.target,
      relation: e.relation,
      confidence: e.confidence,
      source_file: e.source_file,
      weight: e.weight ?? 1,
    });
  }

  return { ...graph, nodes, links };
}

if (!existsSync(graphPath)) {
  console.error("ไม่พบ graphify-out/graph.json — รัน /graphify บนโปรเจกต์ก่อน");
  process.exit(1);
}

if (!existsSync(structurePath)) {
  console.error("ไม่พบ docs/graphify-structure.json");
  process.exit(1);
}

const graph = loadJson(graphPath);
const structure = loadJson(structurePath);
const merged = mergeStructure(graph, structure);

writeFileSync(graphPath, JSON.stringify(merged, null, 2));
console.log(`✓ Merged ${structure.nodes?.length ?? 0} architecture nodes → graphify-out/graph.json`);

if (!existsSync(htmlSrc)) {
  console.warn("⚠  ไม่พบ graphify-out/graph.html — ข้าม copy (รัน /graphify เพื่อสร้าง)");
  process.exit(0);
}

mkdirSync(publicDir, { recursive: true });
copyFileSync(htmlSrc, htmlDst);
const kb = Math.round(readFileSync(htmlDst).length / 1024);
console.log(`✓ Copied → public/architecture/graph.html (${kb} KB)`);
