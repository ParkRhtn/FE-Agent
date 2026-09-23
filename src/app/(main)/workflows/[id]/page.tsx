import { notFound } from "next/navigation";

import { WorkflowEditor } from "@/components/workflow/editor";
import { backend } from "@/lib/api/server";

export default async function WorkflowPage({ params }: PageProps<"/workflows/[id]">) {
  const { id } = await params;

  const [workflow, models, tools, agents] = await Promise.all([
    backend.GET("/api/v1/workflows/{workflow_id}", { params: { path: { workflow_id: id } } }),
    backend.GET("/api/v1/models"),
    backend.GET("/api/v1/tools"),
    backend.GET("/api/v1/agents"),
  ]);
  if (!workflow.data) notFound();

  return (
    <WorkflowEditor
      workflow={workflow.data}
      models={models.data?.options ?? []}
      defaultModel={models.data?.default ?? null}
      tools={tools.data ?? []}
      agents={agents.data ?? []}
    />
  );
}
