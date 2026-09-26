import { getToolOrDynamicToolName, isToolUIPart, type UIMessage } from "ai";
import { cn } from "cn";
import { ChevronRight, Wrench } from "lucide-react";
import { Streamdown } from "streamdown";

import { AgentAvatar } from "@/components/chat/agent-avatar";
import { FeedbackButtons } from "@/components/feedback-buttons";
import { MessageTime } from "@/components/message-time";
import { StatusIcon } from "@/components/workflow/nodes";
import type { RunStatus } from "@/lib/workflow";

type ToolPart = Extract<UIMessage["parts"][number], { toolCallId: string }>;
type AnswerMetadata = { runId?: string; feedback?: number | null; createdAt?: string };

const TOOL_STATE: Record<string, { label: string; status: RunStatus }> = {
  "input-streaming": { label: "준비 중", status: "running" },
  "input-available": { label: "실행 중", status: "running" },
  "output-available": { label: "완료", status: "done" },
  "output-error": { label: "오류", status: "error" },
};

function show(value: unknown) {
  return typeof value === "string" ? value : JSON.stringify(value, null, 2);
}

/** 도구 호출: 캔버스의 도구 노드와 같은 주황 아이콘. 누르면 입력과 결과를 펼친다. */
function ToolCallView({ part, label }: { part: ToolPart; label?: string }) {
  const state = TOOL_STATE["state" in part ? String(part.state) : ""] ?? { label: "", status: undefined };
  return (
    <details className="group rounded-lg border text-xs">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-2.5 py-1.5 [&::-webkit-details-marker]:hidden">
        <span className="flex size-5 items-center justify-center rounded bg-amber-50 text-amber-600">
          <Wrench className="size-3" />
        </span>
        <span className="font-medium">{label ?? getToolOrDynamicToolName(part)}</span>
        <StatusIcon status={state.status} className="size-3.5" />
        <span className="text-muted-foreground">{state.label}</span>
        <ChevronRight className="text-muted-foreground ml-auto size-3.5 transition-transform group-open:rotate-90" />
      </summary>
      <div className="flex flex-col gap-2 border-t px-2.5 py-2">
        <div className="flex flex-col gap-1">
          <span className="text-muted-foreground">입력</span>
          <pre className="bg-muted/60 overflow-x-auto rounded p-2 font-mono whitespace-pre-wrap">
            {show(part.input)}
          </pre>
        </div>
        {"output" in part && part.output !== undefined && (
          <div className="flex flex-col gap-1">
            <span className="text-muted-foreground">결과</span>
            <pre className="bg-muted/60 overflow-x-auto rounded p-2 font-mono whitespace-pre-wrap">
              {show(part.output)}
            </pre>
          </div>
        )}
        {"errorText" in part && part.errorText && <p className="text-destructive">{part.errorText}</p>}
      </div>
    </details>
  );
}

/**
 * 화면에 그릴 내용(글·도구 호출)이 있는지.
 * 답변 스트림은 시작 신호(start)에서 빈 답변 메시지를 먼저 만든다. 내용이 오기 전까지는 그리지 않고
 * "답변을 준비하는 중" 표시만 보여 준다 (아이콘이 두 개 뜨지 않게).
 */
export function hasVisibleParts(message: UIMessage): boolean {
  return message.parts.some((part) => (part.type === "text" && part.text.length > 0) || isToolUIPart(part));
}

export function MessageView({
  message,
  done = true,
  isAgent = false,
  toolLabels = {},
}: {
  message: UIMessage;
  done?: boolean;
  /** 만든 에이전트와의 대화인지 (아이콘이 다르다) */
  isAgent?: boolean;
  toolLabels?: Record<string, string>;
}) {
  const isUser = message.role === "user";
  const meta = (message.metadata ?? {}) as AnswerMetadata;

  if (isUser) {
    return (
      <div className="flex flex-col items-end gap-1">
        <div className="bg-muted max-w-[80%] rounded-2xl rounded-br-md px-4 py-2.5">
          {message.parts.map((part, i) =>
            part.type === "text" ? (
              <p key={i} className="text-sm leading-relaxed whitespace-pre-wrap">
                {part.text}
              </p>
            ) : null,
          )}
        </div>
        <MessageTime iso={meta.createdAt} className="px-1" />
      </div>
    );
  }

  return (
    <div className="flex gap-3">
      <AgentAvatar isAgent={isAgent} className="mt-0.5" />
      <div className={cn("flex min-w-0 flex-1 flex-col gap-2")}>
        {message.parts.map((part, i) => {
          if (part.type === "text") {
            // 답변은 마크다운으로 (스트리밍 중 닫히지 않은 ** 등도 자연스럽게)
            return (
              <Streamdown key={i} isAnimating={!done} className="text-sm leading-relaxed">
                {part.text}
              </Streamdown>
            );
          }
          if (isToolUIPart(part)) {
            return (
              <ToolCallView key={part.toolCallId} part={part} label={toolLabels[getToolOrDynamicToolName(part)]} />
            );
          }
          return null;
        })}
        {done && (meta.runId || meta.createdAt) && (
          <div className="flex items-center gap-2">
            {/* 실행 ID 가 있는 답변만 평가할 수 있다 (예전 대화에는 없다) */}
            {meta.runId && (
              <FeedbackButtons key={meta.runId} runId={meta.runId} initial={meta.feedback} className="-ml-1" />
            )}
            <MessageTime iso={meta.createdAt} />
          </div>
        )}
      </div>
    </div>
  );
}
