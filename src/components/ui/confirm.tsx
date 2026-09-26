"use client";

import { AlertDialog } from "@base-ui/react/alert-dialog";
import { cn } from "cn";
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";

export type ConfirmOptions = {
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** 삭제처럼 되돌릴 수 없는 동작이면 확인 버튼을 빨갛게 */
  destructive?: boolean;
};

type Confirm = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<Confirm | null>(null);

/**
 * 앱 모양의 확인창. 브라우저 기본 confirm() 대신 쓴다.
 *
 *   const confirm = useConfirm();
 *   if (!(await confirm({ title: "삭제할까요?", destructive: true }))) return;
 */
export function useConfirm(): Confirm {
  const confirm = useContext(ConfirmContext);
  if (!confirm) throw new Error("useConfirm 은 ConfirmProvider 안에서 써야 합니다.");
  return confirm;
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  // 닫히는 애니메이션 동안에도 내용이 남아 있도록 마지막 옵션을 들고 있는다
  const [options, setOptions] = useState<ConfirmOptions>({ title: "" });
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback<Confirm>((next) => {
    resolveRef.current?.(false); // 이전 확인창이 열려 있었다면 취소로 끝낸다
    setOptions(next);
    setOpen(true);
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
    });
  }, []);

  const finish = (result: boolean) => {
    resolveRef.current?.(result);
    resolveRef.current = null;
    setOpen(false);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <AlertDialog.Root open={open} onOpenChange={(next) => !next && finish(false)}>
        <AlertDialog.Portal>
          <AlertDialog.Backdrop className="fixed inset-0 z-50 bg-black/30 transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0" />
          <AlertDialog.Popup className="bg-background fixed top-1/2 left-1/2 z-50 flex w-[min(420px,calc(100vw-32px))] -translate-x-1/2 -translate-y-1/2 flex-col gap-2 rounded-xl border p-5 shadow-xl transition-[opacity,scale] duration-150 outline-none data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0">
            <AlertDialog.Title className="text-base font-semibold">{options.title}</AlertDialog.Title>
            {options.description && (
              <AlertDialog.Description className="text-muted-foreground text-sm leading-relaxed">
                {options.description}
              </AlertDialog.Description>
            )}
            <div className="mt-3 flex justify-end gap-2">
              <Button variant="outline" onClick={() => finish(false)}>
                {options.cancelLabel ?? "취소"}
              </Button>
              <Button
                onClick={() => finish(true)}
                className={cn(options.destructive && "bg-destructive hover:bg-destructive/90 text-white")}
              >
                {options.confirmLabel ?? "확인"}
              </Button>
            </div>
          </AlertDialog.Popup>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </ConfirmContext.Provider>
  );
}
