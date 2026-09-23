"use client";

import { Menu } from "@base-ui/react/menu";
import { Copy, Ellipsis, ExternalLink, Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { api } from "@/lib/api/client";
import type { WorkflowGraph } from "@/lib/workflow";

const itemClass =
  "flex cursor-default items-center gap-2 rounded-md px-2.5 py-1.5 text-sm outline-hidden select-none data-highlighted:bg-muted";

type WorkflowCardMenuProps = { id: string; name: string; graph: WorkflowGraph; onRename: () => void };

export function WorkflowCardMenu({ id, name, graph, onRename }: WorkflowCardMenuProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const duplicate = () =>
    startTransition(async () => {
      await api.POST("/api/v1/workflows", { body: { name: `${name} 복사본`.slice(0, 100), graph } });
      router.refresh();
    });

  const remove = () => {
    if (!confirm(`'${name}' 워크플로우를 삭제할까요? 되돌릴 수 없습니다.`)) return;
    startTransition(async () => {
      await api.DELETE("/api/v1/workflows/{workflow_id}", { params: { path: { workflow_id: id } } });
      router.refresh();
    });
  };

  return (
    <Menu.Root>
      <Menu.Trigger
        aria-label={`${name} 메뉴`}
        disabled={pending}
        className="bg-background/90 text-muted-foreground hover:text-foreground data-popup-open:text-foreground focus-visible:ring-ring/50 flex size-8 items-center justify-center rounded-lg border shadow-xs outline-none focus-visible:ring-3 disabled:opacity-50"
      >
        <Ellipsis className="size-4" />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner className="z-50 outline-hidden" sideOffset={6} align="end">
          <Menu.Popup className="bg-background min-w-40 origin-[var(--transform-origin)] rounded-lg border p-1 shadow-md outline-hidden transition-[scale,opacity] duration-100 data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0">
            <Menu.Item className={itemClass} onClick={() => router.push(`/workflows/${id}`)}>
              <ExternalLink className="text-muted-foreground size-4" />
              열기
            </Menu.Item>
            <Menu.Item className={itemClass} onClick={onRename}>
              <Pencil className="text-muted-foreground size-4" />
              이름 바꾸기
            </Menu.Item>
            <Menu.Item className={itemClass} onClick={duplicate}>
              <Copy className="text-muted-foreground size-4" />
              복제
            </Menu.Item>
            <Menu.Separator className="bg-border mx-1 my-1 h-px" />
            <Menu.Item className={`${itemClass} text-destructive data-highlighted:bg-destructive/10`} onClick={remove}>
              <Trash2 className="size-4" />
              삭제
            </Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
