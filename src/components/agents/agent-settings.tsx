"use client";

import { cn } from "cn";
import { Check, Trash2, Wrench, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { ModelSelect } from "@/components/model-select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { api, type Agent, type ModelOption, type Tool } from "@/lib/api/client";

const inputClass =
  "bg-background focus-visible:border-ring focus-visible:ring-ring/50 w-full rounded-lg border px-2.5 py-1.5 text-sm outline-none focus-visible:ring-3";

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium">{label}</span>
      {children}
      {hint && <span className="text-muted-foreground text-xs leading-relaxed">{hint}</span>}
    </label>
  );
}

/** 대화 화면 오른쪽 에이전트 설정. 저장하면 다음 메시지부터 바로 적용된다. */
export function AgentSettings({
  agent,
  models,
  tools,
  onClose,
}: {
  agent: Agent;
  models: ModelOption[];
  tools: Tool[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const initial = {
    name: agent.name,
    description: agent.description ?? "",
    system_prompt: agent.system_prompt,
    model: agent.model ?? "",
    tools: agent.tools,
  };
  const [form, setForm] = useState(initial);
  const [saved, setSaved] = useState(JSON.stringify(initial));
  const dirty = JSON.stringify(form) !== saved;

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));
  const toggleTool = (name: string) =>
    set("tools", form.tools.includes(name) ? form.tools.filter((t) => t !== name) : [...form.tools, name]);

  const save = () =>
    startTransition(async () => {
      setError(null);
      const { error } = await api.PATCH("/api/v1/agents/{agent_id}", {
        params: { path: { agent_id: agent.id } },
        body: { ...form, description: form.description || null, model: form.model || null },
      });
      if (error) {
        setError("저장하지 못했습니다. 이름과 지시사항이 비어 있지 않은지 확인하세요.");
        return;
      }
      setSaved(JSON.stringify(form));
      router.refresh(); // 헤더 이름·대화 목록 갱신
    });

  const remove = () => {
    if (!confirm(`'${agent.name}' 에이전트를 삭제할까요? 이 에이전트로 하던 대화는 기본 에이전트로 이어집니다.`))
      return;
    startTransition(async () => {
      await api.DELETE("/api/v1/agents/{agent_id}", { params: { path: { agent_id: agent.id } } });
      router.push("/chat");
      router.refresh();
    });
  };

  return (
    <aside className="bg-background flex w-[380px] shrink-0 flex-col border-l" aria-label="에이전트 설정">
      <div className="flex h-12 shrink-0 items-center justify-between border-b pr-2 pl-4">
        <h2 className="text-sm font-semibold">에이전트 설정</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="설정 닫기"
          className="text-muted-foreground hover:bg-muted hover:text-foreground rounded-md p-1.5"
        >
          <X className="size-4" />
        </button>
      </div>

      <form
        id="agent-settings"
        className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-4"
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <Field label="이름">
          <input
            required
            maxLength={100}
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="설명" hint="대화 목록과 워크플로우에서 이 에이전트를 알아보는 한 줄입니다.">
          <input
            maxLength={500}
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="예: 고객 문의를 요약하고 답장 초안을 씁니다"
            className={inputClass}
          />
        </Field>
        <Field label="지시사항" hint="누구인지, 무엇을 하는지, 어떤 말투로 답할지 적으세요. 모델이 매번 먼저 읽습니다.">
          <Textarea
            required
            rows={9}
            value={form.system_prompt}
            onChange={(e) => set("system_prompt", e.target.value)}
            placeholder={"너는 쇼핑몰 고객 상담원이야.\n- 환불·배송 문의에 친절하게 답해\n- 모르는 건 모른다고 말해"}
            className="min-h-44 text-sm leading-relaxed"
          />
        </Field>
        <Field label="모델">
          <ModelSelect
            options={models}
            value={form.model}
            onChange={(value) => set("model", value)}
            defaultOption={{ label: "기본 모델 (설정에서 정한 모델)" }}
            className={inputClass}
          />
        </Field>
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium">도구</span>
          <span className="text-muted-foreground text-xs">에이전트가 필요할 때 스스로 골라 씁니다.</span>
          {tools.length === 0 && <p className="text-muted-foreground text-sm">연결된 도구가 없습니다.</p>}
          <div className="flex flex-col gap-1.5">
            {tools.map((tool) => {
              const on = form.tools.includes(tool.name);
              return (
                <button
                  key={tool.name}
                  type="button"
                  role="switch"
                  aria-checked={on}
                  onClick={() => toggleTool(tool.name)}
                  className={cn(
                    "focus-visible:ring-ring/50 flex items-start gap-2.5 rounded-lg border p-2.5 text-left outline-none transition-colors focus-visible:ring-3",
                    on ? "border-amber-300 bg-amber-50/60" : "hover:bg-muted/50",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-6 shrink-0 items-center justify-center rounded-md",
                      on ? "bg-amber-100 text-amber-700" : "bg-muted text-muted-foreground",
                    )}
                  >
                    {on ? <Check className="size-3.5" /> : <Wrench className="size-3.5" />}
                  </span>
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="text-sm font-medium">{tool.label}</span>
                    <span className="text-muted-foreground text-xs leading-relaxed">{tool.description}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        <button
          type="button"
          onClick={remove}
          className="text-muted-foreground hover:text-destructive flex items-center gap-1.5 self-start text-xs"
        >
          <Trash2 className="size-3.5" />
          에이전트 삭제
        </button>
      </form>

      <div className="flex shrink-0 items-center gap-2 border-t p-3">
        {error ? (
          <p className="text-destructive flex-1 text-xs">{error}</p>
        ) : (
          <span className="text-muted-foreground flex flex-1 items-center gap-1.5 text-xs">
            <span className={cn("size-1.5 rounded-full", dirty ? "bg-amber-500" : "bg-emerald-500")} />
            {dirty ? "저장하지 않은 변경이 있습니다" : "저장됨, 다음 메시지부터 적용"}
          </span>
        )}
        <Button type="submit" form="agent-settings" size="sm" disabled={pending || !dirty}>
          {pending ? "저장 중..." : "저장"}
        </Button>
      </div>
    </aside>
  );
}
