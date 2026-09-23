import { unstable_rethrow } from "next/navigation";

import { NewAgentButton } from "@/components/chat/new-agent-button";
import { StartChatCard } from "@/components/chat/start-chat-card";
import { backend } from "@/lib/api/server";

export default async function ChatHome() {
  const [{ data: agents = [] }, { data: tools = [] }] = await Promise.all([
    backend.GET("/api/v1/agents"),
    backend.GET("/api/v1/tools"),
  ]).catch((e: unknown) => {
    unstable_rethrow(e);
    return [{ data: undefined }, { data: undefined }] as const;
  });

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-16">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold">누구와 대화할까요?</h1>
          <p className="text-muted-foreground text-sm">
            에이전트를 고르면 그 지시사항과 도구로 답합니다. 새 에이전트는 만들면서 바로 대화로 시험할 수 있습니다.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <StartChatCard name="기본 에이전트" description="특별한 지시 없이, 연결된 모든 도구를 쓰는 범용 조수" />
          {agents.map((agent) => (
            <StartChatCard
              key={agent.id}
              agentId={agent.id}
              name={agent.name}
              description={agent.description || agent.system_prompt}
            />
          ))}
        </div>
        <NewAgentButton
          toolNames={tools.map((t) => t.name)}
          className="hover:bg-muted/60 text-muted-foreground hover:text-foreground flex items-center gap-2.5 self-start rounded-md px-2 py-1.5 text-sm"
        />
      </div>
    </div>
  );
}
