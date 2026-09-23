"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import { api } from "@/lib/api/client";

export function NewWorkflowButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const create = () =>
    startTransition(async () => {
      const { data } = await api.POST("/api/v1/workflows", { body: { name: "새 워크플로우" } });
      if (data) router.push(`/workflows/${data.id}?new=1`);
    });

  return (
    <Button onClick={create} disabled={pending}>
      {pending ? "만드는 중..." : "+ 새 워크플로우"}
    </Button>
  );
}
