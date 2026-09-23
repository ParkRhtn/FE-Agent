import type { UIMessage } from "ai";
import { notFound } from "next/navigation";

import { Chat } from "@/components/chat/chat";
import { backend } from "@/lib/api/server";

/** 저장된 모델이 지금은 없을 수 있으니, 쓸 수 있는 것 중 처음 맞는 것을 고른다 */
function pickModel(options: { id: string }[], candidates: (string | null | undefined)[]): string {
  return candidates.find((c) => c && options.some((o) => o.id === c)) ?? options[0]?.id ?? "";
}

export default async function ChatPage({ params, searchParams }: PageProps<"/chat/[id]">) {
  const { id } = await params;
  const openSettings = (await searchParams).settings === "1";
  const path = { params: { path: { thread_id: id } } };

  const [thread, messages, models, tools] = await Promise.all([
    backend.GET("/api/v1/threads/{thread_id}", path),
    backend.GET("/api/v1/threads/{thread_id}/messages", path),
    backend.GET("/api/v1/models"),
    backend.GET("/api/v1/tools"),
  ]);
  if (!thread.data) notFound();
  const options = models.data?.options ?? [];

  const agentId = thread.data.agent_id;
  const agent = agentId
    ? (await backend.GET("/api/v1/agents/{agent_id}", { params: { path: { agent_id: agentId } } })).data
    : undefined;

  return (
    <Chat
      threadId={id}
      initialMessages={(messages.data ?? []) as UIMessage[]}
      initialModel={pickModel(options, [thread.data.model, agent?.model, models.data?.default])}
      agent={agent}
      models={options}
      tools={tools.data ?? []}
      openSettings={openSettings}
    />
  );
}
