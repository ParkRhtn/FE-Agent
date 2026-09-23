import Link from "next/link";

import { NewThreadButton } from "@/components/new-thread-button";
import { buttonVariants } from "@/components/ui/button";
import { backend } from "@/lib/api/server";
import { modelLabel } from "@/lib/models";

export default async function AgentsPage() {
  const [{ data: agents = [] }, { data: models }] = await Promise.all([
    backend.GET("/api/v1/agents"),
    backend.GET("/api/v1/models"),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">에이전트</h1>
        <Link href="/agents/new" className={buttonVariants()}>
          + 새 에이전트
        </Link>
      </div>

      {agents.length === 0 && (
        <p className="text-muted-foreground rounded-lg border border-dashed p-8 text-center text-sm">
          아직 에이전트가 없습니다. 시스템 프롬프트와 도구를 골라 첫 에이전트를 만들어 보세요.
        </p>
      )}

      <ul className="grid gap-3 sm:grid-cols-2">
        {agents.map((agent) => (
          <li key={agent.id} className="flex flex-col gap-3 rounded-lg border p-4">
            <Link href={`/agents/${agent.id}`} className="flex flex-col gap-1 hover:underline">
              <span className="font-medium">{agent.name}</span>
              <span className="text-muted-foreground line-clamp-2 text-sm">
                {agent.description || agent.system_prompt}
              </span>
            </Link>
            <div className="text-muted-foreground flex flex-wrap gap-1 text-xs">
              <span className="bg-muted rounded px-1.5 py-0.5">{modelLabel(models?.options ?? [], agent.model) ?? "기본 모델"}</span>
              <span className="bg-muted rounded px-1.5 py-0.5">도구 {agent.tools.length}개</span>
            </div>
            <NewThreadButton agentId={agent.id} label="대화 시작" variant="outline" />
          </li>
        ))}
      </ul>
    </div>
  );
}
