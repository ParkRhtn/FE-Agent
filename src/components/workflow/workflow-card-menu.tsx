"use client";

import { Menu } from "@base-ui/react/menu";
import { Code, Copy, Ellipsis, ExternalLink, Lock, LockOpen, Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { ApiDialog } from "@/components/workflow/api-dialog";
import { api } from "@/lib/api/client";
import type { WorkflowGraph } from "@/lib/workflow";
import { toast } from "sonner";
import { useConfirm } from "@/components/ui/confirm";
import { apiErrorMessage } from "@/lib/api/errors";
import { menuDangerItemClass, menuItemClass, menuPopupClass } from "@/components/ui/menu-styles";


type WorkflowCardMenuProps = {
  id: string;
  name: string;
  graph: WorkflowGraph;
  deleteProtected: boolean;
  published: boolean;
  onRename: () => void;
};

export function WorkflowCardMenu({ id, name, graph, deleteProtected, published, onRename }: WorkflowCardMenuProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [showApi, setShowApi] = useState(false);
  const confirm = useConfirm();

  const duplicate = () =>
    startTransition(async () => {
      const { error } = await api.POST("/api/v1/workflows", { body: { name: `${name} 복사본`.slice(0, 100), graph } });
      if (error) {
        toast.error("복제하지 못했습니다", { description: apiErrorMessage(error) });
        return;
      }
      toast.success(`'${name} 복사본'을 만들었습니다`);
      router.refresh();
    });

  const toggleProtection = () =>
    startTransition(async () => {
      const { error } = await api.PATCH("/api/v1/workflows/{workflow_id}", {
        params: { path: { workflow_id: id } },
        body: { delete_protected: !deleteProtected },
      });
      if (error) {
        toast.error("삭제 보호를 바꾸지 못했습니다", { description: apiErrorMessage(error) });
        return;
      }
      toast.success(deleteProtected ? "삭제 보호를 풀었습니다" : "삭제 보호를 켰습니다");
      router.refresh();
    });

  const remove = async () => {
    const ok = await confirm({
      title: `'${name}' 워크플로우를 삭제할까요?`,
      description: "되돌릴 수 없습니다.",
      confirmLabel: "삭제",
      destructive: true,
    });
    if (!ok) return;
    startTransition(async () => {
      const { error } = await api.DELETE("/api/v1/workflows/{workflow_id}", { params: { path: { workflow_id: id } } });
      if (error) {
        toast.error("삭제하지 못했습니다", { description: apiErrorMessage(error) });
        return;
      }
      toast.success(`'${name}'을 삭제했습니다`);
      router.refresh();
    });
  };

  return (
    <>
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
            <Menu.Popup className={menuPopupClass}>
              <Menu.Item className={menuItemClass} onClick={() => router.push(`/workflows/${id}`)}>
                <ExternalLink className="text-muted-foreground size-4" />
                열기
              </Menu.Item>
              <Menu.Item className={menuItemClass} onClick={onRename}>
                <Pencil className="text-muted-foreground size-4" />
                이름 바꾸기
              </Menu.Item>
              <Menu.Item className={menuItemClass} onClick={duplicate}>
                <Copy className="text-muted-foreground size-4" />
                복제
              </Menu.Item>
              <Menu.Item className={menuItemClass} onClick={() => setShowApi(true)}>
                <Code className="text-muted-foreground size-4" />
                외부에서 쓰기 (API·웹사이트)
              </Menu.Item>
              <Menu.Item className={menuItemClass} onClick={toggleProtection}>
                {deleteProtected ? (
                  <LockOpen className="text-muted-foreground size-4" />
                ) : (
                  <Lock className="text-muted-foreground size-4" />
                )}
                {deleteProtected ? "삭제 보호 풀기" : "삭제 보호"}
              </Menu.Item>
              <Menu.Separator className="bg-border mx-1 my-1 h-px" />
              <Menu.Item
                disabled={deleteProtected}
                className={menuDangerItemClass}
                onClick={remove}
              >
                <Trash2 className="size-4" />
                {deleteProtected ? "삭제 (보호 중)" : "삭제"}
              </Menu.Item>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
      <ApiDialog
        open={showApi}
        onClose={() => setShowApi(false)}
        workflowId={id}
        name={name}
        published={published}
      />
    </>
  );
}
