"use client";

import Link from "next/link";
import { useActionState } from "react";

import { requestPasswordReset, type ResetState } from "@/app/login/actions";
import { Button } from "@/components/ui/button";

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState<ResetState, FormData>(requestPasswordReset, {});

  if (state.done) {
    return (
      <div className="flex w-full max-w-sm flex-col gap-4 text-center">
        <h1 className="text-2xl font-semibold">메일을 확인하세요</h1>
        <p className="text-muted-foreground text-sm">
          <span className="text-foreground font-medium">{state.email}</span> 이 가입된 이메일이라면 비밀번호 재설정
          링크를 보냈습니다. 링크는 30분 동안 유효합니다.
        </p>
        <Link href="/login" className="text-muted-foreground text-sm hover:underline">
          로그인으로 돌아가기
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="flex w-full max-w-sm flex-col gap-4">
      <div className="flex flex-col gap-1 text-center">
        <h1 className="text-2xl font-semibold">비밀번호 찾기</h1>
        <p className="text-muted-foreground text-sm">가입한 이메일로 재설정 링크를 보내드립니다.</p>
      </div>

      <label className="flex flex-col gap-1.5 text-sm font-medium">
        이메일
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          defaultValue={state.email}
          className="bg-background w-full rounded-lg border px-2.5 py-2 text-sm"
        />
      </label>

      {state.error && <p className="text-destructive text-sm">{state.error}</p>}

      <Button type="submit" disabled={pending} size="lg">
        {pending ? "보내는 중..." : "재설정 링크 받기"}
      </Button>
      <Link href="/login" className="text-muted-foreground text-center text-sm hover:underline">
        로그인으로 돌아가기
      </Link>
    </form>
  );
}
