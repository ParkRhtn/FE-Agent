"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import { api } from "@/lib/api/client";

type NewThreadButtonProps = {
  className?: string;
  agentId?: string;
  label?: string;
  variant?: "default" | "outline";
};

export function NewThreadButton({ className, agentId, label = "+ 새 대화", variant }: NewThreadButtonProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const create = () =>
    startTransition(async () => {
      const { data } = await api.POST("/api/v1/threads", { body: { agent_id: agentId } });
      if (data) {
        router.push(`/chat/${data.id}`);
        router.refresh();
      }
    });

  return (
    <Button onClick={create} disabled={pending} className={className} variant={variant}>
      {pending ? "생성 중..." : label}
    </Button>
  );
}
