"use client";

import { useRouter } from "next/navigation";
import { useTransition, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { api } from "@/lib/api/client";

type NewThreadButtonProps = {
  className?: string;
  agentId?: string;
  label?: ReactNode;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
};

/** 새 대화를 만들고 그 대화로 이동한다. agentId 가 있으면 그 에이전트와의 대화. */
export function NewThreadButton({ className, agentId, label = "+ 새 대화", variant, size }: NewThreadButtonProps) {
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
    <Button onClick={create} disabled={pending} className={className} variant={variant} size={size}>
      {pending ? "여는 중..." : label}
    </Button>
  );
}
