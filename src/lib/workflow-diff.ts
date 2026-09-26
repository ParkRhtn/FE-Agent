import { NODE_META, type NodeKind, type WorkflowGraph } from "@/lib/workflow";

/** 배포본과 편집본 비교. 실행에 영향을 주는 것(노드 설정, 연결, 추가·삭제)만 보고 위치는 무시한다 (백엔드 판정과 같다). */

export type FieldChange = { key: string; label: string; before: string; after: string };
export type NodeChange = {
  id: string;
  kind: NodeKind;
  title: string;
  change: "added" | "removed" | "changed";
  fields: FieldChange[];
};
export type EdgeChange = { id: string; label: string; change: "added" | "removed" };
export type GraphDiff = { nodes: NodeChange[]; edges: EdgeChange[]; count: number };

const FIELD_LABEL: Record<string, string> = {
  prompt: "프롬프트",
  system: "시스템 프롬프트",
  model: "모델",
  agent_id: "에이전트",
  message: "에이전트에게 보낼 메시지",
  tool: "도구",
  args: "인자",
  left: "검사할 값",
  operator: "조건",
  right: "비교할 값",
  output: "최종 출력",
};
// 화면 표시용으로 함께 저장하는 이름 (model_label 등). 비교하지 않고 값을 보여 줄 때만 쓴다
const DISPLAY_KEY: Record<string, string> = { model: "model_label", tool: "tool_label", agent_id: "agent_label" };

type Node = WorkflowGraph["nodes"][number];
type Edge = WorkflowGraph["edges"][number];

function text(value: unknown): string {
  if (value === undefined || value === null || value === "") return "";
  return typeof value === "string" ? value : JSON.stringify(value);
}

function shown(node: Node, key: string): string {
  const raw = text(node.data?.[key]);
  const display = DISPLAY_KEY[key] ? text(node.data?.[DISPLAY_KEY[key]]) : "";
  if (key === "model" && !raw) return "기본 모델";
  return display || raw || "(비어 있음)";
}

function title(node: Node): string {
  const meta = NODE_META[node.type];
  const detail = text(node.data?.tool_label) || text(node.data?.agent_label);
  return `${meta?.label ?? node.type}${detail ? ` · ${detail}` : ""}`;
}

function edgeKey(e: Edge): string {
  return `${e.source}→${e.target}:${e.sourceHandle ?? ""}`;
}

function edgeLabel(e: Edge): string {
  const branch = e.sourceHandle === "true" ? " (참)" : e.sourceHandle === "false" ? " (거짓)" : "";
  return `${e.source} → ${e.target}${branch}`;
}

export function diffGraphs(published: WorkflowGraph, current: WorkflowGraph): GraphDiff {
  const before = new Map(published.nodes.map((n) => [n.id, n]));
  const after = new Map(current.nodes.map((n) => [n.id, n]));
  const nodes: NodeChange[] = [];

  for (const node of current.nodes) {
    const old = before.get(node.id);
    if (!old) {
      nodes.push({ id: node.id, kind: node.type, title: title(node), change: "added", fields: [] });
      continue;
    }
    const keys = new Set([...Object.keys(old.data ?? {}), ...Object.keys(node.data ?? {})]);
    const fields: FieldChange[] = [];
    for (const key of keys) {
      if (key.endsWith("_label") || key.startsWith("_")) continue;
      if (text(old.data?.[key]) === text(node.data?.[key])) continue;
      fields.push({ key, label: FIELD_LABEL[key] ?? key, before: shown(old, key), after: shown(node, key) });
    }
    if (old.type !== node.type) fields.unshift({ key: "type", label: "종류", before: old.type, after: node.type });
    if (fields.length) nodes.push({ id: node.id, kind: node.type, title: title(node), change: "changed", fields });
  }
  for (const node of published.nodes) {
    if (!after.has(node.id)) {
      nodes.push({ id: node.id, kind: node.type, title: title(node), change: "removed", fields: [] });
    }
  }

  const oldEdges = new Map(published.edges.map((e) => [edgeKey(e), e]));
  const newEdges = new Map(current.edges.map((e) => [edgeKey(e), e]));
  const edges: EdgeChange[] = [
    ...[...newEdges].filter(([k]) => !oldEdges.has(k)).map(([k, e]) => ({ id: k, label: edgeLabel(e), change: "added" as const })),
    ...[...oldEdges].filter(([k]) => !newEdges.has(k)).map(([k, e]) => ({ id: k, label: edgeLabel(e), change: "removed" as const })),
  ];

  return { nodes, edges, count: nodes.length + edges.length };
}
