"use client";

import { Rocket } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { api } from "@/lib/api/client";

/** 배포 전일 때의 안내와 '지금 배포' 버튼. 외부 API·공개 링크는 배포본만 실행한다. */
export function PublishNotice({
  workflowId,
  what,
  onPublished,
}: {
  workflowId: string;
  what: string; // "API 로 호출할 수" / "공개 링크를 쓸 수"
  onPublished: () => void;
}) {
  const router = useRouter();
  const [errors, setErrors] = useState<string[]>([]);
  const [pending, startTransition] = useTransition();

  const publish = () =>
    startTransition(async () => {
      setErrors([]);
      const { error } = await api.POST("/api/v1/workflows/{workflow_id}/publish", {
        params: { path: { workflow_id: workflowId } },
      });
      if (error) {
        const detail = (error as { detail?: unknown }).detail;
        setErrors(Array.isArray(detail) ? detail.map(String) : ["배포하지 못했습니다. 잠시 후 다시 시도하세요."]);
        toast.error("배포하지 못했습니다");
        return;
      }
      toast.success("배포했습니다", { description: "이제 외부에서 이 워크플로우를 쓸 수 있습니다." });
      onPublished();
      router.refresh(); // 목록 카드 상태도 갱신
    });

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
      <div className="flex items-center gap-3">
        <p className="min-w-0 flex-1">
          아직 배포하지 않아 {what} 없습니다. 배포하면 지금 저장된 내용이 외부에 공개되고, 이후 화면에서 고쳐도 다시 배포하기
          전까지는 바뀌지 않습니다.
        </p>
        <Button size="sm" onClick={publish} disabled={pending} className="shrink-0">
          <Rocket className="size-3.5" />
          {pending ? "배포 중…" : "지금 배포"}
        </Button>
      </div>
      {errors.length > 0 && (
        <ul className="list-disc pl-5 text-xs text-rose-700">
          {errors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
