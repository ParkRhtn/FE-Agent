import Link from "next/link";
import { unstable_rethrow } from "next/navigation";

import { NewThreadButton } from "@/components/new-thread-button";
import { backend } from "@/lib/api/server";

export default async function Home() {
  const { data: agents = [] } = await backend.GET("/api/v1/agents").catch((e: unknown) => {
    unstable_rethrow(e);
    return { data: undefined };
  });

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-2xl font-semibold">무엇을 도와드릴까요?</h1>
      <p className="text-muted-foreground text-sm">새 대화를 시작하거나 왼쪽에서 이전 대화를 선택하세요.</p>
      <div className="flex flex-wrap justify-center gap-2">
        <NewThreadButton />
        {agents.map((agent) => (
          <NewThreadButton key={agent.id} agentId={agent.id} label={agent.name} variant="outline" />
        ))}
      </div>
      <Link href="/agents" className="text-muted-foreground text-sm hover:underline">
        에이전트 만들기 / 관리 →
      </Link>
    </div>
  );
}
