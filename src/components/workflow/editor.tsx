"use client";

import "@xyflow/react/dist/style.css";

import {
  addEdge,
  Background,
  BackgroundVariant,
  Controls,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Connection,
  type Edge,
} from "@xyflow/react";
import { cn } from "cn";
import { Braces, ChevronRight, Clock, Lock, LockOpen, Pencil, Play, Rocket, Square, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { FeedbackButtons } from "@/components/feedback-buttons";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { NodeConfig } from "@/components/workflow/node-config";
import { JsonDialog } from "@/components/workflow/json-dialog";
import { RunHistory } from "@/components/workflow/run-history";
import { SchedulePanel } from "@/components/workflow/schedule-panel";
import { DRAG_TYPE, NodePalette, type PaletteItem } from "@/components/workflow/node-palette";
import { nodeTypes, StatusIcon } from "@/components/workflow/nodes";
import { api, type Agent, type ModelOption, type Tool } from "@/lib/api/client";
import {
  fromFlow,
  NODE_META,
  nextNodeId,
  toFlow,
  variablesFor,
  type FlowNode,
  type NodeData,
  type NodeKind,
  type RunEvent,
  type RunStatus,
  type Workflow,
} from "@/lib/workflow";
import { nextRunLabel, scheduleLabel } from "@/lib/schedule";
import { useStoredFlag } from "@/lib/use-stored-flag";

type EditorProps = {
  workflow: Workflow;
  models: ModelOption[];
  defaultModel: string | null;
  tools: Tool[];
  agents: Agent[];
  /** 새로 만든 워크플로우면 이름 칸을 먼저 선택한다 */
  focusName?: boolean;
};

type Step = {
  id: string;
  status: RunStatus;
  output?: string;
  error?: string;
  startedAt?: number;
  ms?: number;
};
type RunState = {
  status: "idle" | "running" | "done" | "error";
  output?: string;
  errors?: string[];
};
type Panel = "config" | "run" | "history" | "schedule";

const TAKEN_EDGE = "#10b981";

function edgeFor(connection: Connection): Edge {
  return {
    ...connection,
    id: `${connection.source}-${connection.sourceHandle ?? "out"}-${connection.target}`,
  };
}

function snapshot(name: string, nodes: FlowNode[], edges: Edge[]): string {
  return JSON.stringify({ name, graph: fromFlow(nodes, edges) });
}

function Editor({ workflow, models, defaultModel, tools, agents, focusName }: EditorProps) {
  const router = useRouter();
  const { screenToFlowPosition } = useReactFlow();
  const initial = useMemo(() => toFlow(workflow.graph), [workflow.graph]);
  const [nodes, setNodes, onNodesChange] = useNodesState<FlowNode>(initial.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(initial.edges);
  const [name, setName] = useState(workflow.name);
  const [savedSnapshot, setSavedSnapshot] = useState(() => snapshot(workflow.name, initial.nodes, initial.edges));
  const [saving, setSaving] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // 오른쪽 패널은 노드를 고르거나 실행할 때만 연다
  const [panel, setPanel] = useState<Panel | null>(null);
  const [paletteCollapsed, setPaletteCollapsed] = useStoredFlag("workflow.paletteCollapsed");
  const [input, setInput] = useState("");
  const [run, setRun] = useState<RunState>({ status: "idle" });
  const [steps, setSteps] = useState<Step[]>([]);
  const [runId, setRunId] = useState<string | null>(null); // 평가를 남길 실행 ID
  const [runFeedback, setRunFeedback] = useState<number | null>(null);
  const [pastRunAt, setPastRunAt] = useState<string | null>(null); // 지난 실행을 보는 중이면 그 시각
  const [historyKey, setHistoryKey] = useState(0); // 실행이 끝나면 기록 목록을 다시 불러온다
  const [expanded, setExpanded] = useState<string | null>(null);
  const [schedule, setSchedule] = useState(workflow.schedule ?? null);
  const [nextRunAt, setNextRunAt] = useState(workflow.next_run_at ?? null);
  const [deleteProtected, setDeleteProtected] = useState(workflow.delete_protected ?? false);
  const [showJson, setShowJson] = useState(false);
  // 배포본: 외부 API·공개 링크는 이것만 실행한다 (편집본을 저장해도 바뀌지 않는다)
  const [publishedAt, setPublishedAt] = useState(workflow.published_at ?? null);
  const [unpublishedChanges, setUnpublishedChanges] = useState(workflow.has_unpublished_changes);
  const [publishing, setPublishing] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const dirty = snapshot(name, nodes, edges) !== savedSnapshot;
  const selected = nodes.find((n) => n.id === selectedId);
  const running = run.status === "running";
  const stepById = useMemo(() => new Map(steps.map((s) => [s.id, s])), [steps]);

  // 실행 상태는 저장 대상이 아니므로 노드/엣지 원본과 분리해 화면용으로만 입힌다
  const displayNodes = useMemo(
    () =>
      nodes.map((n) => {
        const step = stepById.get(n.id);
        return step
          ? {
              ...n,
              data: {
                ...n.data,
                _status: step.status,
                _output: step.output,
                _error: step.error,
              },
            }
          : n;
      }),
    [nodes, stepById],
  );
  const displayEdges = useMemo(() => {
    if (steps.length === 0) return edges;
    const typeById = new Map(nodes.map((n) => [n.id, n.type]));
    return edges.map((e) => {
      const source = stepById.get(e.source);
      const taken =
        source?.status === "done" && (typeById.get(e.source) !== "condition" || e.sourceHandle === source.output);
      if (!taken) return { ...e, style: { ...e.style, opacity: running ? 0.5 : 0.25 } };
      return {
        ...e,
        animated: stepById.get(e.target)?.status === "running",
        style: { ...e.style, stroke: TAKEN_EDGE, strokeWidth: 2 },
      };
    });
  }, [edges, nodes, steps.length, stepById, running]);

  const patchNode = (id: string, patch: NodeData) =>
    setNodes((ns) => ns.map((n) => (n.id === id ? { ...n, data: { ...n.data, ...patch } } : n)));

  const patchStep = (id: string, patch: Partial<Step>) =>
    setSteps((ss) =>
      ss.some((s) => s.id === id)
        ? ss.map((s) => (s.id === id ? { ...s, ...patch } : s))
        : [...ss, { id, status: "running", ...patch }],
    );

  const addNode = (item: PaletteItem, at?: { x: number; y: number }) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    const point = at ?? {
      x: (rect?.left ?? 0) + (rect?.width ?? 0) / 2,
      y: (rect?.top ?? 0) + (rect?.height ?? 0) / 2,
    };
    const position = screenToFlowPosition(point);
    setNodes((ns) => {
      const id = nextNodeId(item.kind, ns);
      // 가운데에 연달아 추가하면 겹치지 않게 조금씩 비킨다
      const offset = at ? 0 : (ns.length % 4) * 24;
      setSelectedId(id);
      return [
        ...ns.map((n) => ({ ...n, selected: false })),
        {
          id,
          type: item.kind,
          position: {
            x: position.x - 120 + offset,
            y: position.y - 40 + offset,
          },
          data: { ...NODE_META[item.kind].defaults, ...item.data },
          selected: true,
        },
      ];
    });
    setPanel("config");
  };

  const onDrop = (e: React.DragEvent) => {
    const raw = e.dataTransfer.getData(DRAG_TYPE);
    if (!raw) return;
    e.preventDefault();
    addNode(JSON.parse(raw) as PaletteItem, { x: e.clientX, y: e.clientY });
  };

  const save = async (): Promise<boolean> => {
    setSaving(true);
    const { error } = await api.PATCH("/api/v1/workflows/{workflow_id}", {
      params: { path: { workflow_id: workflow.id } },
      body: { name, graph: fromFlow(nodes, edges) },
    });
    setSaving(false);
    if (error) {
      setPanel("run");
      setRun({
        status: "error",
        errors: ["저장하지 못했습니다. 잠시 후 다시 시도하세요."],
      });
      return false;
    }
    setSavedSnapshot(snapshot(name, nodes, edges));
    if (publishedAt) setUnpublishedChanges(true);
    router.refresh();
    return true;
  };

  /** 저장한 편집본을 배포본으로. 저장 안 된 변경이 있으면 먼저 저장한다. */
  const publish = async () => {
    if (dirty && !(await save())) return;
    setPublishing(true);
    const { data, error } = await api.POST("/api/v1/workflows/{workflow_id}/publish", {
      params: { path: { workflow_id: workflow.id } },
    });
    setPublishing(false);
    if (error || !data) {
      const detail = (error as { detail?: unknown } | undefined)?.detail;
      toast.error("배포하지 못했습니다", {
        description: Array.isArray(detail) ? "실행 탭에서 고칠 곳을 확인하세요." : "잠시 후 다시 시도하세요.",
      });
      setPanel("run");
      setRun({
        status: "error",
        errors: Array.isArray(detail) ? detail.map(String) : ["배포하지 못했습니다. 잠시 후 다시 시도하세요."],
      });
      return;
    }
    const first = !publishedAt;
    setPublishedAt(data.published_at ?? null);
    setUnpublishedChanges(false);
    toast.success(first ? "배포했습니다" : "새 버전을 배포했습니다", {
      description: "외부 API·공개 링크가 지금 저장된 내용으로 실행됩니다. 목록 카드 메뉴 → '외부에서 쓰기'에서 연결하세요.",
    });
    router.refresh();
  };

  const toggleProtection = async () => {
    const next = !deleteProtected;
    setDeleteProtected(next);
    const { error } = await api.PATCH("/api/v1/workflows/{workflow_id}", {
      params: { path: { workflow_id: workflow.id } },
      body: { delete_protected: next },
    });
    if (error) setDeleteProtected(!next);
  };

  const remove = async () => {
    if (deleteProtected) return;
    if (!confirm(`'${name}' 워크플로우를 삭제할까요? 되돌릴 수 없습니다.`)) return;
    await api.DELETE("/api/v1/workflows/{workflow_id}", {
      params: { path: { workflow_id: workflow.id } },
    });
    router.push("/workflows");
    router.refresh();
  };

  const applyEvent = (event: RunEvent) => {
    switch (event.type) {
      case "node_start":
        patchStep(event.node_id, {
          status: "running",
          output: "",
          startedAt: performance.now(),
        });
        break;
      case "node_delta":
        setSteps((ss) =>
          ss.map((s) => (s.id === event.node_id ? { ...s, output: (s.output ?? "") + event.delta } : s)),
        );
        break;
      case "node_finish":
        setSteps((ss) =>
          ss.map((s) =>
            s.id === event.node_id
              ? {
                  ...s,
                  status: "done",
                  output: event.output,
                  ms: s.startedAt ? performance.now() - s.startedAt : undefined,
                }
              : s,
          ),
        );
        break;
      case "node_skip":
        patchStep(event.node_id, { status: "skipped" });
        break;
      case "node_error":
        patchStep(event.node_id, {
          status: "error",
          error: event.error,
          output: undefined,
        });
        setExpanded(event.node_id);
        setRun({
          status: "error",
          errors: [`${event.node_id} 노드에서 멈췄습니다: ${event.error}`],
        });
        break;
      case "run_start":
        setRunId(event.run_id ?? null);
        break;
      case "run_finish":
        setRun({ status: "done", output: event.output ?? "" });
        break;
    }
  };

  const showPastRun = async (id: string) => {
    const { data } = await api.GET("/api/v1/runs/{run_id}", { params: { path: { run_id: id } } });
    if (!data) return;
    const known = new Set(nodes.map((n) => n.id)); // 그 뒤 지운 노드는 빼고 보여 준다
    setSteps(
      data.steps
        .filter((s) => known.has(s.node_id))
        .map((s) => ({
          id: s.node_id,
          status: s.status as RunStatus,
          output: s.output ?? undefined,
          error: s.error ?? undefined,
        })),
    );
    setRun(
      data.status === "done"
        ? { status: "done", output: data.output ?? "" }
        : {
            status: "error",
            errors: [data.status === "error" ? (data.error ?? "실패한 실행입니다.") : "중간에 중지된 실행입니다."],
          },
    );
    setInput(data.input ?? "");
    setRunId(data.id);
    setRunFeedback(data.feedback ?? null);
    setPastRunAt(data.created_at);
    setExpanded(null);
    setPanel("run");
  };

  const clearPastRun = () => {
    setSteps([]);
    setRun({ status: "idle" });
    setRunId(null);
    setPastRunAt(null);
  };

  const execute = async () => {
    setPanel("run");
    if (dirty && !(await save())) return;
    setSteps([]);
    setRunId(null);
    setRunFeedback(null);
    setPastRunAt(null);
    setExpanded(null);
    setRun({ status: "running" });
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch(`/api/backend/workflows/${workflow.id}/run`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ input }),
        signal: controller.signal,
      });
      if (!response.ok || !response.body) {
        const detail = (await response.json().catch(() => null))?.detail;
        setRun({
          status: "error",
          errors: Array.isArray(detail) ? detail : [String(detail ?? "실행하지 못했습니다.")],
        });
        return;
      }

      const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
      let buffer = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += value;
        const chunks = buffer.split("\n\n");
        buffer = chunks.pop() ?? "";
        for (const chunk of chunks) {
          const data = chunk.replace(/^data: /, "").trim();
          if (data) applyEvent(JSON.parse(data) as RunEvent);
        }
      }
      setRun((r) =>
        r.status === "running"
          ? {
              status: "error",
              errors: ["서버 연결이 끊겨 실행이 중단되었습니다."],
            }
          : r,
      );
    } catch (e) {
      setRun({
        status: "error",
        errors: [controller.signal.aborted ? "실행을 중지했습니다." : String(e)],
      });
    } finally {
      abortRef.current = null;
      setHistoryKey((k) => k + 1);
    }
  };

  const nodeKind = (id: string) => nodes.find((n) => n.id === id)?.type as NodeKind | undefined;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex h-12 shrink-0 items-center gap-3 border-b px-4">
        <nav className="flex min-w-0 items-center gap-1 text-sm" aria-label="경로">
          <Link href="/workflows" className="text-muted-foreground hover:text-foreground shrink-0">
            워크플로우
          </Link>
          <ChevronRight className="text-muted-foreground size-4 shrink-0" />
          <label className="group/name hover:bg-muted focus-within:bg-muted flex min-w-0 cursor-text items-center gap-1 rounded-md px-1.5 py-1">
            <input
              value={name}
              autoFocus={focusName}
              onFocus={(e) => focusName && e.currentTarget.select()}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
              aria-label="워크플로우 이름"
              className="field-sizing-content max-w-80 min-w-12 truncate bg-transparent font-semibold outline-none"
            />
            <Pencil className="text-muted-foreground size-3.5 shrink-0 opacity-60 group-hover/name:opacity-100" />
          </label>
        </nav>
        <span className="text-muted-foreground flex shrink-0 items-center gap-1.5 text-xs">
          <span className={cn("size-1.5 rounded-full", dirty ? "bg-amber-500" : "bg-emerald-500")} />
          {saving ? "저장 중" : dirty ? "저장 안 됨" : "저장됨"}
        </span>
        <span
          className={cn(
            "flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 text-[11px]",
            !publishedAt
              ? "text-muted-foreground bg-muted"
              : dirty || unpublishedChanges
                ? "bg-amber-50 text-amber-800"
                : "bg-sky-50 text-sky-800",
          )}
          title="외부 API·공개 링크는 배포본만 실행합니다"
        >
          <Rocket className="size-3" />
          {!publishedAt ? "배포 전" : dirty || unpublishedChanges ? "배포본과 다름" : "배포됨"}
        </span>
        <span className="flex-1" />
        <button
          type="button"
          onClick={() => setPanel(panel === "schedule" ? null : "schedule")}
          aria-pressed={panel === "schedule"}
          title={schedule?.enabled && nextRunAt ? `다음 실행: ${nextRunLabel(nextRunAt)}` : "예약 실행 설정"}
          className={cn(
            "flex items-center gap-1.5 rounded-md px-2 py-1 text-xs",
            schedule?.enabled
              ? "bg-emerald-50 font-medium text-emerald-800 hover:bg-emerald-100"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
        >
          <Clock className="size-3.5" />
          {schedule?.enabled ? scheduleLabel(schedule) : "예약"}
        </button>
        <button
          type="button"
          onClick={() => setShowJson(true)}
          aria-label="JSON 보기"
          title="JSON 보기"
          className="text-muted-foreground hover:bg-muted hover:text-foreground rounded-md p-1.5"
        >
          <Braces className="size-4" />
        </button>
        <button
          type="button"
          onClick={toggleProtection}
          aria-pressed={deleteProtected}
          aria-label={deleteProtected ? "삭제 보호 풀기" : "삭제 보호 켜기"}
          title={deleteProtected ? "삭제 보호 중 (눌러서 풀기)" : "삭제 보호 켜기"}
          className={cn(
            "rounded-md p-1.5",
            deleteProtected
              ? "bg-amber-50 text-amber-700 hover:bg-amber-100"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
        >
          {deleteProtected ? <Lock className="size-4" /> : <LockOpen className="size-4" />}
        </button>
        <button
          type="button"
          onClick={remove}
          disabled={deleteProtected}
          aria-label="워크플로우 삭제"
          title={deleteProtected ? "삭제 보호 중에는 지울 수 없습니다" : "워크플로우 삭제"}
          className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md p-1.5 disabled:pointer-events-none disabled:opacity-30"
        >
          <Trash2 className="size-4" />
        </button>
        <Button variant="outline" size="sm" onClick={save} disabled={!dirty || saving || running}>
          저장
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={publish}
          disabled={publishing || saving || running || (Boolean(publishedAt) && !dirty && !unpublishedChanges)}
          title={dirty ? "저장하고 배포합니다" : "지금 저장된 내용을 외부 API·공개 링크에 반영합니다"}
        >
          <Rocket className="size-3.5" />
          {publishing ? "배포 중" : "배포"}
        </Button>
        {running ? (
          <Button size="sm" variant="outline" onClick={() => abortRef.current?.abort()}>
            <Square className="size-3 fill-current" />
            중지
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={() => {
              setPanel("run");
              // 패널이 그려진 뒤 입력 칸으로
              requestAnimationFrame(() => inputRef.current?.focus());
            }}
          >
            <Play className="size-3.5 fill-current" />
            실행
          </Button>
        )}
      </header>
      <JsonDialog
        open={showJson}
        onClose={() => setShowJson(false)}
        name={name}
        dirty={dirty}
        json={showJson ? JSON.stringify({ name, graph: fromFlow(nodes, edges) }, null, 2) : ""}
      />

      <div className="flex min-h-0 flex-1">
        <NodePalette
          agents={agents}
          collapsed={paletteCollapsed}
          disabled={running}
          onToggle={() => setPaletteCollapsed(!paletteCollapsed)}
          onAdd={(item) => addNode(item)}
        />
        <div
          ref={canvasRef}
          className="relative min-w-0 flex-1 bg-zinc-100/70"
          onDragOver={(e) => {
            if (e.dataTransfer.types.includes(DRAG_TYPE)) {
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
            }
          }}
          onDrop={onDrop}
        >
          <ReactFlow<FlowNode, Edge>
            nodes={displayNodes}
            edges={displayEdges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={(c) => setEdges((es) => addEdge(edgeFor(c), es))}
            isValidConnection={(c) => c.source !== c.target}
            onNodeClick={(_, node) => {
              setSelectedId(node.id);
              setPanel("config");
            }}
            onPaneClick={() => {
              setSelectedId(null);
              setPanel((p) => (p === "config" ? null : p));
            }}
            onNodesDelete={(deleted) => deleted.some((n) => n.id === selectedId) && setSelectedId(null)}
            nodesDraggable={!running}
            nodesConnectable={!running}
            defaultEdgeOptions={{ style: { strokeWidth: 1.5 } }}
            connectionLineStyle={{ strokeWidth: 1.5 }}
            fitView
            fitViewOptions={{ padding: 0.12, minZoom: 0.45, maxZoom: 1 }}
            minZoom={0.3}
            proOptions={{ hideAttribution: true }}
          >
            <Background variant={BackgroundVariant.Dots} gap={20} size={1.3} color="#c4c4cc" />
            <Controls showInteractive={false} position="bottom-left" />
          </ReactFlow>
        </div>

        {panel && (
          <aside className="bg-background flex w-[340px] shrink-0 flex-col border-l">
            <div className="flex items-center gap-1 border-b p-2" role="tablist">
              {(
                [
                  ["config", "설정"],
                  ["run", "실행"],
                  ["history", "기록"],
                  ["schedule", "예약"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  role="tab"
                  aria-selected={panel === value}
                  onClick={() => setPanel(value)}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-sm",
                    panel === value ? "bg-muted font-medium" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {label}
                  {value === "run" && run.status !== "idle" && (
                    <StatusIcon
                      status={run.status === "done" ? "done" : run.status === "error" ? "error" : "running"}
                      className="size-3.5"
                    />
                  )}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setPanel(null)}
                aria-label="패널 닫기"
                className="text-muted-foreground hover:bg-muted hover:text-foreground rounded-md p-1.5"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-4">
              {panel === "config" &&
                (selected ? (
                  <NodeConfig
                    key={selected.id}
                    node={selected}
                    variables={variablesFor(nodes, selected.id)}
                    models={models}
                    defaultModel={defaultModel}
                    tools={tools}
                    agents={agents}
                    onChange={(patch) => patchNode(selected.id, patch)}
                    onDelete={() => {
                      setNodes((ns) => ns.filter((n) => n.id !== selected.id));
                      setEdges((es) => es.filter((e) => e.source !== selected.id && e.target !== selected.id));
                      setSelectedId(null);
                    }}
                  />
                ) : (
                  <div className="text-muted-foreground flex flex-col gap-3 text-sm leading-relaxed">
                    <p className="text-foreground font-medium">노드를 선택하면 여기서 설정합니다.</p>
                    <ul className="flex list-disc flex-col gap-1.5 pl-4">
                      <li>왼쪽 목록에서 누르거나 캔버스로 끌어 노드를 추가합니다.</li>
                      <li>노드 오른쪽 점을 다음 노드 왼쪽 점으로 끌어 연결합니다.</li>
                      <li>노드나 연결선을 선택하고 Backspace 를 누르면 지워집니다.</li>
                    </ul>
                  </div>
                ))}

              {panel === "schedule" && (
                <SchedulePanel
                  workflowId={workflow.id}
                  schedule={schedule}
                  nextRunAt={nextRunAt}
                  hasTelegramNode={nodes.some((n) => n.type === "tool" && n.data.tool === "send_telegram")}
                  onSaved={(saved) => {
                    setSchedule(saved.schedule);
                    setNextRunAt(saved.nextRunAt);
                    router.refresh();
                  }}
                />
              )}

              {panel === "history" && (
                <RunHistory
                  workflowId={workflow.id}
                  refreshKey={historyKey}
                  activeId={pastRunAt ? runId : null}
                  onSelect={showPastRun}
                />
              )}

              {panel === "run" && (
                <>
                  {pastRunAt && (
                    <div className="bg-muted flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-xs">
                      <span>
                        {new Date(pastRunAt).toLocaleString("ko-KR", { dateStyle: "short", timeStyle: "short" })} 실행
                        결과를 보고 있습니다.
                      </span>
                      <button type="button" onClick={clearPastRun} className="font-medium hover:underline">
                        지우기
                      </button>
                    </div>
                  )}
                  <div className="flex flex-col gap-2">
                    <label htmlFor="run-input" className="text-xs font-medium">
                      입력
                    </label>
                    <Textarea
                      ref={inputRef}
                      id="run-input"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      rows={3}
                      placeholder="워크플로우에 넘길 내용"
                      className="min-h-0 text-sm"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && !running) execute();
                      }}
                    />
                    <span className="text-muted-foreground text-xs">
                      노드에서 <code className="bg-muted rounded px-1">{"{{input}}"}</code> 으로 씁니다. ⌘+Enter 로
                      실행.
                    </span>
                    {running ? (
                      <Button variant="outline" onClick={() => abortRef.current?.abort()}>
                        <Square className="size-3 fill-current" />
                        중지
                      </Button>
                    ) : (
                      <Button onClick={execute}>
                        <Play className="size-3.5 fill-current" />
                        {dirty ? "저장하고 실행" : "실행"}
                      </Button>
                    )}
                  </div>

                  {run.errors && (
                    <ul className="border-destructive/30 bg-destructive/5 text-destructive flex flex-col gap-1 rounded-lg border p-3 text-xs leading-relaxed">
                      {run.errors.map((e) => (
                        <li key={e}>{e}</li>
                      ))}
                    </ul>
                  )}

                  {steps.length > 0 && (
                    <ol className="flex flex-col">
                      {steps.map((step) => {
                        const kind = nodeKind(step.id);
                        const meta = kind ? NODE_META[kind] : undefined;
                        const Icon = meta?.icon;
                        const open = expanded === step.id;
                        const detail = step.error ?? step.output;
                        return (
                          <li
                            key={step.id}
                            className={cn("border-b last:border-b-0", step.status === "skipped" && "opacity-50")}
                          >
                            <button
                              type="button"
                              onClick={() => setExpanded(open ? null : step.id)}
                              disabled={!detail}
                              className="flex w-full items-center gap-2.5 py-2 text-left text-sm"
                            >
                              <StatusIcon status={step.status} />
                              {meta && Icon && (
                                <span className={cn("flex size-5 items-center justify-center rounded", meta.tile)}>
                                  <Icon className="size-3" />
                                </span>
                              )}
                              <span className="min-w-0 flex-1 truncate">
                                {meta?.label}
                                <span className="text-muted-foreground ml-1.5 font-mono text-xs">{step.id}</span>
                              </span>
                              <span className="text-muted-foreground font-mono text-xs tabular-nums">
                                {step.status === "skipped"
                                  ? "건너뜀"
                                  : step.ms !== undefined
                                    ? `${Math.round(step.ms)}ms`
                                    : ""}
                              </span>
                            </button>
                            {open && detail && (
                              <pre
                                className={cn(
                                  "mb-2 max-h-48 overflow-auto rounded-md p-2 text-xs leading-relaxed whitespace-pre-wrap",
                                  step.error ? "bg-destructive/5 text-destructive" : "bg-muted",
                                )}
                              >
                                {detail}
                              </pre>
                            )}
                          </li>
                        );
                      })}
                    </ol>
                  )}

                  {run.status === "done" && (
                    <div className="flex flex-col gap-2 rounded-lg border border-emerald-200 bg-emerald-50/50 p-3">
                      <span className="text-xs font-medium text-emerald-700">최종 출력</span>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{run.output || "(빈 출력)"}</p>
                      {runId && (
                        <div className="flex items-center justify-between gap-2 border-t border-emerald-200 pt-2">
                          <span className="text-muted-foreground text-xs">이 결과는 어땠나요?</span>
                          <FeedbackButtons key={runId} runId={runId} initial={runFeedback} />
                        </div>
                      )}
                    </div>
                  )}

                  {run.status === "idle" && (
                    <p className="text-muted-foreground text-sm">입력을 적고 실행하면 노드별 결과가 여기에 쌓입니다.</p>
                  )}
                </>
              )}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}

export function WorkflowEditor(props: EditorProps) {
  return (
    <ReactFlowProvider>
      <Editor {...props} />
    </ReactFlowProvider>
  );
}
