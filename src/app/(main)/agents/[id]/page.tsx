import { notFound } from "next/navigation";

import { AgentForm } from "@/components/agents/agent-form";
import { backend } from "@/lib/api/server";

export default async function AgentPage({ params }: PageProps<"/agents/[id]">) {
  const { id } = await params;

  const [agent, models, tools] = await Promise.all([
    backend.GET("/api/v1/agents/{agent_id}", { params: { path: { agent_id: id } } }),
    backend.GET("/api/v1/models"),
    backend.GET("/api/v1/tools"),
  ]);
  if (!agent.data) notFound();

  return (
    <AgentForm
      key={agent.data.updated_at}
      agent={agent.data}
      models={models.data?.allowed ?? []}
      defaultModel={models.data?.default ?? ""}
      tools={tools.data ?? []}
    />
  );
}
