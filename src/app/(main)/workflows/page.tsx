import { cn } from "cn";
import Link from "next/link";

import { NewWorkflowButton } from "@/components/workflow/new-workflow-button";
import { backend } from "@/lib/api/server";
import { NODE_META, type NodeKind } from "@/lib/workflow";

const STEP_KINDS: NodeKind[] = ["llm", "agent", "tool", "condition"];

export default async function WorkflowsPage() {
  const { data: workflows = [] } = await backend.GET("/api/v1/workflows");

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-6">
      <div className="flex items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold">워크플로우</h1>
          <p className="text-muted-foreground text-sm">LLM, 에이전트, 도구, 조건을 이어 한 번에 실행합니다.</p>
        </div>
        <NewWorkflowButton />
      </div>

      {workflows.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed px-6 py-12 text-center">
          <div className="flex gap-1.5">
            {STEP_KINDS.map((k) => {
              const Icon = NODE_META[k].icon;
              return (
                <span key={k} className={cn("flex size-8 items-center justify-center rounded-lg", NODE_META[k].tile)}>
                  <Icon className="size-4" />
                </span>
              );
            })}
          </div>
          <p className="text-sm">아직 워크플로우가 없습니다.</p>
          <p className="text-muted-foreground max-w-sm text-sm">
            새 워크플로우를 만들면 시작과 종료 노드가 놓인 캔버스가 열립니다. 그 사이에 단계를 추가해 연결하세요.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col divide-y rounded-xl border">
          {workflows.map((wf) => {
            const counts = STEP_KINDS.map((k) => [k, wf.graph.nodes.filter((n) => n.type === k).length] as const).filter(
              ([, c]) => c > 0,
            );
            return (
              <li key={wf.id}>
                <Link href={`/workflows/${wf.id}`} className="hover:bg-muted/50 flex items-center gap-4 px-4 py-3.5">
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="truncate font-medium">{wf.name}</span>
                    <span className="text-muted-foreground text-xs">
                      {new Date(wf.updated_at).toLocaleString("ko-KR", { dateStyle: "medium", timeStyle: "short" })} 수정
                    </span>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    {counts.length === 0 && <span className="text-muted-foreground text-xs">단계 없음</span>}
                    {counts.map(([k, c]) => {
                      const Icon = NODE_META[k].icon;
                      return (
                        <span
                          key={k}
                          title={`${NODE_META[k].label} ${c}개`}
                          className={cn("flex items-center gap-1 rounded-md px-1.5 py-1 text-xs", NODE_META[k].tile)}
                        >
                          <Icon className="size-3.5" />
                          {c}
                        </span>
                      );
                    })}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
