import { cn } from "cn";

import { NewWorkflowButton } from "@/components/workflow/new-workflow-button";
import { canvasBg, WorkflowCard } from "@/components/workflow/workflow-card";
import { backend } from "@/lib/api/server";
import { NODE_META, type NodeKind } from "@/lib/workflow";

const STEP_KINDS: NodeKind[] = ["llm", "agent", "tool", "condition"];

function relativeTime(iso: string): string {
  const seconds = (new Date(iso).getTime() - Date.now()) / 1000;
  const rtf = new Intl.RelativeTimeFormat("ko", { numeric: "auto" });
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ];
  for (const [unit, size] of units) {
    if (Math.abs(seconds) >= size) return rtf.format(Math.round(seconds / size), unit);
  }
  return "방금";
}

export default async function WorkflowsPage() {
  const { data: workflows = [] } = await backend.GET("/api/v1/workflows");

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
        <div className="flex items-end justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-xl font-semibold">워크플로우</h1>
            <p className="text-muted-foreground text-sm">LLM, 에이전트, 도구, 조건을 이어 한 번에 실행합니다.</p>
          </div>
          <NewWorkflowButton />
        </div>

        {workflows.length === 0 ? (
          <div className={cn("flex flex-col items-center gap-3 rounded-xl border px-6 py-16 text-center", canvasBg)}>
            <div className="flex gap-1.5">
              {STEP_KINDS.map((k) => {
                const Icon = NODE_META[k].icon;
                return (
                  <span key={k} className={cn("flex size-9 items-center justify-center rounded-lg", NODE_META[k].tile)}>
                    <Icon className="size-4" />
                  </span>
                );
              })}
            </div>
            <p className="font-medium">아직 워크플로우가 없습니다</p>
            <p className="text-muted-foreground max-w-sm text-sm">
              새 워크플로우를 만들면 시작과 종료 노드가 놓인 캔버스가 열립니다. 그 사이에 단계를 추가해 연결하세요.
            </p>
            <NewWorkflowButton />
          </div>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {workflows.map((wf) => (
              <WorkflowCard key={wf.id} workflow={wf} updatedLabel={relativeTime(wf.updated_at)} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
