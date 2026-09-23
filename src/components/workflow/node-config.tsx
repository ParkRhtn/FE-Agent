"use client";

import { cn } from "cn";
import { Trash2 } from "lucide-react";
import { useState } from "react";

import { Textarea } from "@/components/ui/textarea";
import { ModelSelect } from "@/components/model-select";
import type { Agent, ModelOption, Tool } from "@/lib/api/client";
import { modelLabel } from "@/lib/models";
import { CONDITION_OPERATORS, NODE_META, type FlowNode, type NodeData, type NodeKind } from "@/lib/workflow";

const inputClass =
  "bg-background focus-visible:border-ring focus-visible:ring-ring/50 w-full rounded-lg border px-2.5 py-1.5 text-sm outline-none focus-visible:ring-3";

type NodeConfigProps = {
  node: FlowNode;
  variables: string[];
  models: ModelOption[];
  defaultModel: string | null;
  tools: Tool[];
  agents: Agent[];
  onChange: (patch: NodeData) => void;
  onDelete: () => void;
};

function Field({ label, hint, children }: { label: string; hint?: React.ReactNode; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium">{label}</span>
      {children}
      {hint && <span className="text-muted-foreground text-xs leading-relaxed">{hint}</span>}
    </label>
  );
}

export function NodeConfig({
  node,
  variables,
  models,
  defaultModel,
  tools,
  agents,
  onChange,
  onDelete,
}: NodeConfigProps) {
  const kind = node.type as NodeKind;
  const meta = NODE_META[kind];
  const Icon = meta.icon;
  // 변수 알약을 누르면 마지막으로 편집한 칸에 넣는다
  const [lastField, setLastField] = useState<string | null>(null);

  const str = (key: string) => (typeof node.data[key] === "string" ? (node.data[key] as string) : "");
  const templateField = (key: string, { rows, placeholder }: { rows?: number; placeholder?: string } = {}) => {
    const common = {
      value: str(key),
      placeholder,
      onFocus: () => setLastField(key),
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange({ [key]: e.target.value }),
    };
    return rows ? (
      <Textarea {...common} rows={rows} className="min-h-0 text-sm leading-relaxed" />
    ) : (
      <input {...common} className={inputClass} />
    );
  };
  const operator = CONDITION_OPERATORS.find((o) => o.value === (str("operator") || "contains"));
  const canInsert = lastField !== null;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start gap-3">
        <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", meta.tile)}>
          <Icon className="size-5" />
        </span>
        <div className="flex min-w-0 flex-col">
          <span className="text-sm font-semibold">{meta.label}</span>
          <span className="text-muted-foreground text-xs">{meta.hint}</span>
        </div>
        {node.deletable !== false && (
          <button
            type="button"
            onClick={onDelete}
            aria-label="노드 삭제"
            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 ml-auto rounded-md p-1.5"
          >
            <Trash2 className="size-4" />
          </button>
        )}
      </div>

      {kind === "start" && (
        <p className="text-muted-foreground text-sm leading-relaxed">
          실행할 때 입력한 내용이 다른 노드에서 <code className="bg-muted rounded px-1 text-xs">{"{{input}}"}</code> 로
          쓰입니다.
        </p>
      )}

      {kind === "llm" && (
        <>
          <Field label="모델">
            <ModelSelect
              options={models}
              value={str("model")}
              onChange={(value) => onChange({ model: value, model_label: modelLabel(models, value) ?? "" })}
              defaultOption={{ label: `기본 모델 (${modelLabel(models, defaultModel) ?? "없음"})` }}
              className={inputClass}
            />
          </Field>
          <Field label="프롬프트">
            {templateField("prompt", { rows: 6, placeholder: "다음 내용을 요약해: {{input}}" })}
          </Field>
          <Field label="시스템 프롬프트" hint="모델의 역할이나 말투를 정합니다. 비워도 됩니다.">
            {templateField("system", { rows: 3 })}
          </Field>
        </>
      )}

      {kind === "agent" && (
        <>
          <Field
            label="에이전트"
            hint={agents.length === 0 ? "아직 에이전트가 없습니다. 에이전트 관리에서 먼저 만드세요." : undefined}
          >
            <select
              value={str("agent_id")}
              onChange={(e) =>
                onChange({
                  agent_id: e.target.value,
                  agent_name: agents.find((a) => a.id === e.target.value)?.name ?? "",
                })
              }
              className={inputClass}
            >
              <option value="">선택하세요</option>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="에이전트에게 보낼 메시지">{templateField("message", { rows: 4 })}</Field>
        </>
      )}

      {kind === "tool" && (
        <>
          <Field label="도구" hint={tools.find((t) => t.name === str("tool"))?.description}>
            <select value={str("tool")} onChange={(e) => onChange({ tool: e.target.value })} className={inputClass}>
              <option value="">선택하세요</option>
              {tools.map((t) => (
                <option key={t.name} value={t.name}>
                  {t.name}
                </option>
              ))}
            </select>
          </Field>
          <Field
            label="인자"
            hint={
              <>
                JSON 객체로 적습니다. 값에 변수를 넣을 수 있습니다. 예:{" "}
                <code className="bg-muted rounded px-1">{'{"timezone": "{{input}}"}'}</code>
              </>
            }
          >
            {templateField("args", { rows: 4 })}
          </Field>
        </>
      )}

      {kind === "condition" && (
        <>
          <Field label="검사할 값">{templateField("left", { placeholder: "{{llm_1}}" })}</Field>
          <Field label="조건">
            <select
              value={str("operator") || "contains"}
              onChange={(e) => onChange({ operator: e.target.value })}
              className={inputClass}
            >
              {CONDITION_OPERATORS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
          {operator?.needsRight && <Field label="비교할 값">{templateField("right")}</Field>}
          <p className="text-muted-foreground text-xs leading-relaxed">
            노드 오른쪽의 <span className="text-emerald-600">참</span>·<span className="text-rose-600">거짓</span>{" "}
            점에서 각각 다음 노드로 연결하세요.
          </p>
        </>
      )}

      {kind === "end" && (
        <Field label="최종 출력" hint="비워두면 이 노드로 들어온 값을 그대로 출력합니다.">
          {templateField("output", { rows: 4, placeholder: "{{llm_1}}" })}
        </Field>
      )}

      {kind !== "start" && (
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium">변수</span>
          <div className="flex flex-wrap gap-1">
            {variables.map((v) => (
              <button
                key={v}
                type="button"
                disabled={!canInsert}
                // 입력 칸의 포커스를 뺏지 않도록 mousedown 기본 동작을 막는다
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => lastField && onChange({ [lastField]: `${str(lastField)}{{${v}}}` })}
                className="bg-muted hover:bg-foreground hover:text-background rounded-md px-1.5 py-0.5 font-mono text-[11px] transition-colors disabled:pointer-events-none"
              >
                {v}
              </button>
            ))}
          </div>
          <span className="text-muted-foreground text-xs">
            {canInsert
              ? "누르면 마지막으로 편집한 칸 끝에 넣습니다."
              : "입력 칸을 누른 뒤 변수를 골라 넣을 수 있습니다."}
          </span>
        </div>
      )}
    </div>
  );
}
