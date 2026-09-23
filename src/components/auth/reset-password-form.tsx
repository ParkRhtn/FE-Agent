"use client";

import Link from "next/link";
import { useActionState } from "react";

import { confirmPasswordReset, type ResetState } from "@/app/login/actions";
import { Button } from "@/components/ui/button";

const inputClass = "bg-background w-full rounded-lg border px-2.5 py-2 text-sm";

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState<ResetState, FormData>(confirmPasswordReset, {});

  return (
    <form action={action} className="flex w-full max-w-sm flex-col gap-4">
      <h1 className="text-center text-2xl font-semibold">새 비밀번호 설정</h1>
      <input type="hidden" name="token" value={token} />

      <label className="flex flex-col gap-1.5 text-sm font-medium">
        새 비밀번호
        <input name="password" type="password" required minLength={8} autoComplete="new-password" className={inputClass} />
        <span className="text-muted-foreground text-xs font-normal">8자 이상</span>
      </label>

      <label className="flex flex-col gap-1.5 text-sm font-medium">
        새 비밀번호 확인
        <input
          name="passwordConfirm"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className={inputClass}
        />
      </label>

      {state.error && (
        <p className="text-destructive text-sm">
          {state.error}{" "}
          <Link href="/forgot-password" className="underline">
            다시 요청
          </Link>
        </p>
      )}

      <Button type="submit" disabled={pending} size="lg">
        {pending ? "변경 중..." : "비밀번호 변경"}
      </Button>
    </form>
  );
}
