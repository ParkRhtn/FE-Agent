"use client";

import { cn } from "cn";
import { Clock, Lock } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { WorkflowCardMenu } from "@/components/workflow/workflow-card-menu";
import { WorkflowThumbnail } from "@/components/workflow/workflow-thumbnail";
import { api } from "@/lib/api/client";
import { scheduleLabel } from "@/lib/schedule";
import { NODE_META, type NodeKind, type Workflow } from "@/lib/workflow";
import { toast } from "sonner";
import { apiErrorMessage } from "@/lib/api/errors";

const STEP_KINDS: NodeKind[] = ["llm", "agent", "tool", "condition"];
export const canvasBg = "bg-zinc-50 bg-[radial-gradient(#d4d4d8_1px,transparent_1px)] [background-size:14px_14px]";

export function WorkflowCard({ workflow, updatedLabel }: { workflow: Workflow; updatedLabel: string }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(workflow.name);
  const [pending, startTransition] = useTransition();
  const href = `/workflows/${workflow.id}`;
  const counts = STEP_KINDS.map((k) => [k, workflow.graph.nodes.filter((n) => n.type === k).length] as const).filter(
    ([, c]) => c > 0,
  );

  const saveName = () => {
    setEditing(false);
    const next = name.trim();
    if (!next || next === workflow.name) {
      setName(workflow.name);
      return;
    }
    startTransition(async () => {
      const { error } = await api.PATCH("/api/v1/workflows/{workflow_id}", {
        params: { path: { workflow_id: workflow.id } },
        body: { name: next },
      });
      if (error) {
        setName(workflow.name);
        toast.error("이름을 바꾸지 못했습니다", { description: apiErrorMessage(error) });
      }
      router.refresh();
    });
  };

  return (
    <li className="group bg-background hover:border-foreground/25 relative flex flex-col rounded-xl border transition-[border-color,box-shadow] hover:shadow-sm">
      {/* 미리보기는 그림 크기와 상관없이 영역을 고정한다 (세로로 긴 흐름도 카드 높이를 바꾸지 않게) */}
      <div className={cn("relative aspect-[16/9] overflow-hidden rounded-t-xl border-b", canvasBg)}>
        <div className="absolute inset-3">
          <WorkflowThumbnail graph={workflow.graph} />
        </div>
      </div>

      <div className="flex h-[92px] flex-col justify-between p-4">
        <div className="flex min-w-0 flex-col gap-0.5">
          {editing ? (
            <input
              autoFocus
              value={name}
              maxLength={100}
              aria-label="워크플로우 이름"
              onFocus={(e) => e.currentTarget.select()}
              onChange={(e) => setName(e.target.value)}
              onBlur={saveName}
              onKeyDown={(e) => {
                if (e.key === "Enter") e.currentTarget.blur();
                if (e.key === "Escape") {
                  setName(workflow.name);
                  setEditing(false);
                }
              }}
              className="focus-visible:ring-ring/50 relative z-10 -mx-1.5 -my-0.5 rounded-md border px-1.5 py-0.5 font-medium outline-none focus-visible:ring-3"
            />
          ) : (
            // 카드 전체를 누르면 열리도록 링크를 카드 크기로 늘린다
            <Link
              href={href}
              className={cn(
                "truncate font-medium outline-none after:absolute after:inset-0 after:rounded-xl focus-visible:after:ring-3 focus-visible:after:ring-ring/50",
                pending && "opacity-60",
              )}
            >
              {name}
            </Link>
          )}
          <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
            {workflow.delete_protected && (
              <Lock className="size-3 shrink-0" aria-label="삭제 보호 중">
                <title>삭제 보호 중</title>
              </Lock>
            )}
            {updatedLabel} 수정
            {workflow.schedule?.enabled && (
              <span className="flex items-center gap-0.5 font-medium text-emerald-700">
                <Clock className="size-3" />
                {scheduleLabel(workflow.schedule)}
              </span>
            )}
          </span>
        </div>
        <div className="flex gap-1 overflow-hidden">
          {counts.length === 0 && <span className="text-muted-foreground text-xs">아직 단계가 없습니다</span>}
          {counts.map(([k, c]) => {
            const Icon = NODE_META[k].icon;
            return (
              <span
                key={k}
                title={`${NODE_META[k].label} ${c}개`}
                aria-label={`${NODE_META[k].label} ${c}개`}
                className={cn("flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs", NODE_META[k].tile)}
              >
                <Icon className="size-3.5" />
                {c}
              </span>
            );
          })}
        </div>
      </div>

      <div className="absolute top-2.5 right-2.5 z-10">
        <WorkflowCardMenu
          id={workflow.id}
          name={workflow.name}
          graph={workflow.graph}
          published={Boolean(workflow.published_at)}
          deleteProtected={workflow.delete_protected ?? false}
          onRename={() => setEditing(true)}
        />
      </div>
    </li>
  );
}
