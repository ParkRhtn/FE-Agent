"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { AgentAvatar } from "@/components/chat/agent-avatar";
import { api } from "@/lib/api/client";
import { toast } from "sonner";
import { apiErrorMessage } from "@/lib/api/errors";

type AgentItem = { id: string; name: string; description: string | null };

/** 누르면 그 에이전트와 새 대화를 연다. 맨 위는 기본 에이전트. */
export function AgentList({ agents }: { agents: AgentItem[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [opening, setOpening] = useState<string | null>(null);

  const start = (agentId: string | undefined) => {
    setOpening(agentId ?? "default");
    startTransition(async () => {
      const { data, error } = await api.POST("/api/v1/threads", { body: { agent_id: agentId } });
      if (!data) {
        setOpening(null);
        toast.error("대화를 시작하지 못했습니다", { description: apiErrorMessage(error) });
        return;
      }
      router.push(`/chat/${data.id}`);
      router.refresh();
    });
  };

  const row = (id: string | undefined, name: string, description: string) => (
    <li key={id ?? "default"}>
      <button
        type="button"
        onClick={() => start(id)}
        disabled={pending}
        title={`${name}와 새 대화`}
        className="hover:bg-muted/60 flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left disabled:opacity-60"
      >
        <AgentAvatar isAgent={Boolean(id)} className="size-6 [&_svg]:size-3.5" />
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-sm">{pending && opening === (id ?? "default") ? "여는 중..." : name}</span>
          <span className="text-muted-foreground truncate text-[11px]">{description}</span>
        </span>
      </button>
    </li>
  );

  return (
    <ul className="flex flex-col gap-0.5">
      {row(undefined, "기본 에이전트", "지시 없이 모든 도구를 쓰는 조수")}
      {agents.map((a) => row(a.id, a.name, a.description || "설명 없음"))}
    </ul>
  );
}
