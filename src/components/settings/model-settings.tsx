"use client";

import { cn } from "cn";
import { Check, LoaderCircle, Pencil, Plus, RefreshCw, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { ModelSelect } from "@/components/model-select";
import { Button } from "@/components/ui/button";
import { api, type ModelOption, type Provider } from "@/lib/api/client";
import { toast } from "sonner";
import { useConfirm } from "@/components/ui/confirm";

type Kind = "anthropic" | "openai" | "openai_compatible";

const KINDS: { value: Kind; label: string; hint: string; mark: string; tile: string }[] = [
  {
    value: "anthropic",
    label: "Anthropic",
    hint: "console.anthropic.com 에서 발급한 키 (sk-ant-…)",
    mark: "A",
    tile: "bg-orange-100 text-orange-700",
  },
  {
    value: "openai",
    label: "OpenAI",
    hint: "platform.openai.com 에서 발급한 키 (sk-…)",
    mark: "O",
    tile: "bg-emerald-100 text-emerald-700",
  },
  {
    value: "openai_compatible",
    label: "OpenAI 호환",
    hint: "Ollama, vLLM, LM Studio 처럼 OpenAI 형식 API 를 주는 서버",
    mark: "≈",
    tile: "bg-sky-100 text-sky-700",
  },
];

export const inputClass =
  "bg-background focus-visible:border-ring focus-visible:ring-ring/50 w-full rounded-lg border px-2.5 py-1.5 text-sm outline-none focus-visible:ring-3";

function kindMeta(kind: string) {
  return KINDS.find((k) => k.value === kind) ?? KINDS[2];
}

export function errorText(error: unknown, fallback: string): string {
  const detail = (error as { detail?: unknown } | undefined)?.detail;
  return typeof detail === "string" ? detail : fallback;
}

export function ModelSettings({
  providers,
  options,
  defaultModel,
}: {
  providers: Provider[];
  options: ModelOption[];
  defaultModel: string | null;
}) {
  const router = useRouter();
  const [adding, setAdding] = useState(providers.length === 0);
  const [savingDefault, startDefault] = useTransition();
  const [defaultError, setDefaultError] = useState<string | null>(null);

  const changeDefault = (model: string) =>
    startDefault(async () => {
      const { error } = await api.PUT("/api/v1/models/default", { body: { model } });
      setDefaultError(error ? errorText(error, "기본 모델을 바꾸지 못했습니다.") : null);
      router.refresh();
    });

  return (
    <>
      <section className="flex flex-col gap-3">
        <div className="flex flex-col gap-0.5">
          <h2 className="font-semibold">기본 모델</h2>
          <p className="text-muted-foreground text-sm">모델을 따로 고르지 않은 대화·에이전트·LLM 노드가 씁니다.</p>
        </div>
        {options.length === 0 ? (
          <p className="text-muted-foreground rounded-lg border border-dashed p-4 text-sm">
            켜진 모델이 없습니다. 아래에서 제공사를 추가하고 쓸 모델을 켜세요.
          </p>
        ) : (
          <div className="flex items-center gap-2">
            <ModelSelect
              options={options}
              value={defaultModel ?? ""}
              onChange={changeDefault}
              disabled={savingDefault}
              className={cn(inputClass, "max-w-sm")}
            />
            {savingDefault && <LoaderCircle className="text-muted-foreground size-4 animate-spin" />}
          </div>
        )}
        {defaultError && <p className="text-destructive text-sm">{defaultError}</p>}
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-end justify-between gap-4">
          <div className="flex flex-col gap-0.5">
            <h2 className="font-semibold">모델 제공사</h2>
            <p className="text-muted-foreground text-sm">
              키마다 쓸 수 있는 모델이 다릅니다. 연결한 뒤 쓸 모델을 켜세요.
            </p>
          </div>
          {!adding && (
            <Button variant="outline" size="sm" onClick={() => setAdding(true)}>
              <Plus className="size-4" />
              제공사 추가
            </Button>
          )}
        </div>

        {adding && <AddProviderForm onDone={() => setAdding(false)} canCancel={providers.length > 0} />}

        {providers.map((p) => (
          <ProviderCard key={p.id} provider={p} />
        ))}
      </section>
    </>
  );
}

function AddProviderForm({ onDone, canCancel }: { onDone: () => void; canCancel: boolean }) {
  const router = useRouter();
  const [kind, setKind] = useState<Kind>("anthropic");
  const [name, setName] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const meta = kindMeta(kind);
  const compatible = kind === "openai_compatible";

  const submit = () =>
    startTransition(async () => {
      setError(null);
      const { error } = await api.POST("/api/v1/providers", {
        body: { kind, name: name || null, api_key: apiKey || null, base_url: compatible ? baseUrl : null },
      });
      if (error) {
        setError(errorText(error, "연결하지 못했습니다."));
        return;
      }
      onDone();
      router.refresh();
    });

  return (
    <form
      className="flex flex-col gap-4 rounded-xl border p-4"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="제공사 종류">
        {KINDS.map((k) => (
          <button
            key={k.value}
            type="button"
            role="radio"
            aria-checked={kind === k.value}
            onClick={() => {
              setKind(k.value);
              setError(null);
            }}
            className={cn(
              "flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm",
              kind === k.value ? "border-foreground/40 bg-muted font-medium" : "hover:bg-muted/60",
            )}
          >
            <span className={cn("flex size-5 items-center justify-center rounded text-xs font-bold", k.tile)}>
              {k.mark}
            </span>
            {k.label}
          </button>
        ))}
      </div>
      <p className="text-muted-foreground -mt-2 text-xs">{meta.hint}</p>

      {compatible && (
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium">서버 주소</span>
          <input
            required
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder="http://localhost:11434/v1"
            className={inputClass}
          />
        </label>
      )}
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium">API 키{compatible && " (필요한 서버만)"}</span>
        <input
          type="password"
          required={!compatible}
          autoComplete="off"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder={kind === "anthropic" ? "sk-ant-…" : "sk-…"}
          className={cn(inputClass, "font-mono")}
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium">이름 (선택)</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={meta.label}
          maxLength={100}
          className={inputClass}
        />
      </label>

      {error && (
        <p className="border-destructive/30 bg-destructive/5 text-destructive rounded-lg border p-3 text-sm">{error}</p>
      )}

      <div className="flex justify-end gap-2">
        {canCancel && (
          <Button type="button" variant="ghost" onClick={onDone} disabled={pending}>
            취소
          </Button>
        )}
        <Button type="submit" disabled={pending}>
          {pending && <LoaderCircle className="size-4 animate-spin" />}
          {pending ? "연결 확인 중" : "연결 확인 후 추가"}
        </Button>
      </div>
    </form>
  );
}

type TestState =
  { status: "running" } | { status: "ok"; reply: string; ms: number } | { status: "error"; error: string };

function ProviderCard({ provider }: { provider: Provider }) {
  const router = useRouter();
  const meta = kindMeta(provider.kind);
  const [enabled, setEnabled] = useState(provider.enabled_models);
  const [filter, setFilter] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [newName, setNewName] = useState<string | null>(null);
  const [tests, setTests] = useState<Record<string, TestState>>({});
  const [pending, startTransition] = useTransition();
  const confirm = useConfirm();
  const path = { params: { path: { provider_id: provider.id } } };

  const act = (fn: () => Promise<string | null>) =>
    startTransition(async () => {
      setError(null);
      setNotice(null);
      const message = await fn();
      if (message) setNotice(message);
      router.refresh();
    });

  const toggleModel = (model: string) => {
    const next = enabled.includes(model) ? enabled.filter((m) => m !== model) : [...enabled, model];
    setEnabled(next);
    act(async () => {
      const { error } = await api.PATCH("/api/v1/providers/{provider_id}", { ...path, body: { enabled_models: next } });
      if (error) {
        setEnabled(enabled);
        setError(errorText(error, "모델 설정을 저장하지 못했습니다."));
      }
      return null;
    });
  };

  const verify = () =>
    act(async () => {
      const { data, error } = await api.POST("/api/v1/providers/{provider_id}/verify", path);
      if (error) {
        setError(errorText(error, "확인하지 못했습니다."));
        return null;
      }
      setEnabled(data.enabled_models);
      return `연결이 정상입니다. 모델 ${data.available_models.length}개를 확인했습니다.`;
    });

  const saveKey = () =>
    act(async () => {
      const { error } = await api.PATCH("/api/v1/providers/{provider_id}", { ...path, body: { api_key: newKey } });
      if (error) {
        setError(errorText(error, "키를 바꾸지 못했습니다."));
        return null;
      }
      setNewKey(null);
      return "새 키를 확인하고 저장했습니다.";
    });

  const saveName = () => {
    const name = newName?.trim();
    setNewName(null);
    if (!name || name === provider.name) return;
    act(async () => {
      const { error } = await api.PATCH("/api/v1/providers/{provider_id}", { ...path, body: { name } });
      if (error) setError(errorText(error, "이름을 바꾸지 못했습니다."));
      return null;
    });
  };

  const remove = async () => {
    const ok = await confirm({
      title: `'${provider.name}' 연결을 삭제할까요?`,
      description: "이 제공사의 모델을 쓰던 곳은 기본 모델로 바뀝니다. 저장된 API 키도 지워집니다.",
      confirmLabel: "삭제",
      destructive: true,
    });
    if (!ok) return;
    act(async () => {
      const { error } = await api.DELETE("/api/v1/providers/{provider_id}", path);
      if (error) {
        setError(errorText(error, "삭제하지 못했습니다."));
        return null;
      }
      toast.success(`'${provider.name}' 연결을 삭제했습니다`); // 목록에서 사라지므로 토스트로 알린다
      return null;
    });
  };

  const test = async (model: string) => {
    setTests((t) => ({ ...t, [model]: { status: "running" } }));
    const { data, error } = await api.POST("/api/v1/providers/{provider_id}/test", { ...path, body: { model } });
    const result: TestState =
      error || !data
        ? { status: "error", error: errorText(error, "테스트하지 못했습니다.") }
        : data.ok
          ? { status: "ok", reply: data.reply ?? "", ms: data.latency_ms ?? 0 }
          : { status: "error", error: data.error ?? "알 수 없는 오류" };
    setTests((t) => ({ ...t, [model]: result }));
  };

  const query = filter.trim().toLowerCase();
  const models = provider.available_models
    .filter((m) => !query || m.id.toLowerCase().includes(query) || m.label.toLowerCase().includes(query))
    // 켠 모델을 위로
    .sort((a, b) => Number(enabled.includes(b.id)) - Number(enabled.includes(a.id)));

  return (
    <article className="flex flex-col rounded-xl border">
      <header className="flex items-center gap-3 border-b p-4">
        <span
          className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold", meta.tile)}
        >
          {meta.mark}
        </span>
        <div className="flex min-w-0 flex-1 flex-col">
          {newName === null ? (
            <span className="flex min-w-0 items-center gap-1">
              <span className="truncate font-medium">{provider.name}</span>
              <button
                type="button"
                onClick={() => setNewName(provider.name)}
                disabled={pending}
                aria-label="이름 변경"
                className="text-muted-foreground hover:text-foreground hover:bg-muted rounded p-1"
              >
                <Pencil className="size-3.5" />
              </button>
            </span>
          ) : (
            <input
              autoFocus
              value={newName}
              maxLength={100}
              aria-label="제공사 이름"
              onChange={(e) => setNewName(e.target.value)}
              onBlur={saveName}
              onKeyDown={(e) => {
                if (e.key === "Enter") e.currentTarget.blur();
                if (e.key === "Escape") setNewName(null);
              }}
              className={cn(inputClass, "max-w-64 py-0.5 font-medium")}
            />
          )}
          <span className="text-muted-foreground truncate text-xs">
            {[
              meta.label,
              provider.base_url,
              provider.api_key_hint && `키 ${provider.api_key_hint}`,
              provider.verified_at &&
                `${new Date(provider.verified_at).toLocaleString("ko-KR", { dateStyle: "short", timeStyle: "short" })} 확인`,
            ]
              .filter(Boolean)
              .join(", ")}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button variant="ghost" size="sm" onClick={verify} disabled={pending} title="저장된 키로 다시 확인">
            <RefreshCw className={cn("size-3.5", pending && "animate-spin")} />
            다시 확인
          </Button>
          {provider.kind !== "openai_compatible" && (
            <Button variant="ghost" size="sm" onClick={() => setNewKey(newKey === null ? "" : null)} disabled={pending}>
              키 변경
            </Button>
          )}
          <button
            type="button"
            onClick={remove}
            disabled={pending}
            aria-label={`${provider.name} 삭제`}
            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md p-1.5"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </header>

      {newKey !== null && (
        <form
          className="flex gap-2 border-b p-4"
          onSubmit={(e) => {
            e.preventDefault();
            saveKey();
          }}
        >
          <input
            type="password"
            autoFocus
            autoComplete="off"
            required
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            placeholder="새 API 키"
            className={cn(inputClass, "font-mono")}
          />
          <Button type="submit" disabled={pending}>
            확인 후 저장
          </Button>
        </form>
      )}

      {(error || notice) && (
        <p className={cn("border-b px-4 py-2.5 text-sm", error ? "text-destructive bg-destructive/5" : "bg-muted/50")}>
          {error ?? notice}
        </p>
      )}

      <div className="flex flex-col gap-2 p-4">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm">
            <span className="font-medium">{enabled.length}개</span>
            <span className="text-muted-foreground"> 켜짐, 전체 {provider.available_models.length}개</span>
          </span>
          {provider.available_models.length > 8 && (
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="모델 검색"
              className={cn(inputClass, "max-w-48 py-1")}
            />
          )}
        </div>
        {enabled.length === 0 && (
          <p className="text-muted-foreground text-sm">쓸 모델을 켜세요. 켠 모델만 모델 목록에 나옵니다.</p>
        )}
        <ul className="flex max-h-80 flex-col overflow-y-auto">
          {models.map((m) => {
            const on = enabled.includes(m.id);
            const t = tests[m.id];
            return (
              <li key={m.id} className="flex flex-col border-b py-2 last:border-b-0">
                <div className="flex items-center gap-3">
                  <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2.5">
                    <input type="checkbox" checked={on} onChange={() => toggleModel(m.id)} className="size-4" />
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate text-sm">{m.label}</span>
                      {m.label !== m.id && (
                        <span className="text-muted-foreground truncate font-mono text-xs">{m.id}</span>
                      )}
                    </span>
                  </label>
                  {t?.status === "ok" && (
                    <span className="flex items-center gap-1 text-xs text-emerald-700">
                      <Check className="size-3.5" />
                      {t.ms}ms
                    </span>
                  )}
                  {t?.status === "error" && <X className="text-destructive size-4" aria-label="테스트 실패" />}
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => test(m.id)}
                    disabled={t?.status === "running"}
                    title="짧은 요청을 실제로 보내 봅니다 (토큰 몇 개 비용)"
                  >
                    {t?.status === "running" ? <LoaderCircle className="size-3 animate-spin" /> : "테스트"}
                  </Button>
                </div>
                {t?.status === "error" && <p className="text-destructive mt-1 pl-6.5 text-xs">{t.error}</p>}
                {t?.status === "ok" && (
                  <p className="text-muted-foreground mt-1 truncate pl-6.5 text-xs">응답: {t.reply || "(빈 응답)"}</p>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </article>
  );
}
