import type { ModelOption } from "@/lib/api/client";

/** 모델 ID 의 표시 이름. 서버·클라이언트 컴포넌트 양쪽에서 쓴다. */
export function modelLabel(options: ModelOption[], id: string | null | undefined): string | undefined {
  return options.find((o) => o.id === id)?.label;
}
