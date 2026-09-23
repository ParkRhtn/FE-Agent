import type { UIMessage } from "ai";
import { notFound } from "next/navigation";

import { Chat } from "@/components/chat/chat";
import { backend } from "@/lib/api/server";

export default async function ChatPage({ params }: PageProps<"/chat/[id]">) {
  const { id } = await params;
  const path = { params: { path: { thread_id: id } } };

  const [thread, messages, models] = await Promise.all([
    backend.GET("/api/v1/threads/{thread_id}", path),
    backend.GET("/api/v1/threads/{thread_id}/messages", path),
    backend.GET("/api/v1/models"),
  ]);
  if (!thread.data) notFound();

  const agentId = thread.data.agent_id;
  const agent = agentId
    ? (await backend.GET("/api/v1/agents/{agent_id}", { params: { path: { agent_id: agentId } } })).data
    : undefined;

  return (
    <Chat
      threadId={id}
      initialMessages={(messages.data ?? []) as UIMessage[]}
      initialModel={thread.data.model ?? agent?.model ?? models.data?.default ?? ""}
      agent={agent ? { id: agent.id, name: agent.name } : undefined}
      models={models.data?.allowed ?? []}
    />
  );
}
