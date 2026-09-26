"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { AgentAvatar } from "@/components/chat/agent-avatar";
import { api } from "@/lib/api/client";
import { toast } from "sonner";
import { apiErrorMessage } from "@/lib/api/errors";

/** 누르면 그 에이전트와 새 대화를 연다. agentId 가 없으면 기본 에이전트. */
export function StartChatCard({ agentId, name, description }: { agentId?: string; name: string; description: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const start = () =>
    startTransition(async () => {
      const { data, error } = await api.POST("/api/v1/threads", { body: { agent_id: agentId } });
      if (!data) {
        toast.error("대화를 시작하지 못했습니다", { description: apiErrorMessage(error) });
        return;
      }
      router.push(`/chat/${data.id}`);
      router.refresh();
    });

  return (
    <button
      type="button"
      onClick={start}
      disabled={pending}
      className="hover:border-foreground/25 focus-visible:ring-ring/50 flex h-full items-start gap-3 rounded-xl border p-4 text-left outline-none transition-[border-color,box-shadow] hover:shadow-sm focus-visible:ring-3 disabled:opacity-60"
    >
      <AgentAvatar isAgent={Boolean(agentId)} className="size-9 [&_svg]:size-5" />
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="truncate font-medium">{pending ? "여는 중..." : name}</span>
        <span className="text-muted-foreground line-clamp-2 text-xs leading-relaxed">{description}</span>
      </span>
    </button>
  );
}
