"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { NewThreadButton } from "@/components/new-thread-button";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { api, type Agent, type Tool } from "@/lib/api/client";

type AgentFormProps = {
  agent?: Agent;
  models: string[];
  defaultModel: string;
  tools: Tool[];
};

const inputClass = "bg-background w-full rounded-lg border px-2.5 py-1.5 text-sm";

export function AgentForm({ agent, models, defaultModel, tools }: AgentFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: agent?.name ?? "",
    description: agent?.description ?? "",
    system_prompt: agent?.system_prompt ?? "",
    model: agent?.model ?? defaultModel,
    tools: agent?.tools ?? tools.map((t) => t.name),
  });

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const toggleTool = (name: string) =>
    set("tools", form.tools.includes(name) ? form.tools.filter((t) => t !== name) : [...form.tools, name]);

  const save = () =>
    startTransition(async () => {
      setError(null);
      const body = { ...form, description: form.description || null };
      const { data, error } = agent
        ? await api.PATCH("/api/v1/agents/{agent_id}", { params: { path: { agent_id: agent.id } }, body })
        : await api.POST("/api/v1/agents", { body });
      if (error || !data) {
        setError("저장에 실패했습니다. 입력값을 확인하세요.");
        return;
      }
      router.push(`/agents/${data.id}`);
      router.refresh();
    });

  const remove = () =>
    startTransition(async () => {
      if (!agent || !confirm(`'${agent.name}' 에이전트를 삭제할까요?`)) return;
      await api.DELETE("/api/v1/agents/{agent_id}", { params: { path: { agent_id: agent.id } } });
      router.push("/agents");
      router.refresh();
    });

  return (
    <form
      className="mx-auto flex w-full max-w-2xl flex-col gap-5 p-6 pt-14"
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">{agent ? agent.name : "새 에이전트"}</h1>
        {agent && <NewThreadButton agentId={agent.id} label="이 에이전트로 대화" />}
      </div>

      <label className="flex flex-col gap-1.5 text-sm font-medium">
        이름
        <input required maxLength={100} value={form.name} onChange={(e) => set("name", e.target.value)} className={inputClass} />
      </label>

      <label className="flex flex-col gap-1.5 text-sm font-medium">
        설명 <span className="text-muted-foreground text-xs font-normal">(선택)</span>
        <input
          maxLength={500}
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          className={inputClass}
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm font-medium">
        시스템 프롬프트
        <Textarea
          required
          rows={8}
          value={form.system_prompt}
          onChange={(e) => set("system_prompt", e.target.value)}
          placeholder="예: 너는 친절한 영어 번역가야. 사용자의 문장을 자연스러운 영어로 번역해."
          className="min-h-40 font-mono"
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm font-medium">
        모델
        <select value={form.model} onChange={(e) => set("model", e.target.value)} className={inputClass}>
          {models.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </label>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1.5 text-sm font-medium">도구</legend>
        {tools.length === 0 && <p className="text-muted-foreground text-sm">사용 가능한 도구가 없습니다.</p>}
        {tools.map((tool) => (
          <label key={tool.name} className="hover:bg-muted/50 flex gap-2 rounded-lg border p-2.5 text-sm">
            <input type="checkbox" checked={form.tools.includes(tool.name)} onChange={() => toggleTool(tool.name)} />
            <span className="flex flex-col">
              <span className="font-mono">{tool.name}</span>
              <span className="text-muted-foreground text-xs">{tool.description}</span>
            </span>
          </label>
        ))}
      </fieldset>

      {error && <p className="text-destructive text-sm">{error}</p>}

      <div className="flex justify-between gap-2">
        {agent ? (
          <Button type="button" variant="destructive" onClick={remove} disabled={pending}>
            삭제
          </Button>
        ) : (
          <span />
        )}
        <Button type="submit" disabled={pending}>
          {pending ? "저장 중..." : "저장"}
        </Button>
      </div>
    </form>
  );
}
