"use client";

import { cn } from "cn";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { Agent } from "@/lib/api/client";
import { NODE_META, type NodeData, type NodeKind } from "@/lib/workflow";

/** 캔버스로 끌어다 놓을 때 쓰는 dataTransfer 형식 */
export const DRAG_TYPE = "application/x-workflow-node";

export type PaletteItem = {
  key: string;
  kind: NodeKind;
  label: string;
  description: string;
  data?: NodeData;
};

function groups(agents: Agent[]): { title: string; items: PaletteItem[] }[] {
  const base = (kind: NodeKind): PaletteItem => ({
    key: kind,
    kind,
    label: NODE_META[kind].label,
    description: NODE_META[kind].hint,
  });
  return [
    {
      title: "AI",
      items: [
        base("llm"),
        ...agents.map((a) => ({
          key: `agent:${a.id}`,
          kind: "agent" as const,
          label: a.name,
          description: a.description || "만들어 둔 에이전트",
          data: { agent_id: a.id, agent_name: a.name },
        })),
        ...(agents.length === 0 ? [base("agent")] : []),
      ],
    },
    { title: "도구", items: [base("tool")] },
    { title: "흐름", items: [base("condition"), base("end")] },
  ];
}

type NodePaletteProps = {
  agents: Agent[];
  collapsed: boolean;
  disabled: boolean;
  onToggle: () => void;
  onAdd: (item: PaletteItem) => void;
};

export function NodePalette({ agents, collapsed, disabled, onToggle, onAdd }: NodePaletteProps) {
  const sections = groups(agents);
  const dragProps = (item: PaletteItem) => ({
    draggable: !disabled,
    onDragStart: (e: React.DragEvent) => {
      e.dataTransfer.setData(DRAG_TYPE, JSON.stringify(item));
      e.dataTransfer.effectAllowed = "move";
    },
    onClick: () => onAdd(item),
    disabled,
  });

  if (collapsed) {
    return (
      <aside className="bg-background flex w-12 shrink-0 flex-col items-center gap-1 border-r py-2">
        <Button
          type="button"
          onClick={onToggle}
          aria-label="노드 목록 펼치기"
          variant="ghost"
          size="icon-sm"
          className="text-muted-foreground mb-1"
        >
          <PanelLeftOpen className="size-4" />
        </Button>
        {sections
          .flatMap((s) => s.items)
          .map((item) => {
            const Icon = NODE_META[item.kind].icon;
            return (
              <button
                key={item.key}
                type="button"
                title={`${item.label}: ${item.description}`}
                aria-label={`${item.label} 추가`}
                {...dragProps(item)}
                className={cn(
                  "flex size-8 cursor-grab items-center justify-center rounded-lg active:cursor-grabbing disabled:opacity-50",
                  NODE_META[item.kind].tile,
                )}
              >
                <Icon className="size-4" />
              </button>
            );
          })}
      </aside>
    );
  }

  return (
    <aside className="bg-background flex w-64 shrink-0 flex-col border-r">
      <div className="flex h-11 shrink-0 items-center justify-between border-b px-3">
        <span className="text-sm font-semibold">노드</span>
        <Button
          type="button"
          onClick={onToggle}
          aria-label="노드 목록 접기"
          variant="ghost"
          size="icon-sm"
          className="text-muted-foreground"
        >
          <PanelLeftClose className="size-4" />
        </Button>
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-2">
        {sections.map((section) => (
          <section key={section.title} className="flex flex-col gap-0.5">
            <h3 className="text-muted-foreground px-2 pb-1 text-xs font-medium">{section.title}</h3>
            {section.items.map((item) => {
              const Icon = NODE_META[item.kind].icon;
              return (
                <button
                  key={item.key}
                  type="button"
                  {...dragProps(item)}
                  className="hover:bg-muted flex cursor-grab items-start gap-2.5 rounded-lg p-2 text-left active:cursor-grabbing disabled:opacity-50"
                >
                  <span
                    className={cn(
                      "flex size-7 shrink-0 items-center justify-center rounded-lg",
                      NODE_META[item.kind].tile,
                    )}
                  >
                    <Icon className="size-4" />
                  </span>
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate text-sm font-medium">{item.label}</span>
                    <span className="text-muted-foreground line-clamp-2 text-xs leading-snug">{item.description}</span>
                  </span>
                </button>
              );
            })}
          </section>
        ))}
      </div>
    </aside>
  );
}
