"use client";

import { ThumbsDown, ThumbsUp } from "lucide-react";
import { useEffect, useState } from "react";

import { StatusIcon } from "@/components/workflow/nodes";
import { api } from "@/lib/api/client";
import type { components } from "@/lib/api/schema";
import type { RunStatus } from "@/lib/workflow";

export type RunSummary = components["schemas"]["RunSummary"];

const STATUS: Record<string, { icon: RunStatus; label: string }> = {
  done: { icon: "done", label: "완료" },
  error: { icon: "error", label: "오류" },
  running: { icon: "running", label: "실행 중" },
  cancelled: { icon: "skipped", label: "중지됨" },
};

function when(iso: string) {
  return new Date(iso).toLocaleString("ko-KR", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function duration(run: RunSummary) {
  if (!run.finished_at) return null;
  const ms = new Date(run.finished_at).getTime() - new Date(run.created_at).getTime();
  return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}초`;
}

/** 지난 실행 목록. 누르면 그때의 노드 상태와 결과를 편집기에 다시 띄운다. */
export function RunHistory({
  workflowId,
  refreshKey,
  activeId,
  onSelect,
}: {
  workflowId: string;
  refreshKey: number;
  activeId: string | null;
  onSelect: (runId: string) => void;
}) {
  const [runs, setRuns] = useState<RunSummary[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .GET("/api/v1/workflows/{workflow_id}/runs", { params: { path: { workflow_id: workflowId } } })
      .then(({ data, error }) => {
        if (cancelled) return;
        setFailed(Boolean(error));
        setRuns(data ?? []);
      });
    return () => {
      cancelled = true;
    };
  }, [workflowId, refreshKey]);

  if (failed) return <p className="text-destructive text-sm">실행 기록을 불러오지 못했습니다.</p>;
  if (runs === null) return <p className="text-muted-foreground text-sm">불러오는 중…</p>;
  if (runs.length === 0) {
    return <p className="text-muted-foreground text-sm">아직 실행한 적이 없습니다. 실행하면 여기에 쌓입니다.</p>;
  }

  return (
    <ol className="-mx-1 flex flex-col">
      {runs.map((run) => {
        const status = STATUS[run.status ?? ""] ?? STATUS.cancelled;
        const took = duration(run);
        return (
          <li key={run.id}>
            <button
              type="button"
              onClick={() => onSelect(run.id)}
              aria-current={activeId === run.id ? "true" : undefined}
              className="hover:bg-muted aria-[current]:bg-muted flex w-full flex-col gap-1 rounded-lg px-2 py-2 text-left"
            >
              <span className="flex items-center gap-2 text-xs">
                <StatusIcon status={status.icon} className="size-3.5" />
                <span className="font-medium">{status.label}</span>
                <span className="text-muted-foreground">{when(run.created_at)}</span>
                {took && <span className="text-muted-foreground tabular-nums">{took}</span>}
                {run.feedback === 1 && <ThumbsUp className="ml-auto size-3.5 fill-current text-emerald-600" />}
                {run.feedback === -1 && <ThumbsDown className="ml-auto size-3.5 fill-current text-rose-600" />}
              </span>
              <span className="line-clamp-2 text-sm break-words">{run.input || "(입력 없음)"}</span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
