import { AgentForm } from "@/components/agents/agent-form";
import { backend } from "@/lib/api/server";

export default async function NewAgentPage() {
  const [models, tools] = await Promise.all([backend.GET("/api/v1/models"), backend.GET("/api/v1/tools")]);

  return (
    <AgentForm
      models={models.data?.options ?? []}
      tools={tools.data ?? []}
    />
  );
}
