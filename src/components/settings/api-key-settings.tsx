"use client";

import { KeyRound, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { CopyButton } from "@/components/copy-button";
import { errorText, inputClass } from "@/components/settings/model-settings";
import { Button } from "@/components/ui/button";
import { api, type ApiKey } from "@/lib/api/client";
import { toast } from "sonner";
import { useConfirm } from "@/components/ui/confirm";
import { apiErrorMessage } from "@/lib/api/errors";

function when(value: string | null | undefined): string {
  return value ? new Date(value).toLocaleString("ko-KR", { dateStyle: "short", timeStyle: "short" }) : "사용 기록 없음";
}

/** 외부 서비스용 API 키. 원문은 만든 직후 한 번만 보여 준다. */
type WorkflowRef = { id: string; name: string };

export function ApiKeySettings({ keys, workflows }: { keys: ApiKey[]; workflows: WorkflowRef[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  // null = 모든 워크플로우. 고객에게 넘길 키는 그 고객 워크플로우만 고른다
  const [scope, setScope] = useState<string[] | null>(null);
  const workflowName = new Map(workflows.map((w) => [w.id, w.name]));
  const [created, setCreated] = useState<{ name: string; key: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const confirm = useConfirm();

  const create = () =>
    startTransition(async () => {
      setError(null);
      const { data, error } = await api.POST("/api/v1/api-keys", {
        body: { name: name.trim(), workflow_ids: scope },
      });
      if (error || !data) {
        setError(errorText(error, "API 키를 만들지 못했습니다."));
        return;
      }
      setCreated({ name: data.name, key: data.key });
      setName("");
      setScope(null);
      router.refresh();
    });

  const remove = async (key: ApiKey) => {
    const ok = await confirm({
      title: `'${key.name}' 키를 지울까요?`,
      description: "이 키로 오는 요청은 바로 거부됩니다. 이 키를 쓰는 서비스가 있다면 새 키로 바꿔야 합니다.",
      confirmLabel: "지우기",
      destructive: true,
    });
    if (!ok) return;
    startTransition(async () => {
      const { error } = await api.DELETE("/api/v1/api-keys/{key_id}", { params: { path: { key_id: key.id } } });
      if (error) {
        toast.error("키를 지우지 못했습니다", { description: apiErrorMessage(error) });
        return;
      }
      toast.success(`'${key.name}' 키를 지웠습니다`);
      router.refresh();
    });
  };

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-col gap-0.5">
        <h2 className="font-semibold">API 키</h2>
        <p className="text-muted-foreground text-sm">
          다른 서비스(내 서버, 앱, 자동화 도구)에서 워크플로우를 실행할 때 씁니다. 호출 방법은 워크플로우 목록의 카드 메뉴
          → &lsquo;API로 호출&rsquo;에 있습니다.
        </p>
      </div>

      <div className="flex flex-col gap-4 rounded-xl border p-4">
        {created && (
          <div className="flex flex-col gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
            <p className="text-sm font-medium text-amber-900">
              &lsquo;{created.name}&rsquo; 키를 만들었습니다. 지금 복사해 두세요. 이 화면을 벗어나면 다시 볼 수 없습니다.
            </p>
            <div className="flex items-center gap-2">
              <code className="bg-background min-w-0 flex-1 truncate rounded border px-2 py-1.5 font-mono text-xs">
                {created.key}
              </code>
              <CopyButton text={created.key} />
            </div>
          </div>
        )}

        {keys.length > 0 && (
          <ul className="flex flex-col divide-y">
            {keys.map((key) => (
              <li key={key.id} className="flex items-center gap-3 py-2 first:pt-0">
                <span className="bg-muted text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-lg">
                  <KeyRound className="size-4" />
                </span>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm font-medium">{key.name}</span>
                  <span className="text-muted-foreground truncate text-xs">
                    <code className="font-mono">{key.prefix}…</code> ·{" "}
                    {key.workflow_ids
                      ? key.workflow_ids.map((id) => workflowName.get(id) ?? "삭제된 워크플로우").join(", ")
                      : "모든 워크플로우"}{" "}
                    · 마지막 사용 {when(key.last_used_at)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => remove(key)}
                  disabled={pending}
                  aria-label={`${key.name} 키 지우기`}
                  className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded-md p-1.5"
                >
                  <Trash2 className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        )}

        <form
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            create();
          }}
        >
          <fieldset className="flex flex-col gap-1.5">
            <legend className="mb-1.5 text-xs font-medium">이 키로 부를 수 있는 워크플로우</legend>
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" checked={scope === null} onChange={() => setScope(null)} />
              모든 워크플로우 <span className="text-muted-foreground text-xs">(내 서버에서 쓸 때)</span>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" checked={scope !== null} onChange={() => setScope([])} />
              선택한 워크플로우만 <span className="text-muted-foreground text-xs">(고객에게 넘길 때)</span>
            </label>
            {scope !== null && (
              <div className="ml-6 flex max-h-40 flex-col gap-1 overflow-y-auto rounded-lg border p-2">
                {workflows.length === 0 && <span className="text-muted-foreground text-xs">워크플로우가 없습니다.</span>}
                {workflows.map((w) => (
                  <label key={w.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={scope.includes(w.id)}
                      onChange={(e) =>
                        setScope(e.target.checked ? [...scope, w.id] : scope.filter((id) => id !== w.id))
                      }
                    />
                    <span className="truncate">{w.name}</span>
                  </label>
                ))}
              </div>
            )}
          </fieldset>
          <div className="flex items-end gap-2">
            <label className="flex min-w-0 flex-1 flex-col gap-1.5">
              <span className="text-xs font-medium">새 키 이름</span>
              <input
                required
                maxLength={100}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="예: 쇼핑몰 서버"
                className={inputClass}
              />
            </label>
            <Button type="submit" disabled={pending || !name.trim() || (scope !== null && scope.length === 0)}>
              키 만들기
            </Button>
          </div>
        </form>
        {error && <p className="text-destructive text-sm">{error}</p>}
      </div>
    </section>
  );
}
