"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { api } from "@/lib/api/client";
import { toast } from "sonner";
import { apiErrorMessage } from "@/lib/api/errors";

/** 에이전트와 그 대화를 한 번에 만들고, 설정 패널을 연 채로 대화 화면을 연다 (만들면서 바로 시험). */
export function NewAgentButton({ toolNames, className }: { toolNames: string[]; className?: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const create = () =>
    startTransition(async () => {
      const { data: agent, error } = await api.POST("/api/v1/agents", {
        body: {
          name: "새 에이전트",
          system_prompt: "너는 친절한 조수야. 사용자의 언어로 간결하게 답해.",
          tools: toolNames,
        },
      });
      if (!agent) {
        toast.error("에이전트를 만들지 못했습니다", { description: apiErrorMessage(error) });
        return;
      }
      const { data: thread } = await api.POST("/api/v1/threads", { body: { agent_id: agent.id } });
      if (!thread) {
        toast.error("에이전트는 만들었지만 대화를 열지 못했습니다", { description: "목록에서 에이전트를 눌러 주세요." });
        router.refresh();
        return;
      }
      router.push(`/chat/${thread.id}?settings=1`);
      router.refresh();
    });

  return (
    <button
      type="button"
      onClick={create}
      disabled={pending}
      className={
        className ??
        "text-muted-foreground hover:bg-muted/60 hover:text-foreground flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-sm disabled:opacity-60"
      }
    >
      <span className="flex size-6 items-center justify-center rounded-md border border-dashed">
        <Plus className="size-3.5" />
      </span>
      {pending ? "만드는 중…" : "새 에이전트"}
    </button>
  );
}
