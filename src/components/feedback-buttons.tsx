"use client";

import { cn } from "cn";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import { useState } from "react";

import { api } from "@/lib/api/client";

type Value = 1 | -1;

/** 답변·실행 결과 평가. 누르면 저장되고 Langfuse 기록에 점수로 붙는다. 다른 쪽을 누르면 바뀐다. */
export function FeedbackButtons({
  runId,
  initial,
  className,
}: {
  runId: string;
  initial?: number | null;
  className?: string;
}) {
  const [value, setValue] = useState<Value | null>(initial === 1 || initial === -1 ? initial : null);
  const [failed, setFailed] = useState(false);

  const send = async (next: Value) => {
    if (next === value) return;
    const previous = value;
    setValue(next);
    setFailed(false);
    const { error } = await api.PUT("/api/v1/runs/{run_id}/feedback", {
      params: { path: { run_id: runId } },
      body: { value: next },
    });
    if (error) {
      setValue(previous);
      setFailed(true);
    }
  };

  const button = (target: Value, label: string, Icon: typeof ThumbsUp) => (
    <button
      type="button"
      onClick={() => send(target)}
      aria-label={label}
      aria-pressed={value === target}
      title={label}
      className={cn(
        "focus-visible:ring-ring/50 rounded-md p-1 outline-none transition-colors focus-visible:ring-3",
        value === target
          ? target === 1
            ? "bg-emerald-50 text-emerald-600"
            : "bg-rose-50 text-rose-600"
          : "text-muted-foreground/70 hover:bg-muted hover:text-foreground",
      )}
    >
      <Icon className={cn("size-3.5", value === target && "fill-current")} />
    </button>
  );

  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      {button(1, "좋은 답변", ThumbsUp)}
      {button(-1, "아쉬운 답변", ThumbsDown)}
      {failed && <span className="text-destructive ml-1 text-xs">저장하지 못했습니다</span>}
    </div>
  );
}
