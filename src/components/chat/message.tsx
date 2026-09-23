import { getToolOrDynamicToolName, isToolUIPart, type UIMessage } from "ai";

import { cn } from "@/lib/utils";

type ToolPart = Extract<UIMessage["parts"][number], { toolCallId: string }>;

const TOOL_STATE_LABEL: Record<string, string> = {
  "input-streaming": "입력 생성 중",
  "input-available": "실행 중",
  "output-available": "완료",
  "output-error": "오류",
};

function ToolCallView({ part }: { part: ToolPart }) {
  const state = "state" in part ? String(part.state) : "";
  return (
    <details className="bg-muted/50 rounded-md border text-xs">
      <summary className="cursor-pointer px-3 py-2 font-mono">
        🔧 {getToolOrDynamicToolName(part)}{" "}
        <span className="text-muted-foreground">· {TOOL_STATE_LABEL[state] ?? state}</span>
      </summary>
      <div className="space-y-2 border-t px-3 py-2 font-mono">
        <pre className="overflow-x-auto whitespace-pre-wrap">입력: {JSON.stringify(part.input, null, 2)}</pre>
        {"output" in part && part.output !== undefined && (
          <pre className="overflow-x-auto whitespace-pre-wrap">결과: {JSON.stringify(part.output, null, 2)}</pre>
        )}
        {"errorText" in part && part.errorText && <p className="text-destructive">{part.errorText}</p>}
      </div>
    </details>
  );
}

export function MessageView({ message }: { message: UIMessage }) {
  const isUser = message.role === "user";
  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "flex max-w-[85%] flex-col gap-2",
          isUser && "bg-primary text-primary-foreground rounded-2xl px-4 py-2",
        )}
      >
        {message.parts.map((part, i) => {
          if (part.type === "text") {
            return (
              <p key={i} className="text-sm leading-relaxed whitespace-pre-wrap">
                {part.text}
              </p>
            );
          }
          if (isToolUIPart(part)) {
            return <ToolCallView key={part.toolCallId} part={part} />;
          }
          return null;
        })}
      </div>
    </div>
  );
}
