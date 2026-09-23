"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { cn } from "cn";
import { Check, LoaderCircle, Minus, X } from "lucide-react";

import { CONDITION_OPERATORS, NODE_META, type FlowNode, type NodeKind, type RunStatus } from "@/lib/workflow";

/** `{{변수}}` 를 알약 모양으로 보여준다 */
export function TemplateText({ text }: { text: string }) {
  return text.split(/(\{\{\s*[\w-]+\s*\}\})/).map((part, i) =>
    /^\{\{/.test(part) ? (
      <span key={i} className="bg-muted text-foreground mx-px rounded px-1 py-px font-mono text-[11px]">
        {part.replace(/[{}\s]/g, "")}
      </span>
    ) : (
      part
    ),
  );
}

export function StatusIcon({ status, className }: { status?: RunStatus; className?: string }) {
  switch (status) {
    case "running":
      return <LoaderCircle className={cn("size-4 animate-spin text-sky-500", className)} aria-label="실행 중" />;
    case "done":
      return (
        <span className={cn("flex size-4 items-center justify-center rounded-full bg-emerald-500", className)}>
          <Check className="size-3 text-white" strokeWidth={3} aria-label="완료" />
        </span>
      );
    case "error":
      return (
        <span className={cn("bg-destructive flex size-4 items-center justify-center rounded-full", className)}>
          <X className="size-3 text-white" strokeWidth={3} aria-label="오류" />
        </span>
      );
    case "skipped":
      return <Minus className={cn("text-muted-foreground size-4", className)} aria-label="건너뜀" />;
    default:
      return null;
  }
}

function str(data: FlowNode["data"], key: string): string {
  return typeof data[key] === "string" ? (data[key] as string) : "";
}

function Summary({ kind, data }: { kind: NodeKind; data: FlowNode["data"] }) {
  const placeholder = (text: string) => <span className="text-muted-foreground/70 italic">{text}</span>;
  switch (kind) {
    case "start":
      return <>사용자 입력으로 시작합니다</>;
    case "llm":
      return str(data, "prompt") ? <TemplateText text={str(data, "prompt")} /> : placeholder("프롬프트를 입력하세요");
    case "agent":
      return str(data, "agent_name") ? (
        <span className="text-foreground font-medium">{str(data, "agent_name")}</span>
      ) : (
        placeholder("에이전트를 선택하세요")
      );
    case "tool":
      return str(data, "tool") ? (
        <span className="text-foreground font-mono">{str(data, "tool")}</span>
      ) : (
        placeholder("도구를 선택하세요")
      );
    case "condition": {
      const op = CONDITION_OPERATORS.find((o) => o.value === (str(data, "operator") || "contains"));
      return (
        <>
          <TemplateText text={str(data, "left") || "{{input}}"} /> {op?.label}
          {op?.needsRight && (
            <>
              {" "}
              <span className="text-foreground">“{str(data, "right")}”</span>
            </>
          )}
        </>
      );
    }
    case "end":
      return str(data, "output") ? <TemplateText text={str(data, "output")} /> : <>들어온 값을 그대로 출력합니다</>;
  }
}

const handleClass = "!size-3 !border-2 !border-background";

function WorkflowNodeView({ id, type, data, selected }: NodeProps<FlowNode>) {
  const kind = type as NodeKind;
  const meta = NODE_META[kind];
  const Icon = meta.icon;
  // 조건 노드는 "true"/"false" 대신 선택된 갈래를 강조한다
  const showOutput = data._output !== undefined && data._status !== "skipped" && kind !== "condition";
  const takenBranch = kind === "condition" && data._status === "done" ? data._output : undefined;

  return (
    <div
      className={cn(
        "bg-background w-[260px] rounded-xl border shadow-[0_1px_3px_rgb(0_0_0/0.06)] transition-[opacity,box-shadow]",
        selected && "border-foreground/30 ring-foreground/5 ring-4",
        data._status === "skipped" && "opacity-45",
        data._status === "error" && "border-destructive/50",
      )}
    >
      {kind !== "start" && (
        <Handle type="target" position={Position.Left} className={handleClass} style={{ background: meta.accent }} />
      )}

      <div className="flex items-center gap-2.5 px-3 pt-3">
        <span className={cn("flex size-7 shrink-0 items-center justify-center rounded-lg", meta.tile)}>
          <Icon className="size-4" />
        </span>
        <div className="flex min-w-0 flex-col leading-tight">
          <span className="text-[13px] font-semibold">{meta.label}</span>
          <span className="text-muted-foreground truncate font-mono text-[11px]">{id}</span>
        </div>
        <StatusIcon status={data._status} className="ml-auto" />
      </div>

      <p className="text-muted-foreground line-clamp-3 px-3 pt-2 pb-3 text-xs leading-relaxed break-words">
        <Summary kind={kind} data={data} />
      </p>

      {kind === "llm" && (
        <div className="-mt-1.5 px-3 pb-3">
          <span className="rounded bg-violet-50 px-1.5 py-0.5 text-[11px] text-violet-700">
            {str(data, "model_label") || "기본 모델"}
          </span>
        </div>
      )}

      {showOutput && (
        <p className="bg-muted/70 mx-3 mb-3 line-clamp-2 rounded-md px-2 py-1.5 text-[11px] leading-relaxed break-words">
          {data._output || <span className="text-muted-foreground">…</span>}
        </p>
      )}
      {data._error && (
        <p className="bg-destructive/10 text-destructive mx-3 mb-3 line-clamp-3 rounded-md px-2 py-1.5 text-[11px]">
          {data._error}
        </p>
      )}

      {kind === "condition" ? (
        <div className="border-t text-xs">
          {(["true", "false"] as const).map((branch) => (
            <div
              key={branch}
              className={cn(
                "relative flex items-center justify-end gap-1.5 px-3 py-1.5 last:rounded-b-xl",
                takenBranch === branch && (branch === "true" ? "bg-emerald-50 font-medium" : "bg-rose-50 font-medium"),
                takenBranch && takenBranch !== branch && "opacity-40",
              )}
            >
              <span className={branch === "true" ? "text-emerald-600" : "text-rose-600"}>
                {branch === "true" ? "참" : "거짓"}
              </span>
              <Handle
                type="source"
                id={branch}
                position={Position.Right}
                className={handleClass}
                style={{ background: branch === "true" ? "#10b981" : "#f43f5e" }}
              />
            </div>
          ))}
        </div>
      ) : (
        kind !== "end" && (
          <Handle type="source" position={Position.Right} className={handleClass} style={{ background: meta.accent }} />
        )
      )}
    </div>
  );
}

export const nodeTypes = Object.fromEntries(
  (Object.keys(NODE_META) as NodeKind[]).map((kind) => [kind, WorkflowNodeView]),
);
