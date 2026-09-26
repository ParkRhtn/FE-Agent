import type { Edge, Node } from "@xyflow/react";
import { Bot, Flag, Play, Sparkles, Split, Wrench, type LucideIcon } from "lucide-react";

import type { components } from "@/lib/api/schema";

export type WorkflowGraph = components["schemas"]["WorkflowGraph"];
export type Workflow = components["schemas"]["WorkflowRead"];
export type NodeKind = components["schemas"]["WorkflowNode"]["type"];

/** 실행 중에만 쓰는 화면 상태. 저장할 때는 빠진다. */
export type RunStatus = "running" | "done" | "skipped" | "error";

export type NodeData = Record<string, unknown> & {
  _status?: RunStatus;
  _output?: string;
  _error?: string;
  _diff?: "added" | "changed"; // 배포본과 비교 중일 때 표시
};
export type FlowNode = Node<NodeData, NodeKind>;

type NodeMeta = {
  label: string;
  hint: string;
  icon: LucideIcon;
  /** 아이콘 타일 (배경 + 글자색) */
  tile: string;
  /** 연결점·실행 경로 색 */
  accent: string;
  defaults: NodeData;
};

export const NODE_META: Record<NodeKind, NodeMeta> = {
  start: {
    label: "시작",
    hint: "사용자 입력을 {{input}} 으로 넘깁니다",
    icon: Play,
    tile: "bg-emerald-50 text-emerald-600",
    accent: "#10b981",
    defaults: {},
  },
  llm: {
    label: "LLM",
    hint: "프롬프트로 모델을 호출합니다",
    icon: Sparkles,
    tile: "bg-violet-50 text-violet-600",
    accent: "#8b5cf6",
    defaults: { prompt: "{{input}}", model: "", system: "" },
  },
  agent: {
    label: "에이전트",
    hint: "만들어 둔 에이전트에게 맡깁니다",
    icon: Bot,
    tile: "bg-sky-50 text-sky-600",
    accent: "#0ea5e9",
    defaults: { message: "{{input}}" },
  },
  tool: {
    label: "도구",
    hint: "도구 하나를 직접 호출합니다",
    icon: Wrench,
    tile: "bg-amber-50 text-amber-600",
    accent: "#f59e0b",
    defaults: { tool: "", args: "{}" },
  },
  condition: {
    label: "조건",
    hint: "값을 검사해 참/거짓으로 나눕니다",
    icon: Split,
    tile: "bg-rose-50 text-rose-600",
    accent: "#f43f5e",
    defaults: { left: "{{input}}", operator: "contains", right: "" },
  },
  end: {
    label: "종료",
    hint: "최종 출력을 정합니다",
    icon: Flag,
    tile: "bg-zinc-100 text-zinc-600",
    accent: "#71717a",
    defaults: { output: "" },
  },
};

export const ADDABLE_KINDS: NodeKind[] = ["llm", "agent", "tool", "condition", "end"];

export const CONDITION_OPERATORS: { value: string; label: string; needsRight: boolean }[] = [
  { value: "contains", label: "포함", needsRight: true },
  { value: "not_contains", label: "포함 안 함", needsRight: true },
  { value: "equals", label: "같음", needsRight: true },
  { value: "not_equals", label: "다름", needsRight: true },
  { value: "not_empty", label: "비어있지 않음", needsRight: false },
  { value: "is_empty", label: "비어있음", needsRight: false },
];

export function nextNodeId(kind: NodeKind, nodes: FlowNode[]): string {
  const used = new Set(nodes.map((n) => n.id));
  let i = 1;
  while (used.has(`${kind}_${i}`)) i++;
  return `${kind}_${i}`;
}

export function toFlow(graph: WorkflowGraph): { nodes: FlowNode[]; edges: Edge[] } {
  return {
    nodes: graph.nodes.map((n) => ({
      id: n.id,
      type: n.type,
      position: n.position,
      data: (n.data ?? {}) as NodeData,
      deletable: n.type !== "start",
    })),
    edges: graph.edges.map((e) => ({ ...e, sourceHandle: e.sourceHandle ?? undefined })),
  };
}

export function fromFlow(nodes: FlowNode[], edges: Edge[]): WorkflowGraph {
  return {
    nodes: nodes.map((n) => ({
      id: n.id,
      type: n.type as NodeKind,
      position: { x: Math.round(n.position.x), y: Math.round(n.position.y) },
      data: Object.fromEntries(Object.entries(n.data).filter(([k]) => !k.startsWith("_"))),
    })),
    edges: edges.map((e) => ({ id: e.id, source: e.source, target: e.target, sourceHandle: e.sourceHandle ?? null })),
  };
}

/** 노드 설정에서 참조할 수 있는 변수 이름 */
export function variablesFor(nodes: FlowNode[], selfId: string): string[] {
  const producers = nodes.filter((n) => n.id !== selfId && ["llm", "agent", "tool"].includes(n.type as string));
  return ["input", ...producers.map((n) => n.id)];
}

export type RunEvent =
  | { type: "run_start"; run_id?: string }
  | { type: "run_finish"; output?: string }
  | { type: "node_start" | "node_skip"; node_id: string }
  | { type: "node_delta"; node_id: string; delta: string }
  | { type: "node_finish"; node_id: string; output: string }
  | { type: "node_error"; node_id: string; error: string };
