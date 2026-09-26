import { SquarePen } from "lucide-react";
import Link from "next/link";
import { unstable_rethrow } from "next/navigation";

import { AgentList } from "@/components/chat/agent-list";
import { NewAgentButton } from "@/components/chat/new-agent-button";
import { ThreadList } from "@/components/chat/thread-list";
import { backend } from "@/lib/api/server";

/** 대화 화면 왼쪽: 위에는 에이전트(누르면 새 대화), 아래에는 최근 대화 */
export async function Sidebar() {
  const [threads, agents, tools] = await Promise.all([
    backend.GET("/api/v1/threads"),
    backend.GET("/api/v1/agents"),
    backend.GET("/api/v1/tools"),
  ]).catch((e: unknown) => {
    unstable_rethrow(e); // 401 → redirect 는 그대로 전파
    return [{ data: undefined, error: e }, { data: undefined }, { data: undefined }] as const;
  });
  const agentNames = Object.fromEntries((agents.data ?? []).map((a) => [a.id, a.name]));

  return (
    <aside className="bg-background flex w-64 shrink-0 flex-col border-r">
      <div className="flex h-12 shrink-0 items-center justify-between border-b pr-2 pl-4">
        <h2 className="text-sm font-semibold">에이전트</h2>
        <Link
          href="/chat"
          aria-label="새 대화"
          title="새 대화"
          className="text-muted-foreground hover:bg-muted hover:text-foreground rounded-md p-1.5"
        >
          <SquarePen className="size-4" />
        </Link>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        <section className="flex flex-col gap-0.5 pb-3">
          <h3 className="text-muted-foreground px-2 pt-1 pb-1.5 text-xs font-medium">에이전트</h3>
          <AgentList agents={agents.data ?? []} />
          <NewAgentButton toolNames={(tools.data ?? []).map((t) => t.name)} />
        </section>
        <section className="flex flex-col gap-0.5 border-t pt-3">
          <h3 className="text-muted-foreground px-2 pb-1.5 text-xs font-medium">최근 대화</h3>
          {"error" in threads && threads.error ? (
            <p className="text-destructive p-2 text-xs">백엔드에 연결할 수 없습니다.</p>
          ) : (
            <ThreadList threads={threads.data ?? []} agentNames={agentNames} />
          )}
        </section>
      </div>
    </aside>
  );
}
