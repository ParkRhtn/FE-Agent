"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import { login, signup, type AuthState } from "@/app/login/actions";

const inputClass = "bg-background w-full rounded-lg border px-2.5 py-2 text-sm";

export function LoginForm({ next, notice }: { next?: string; notice?: string }) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [loginState, loginAction, loginPending] = useActionState<AuthState, FormData>(login, {});
  const [signupState, signupAction, signupPending] = useActionState<AuthState, FormData>(signup, {});

  const isLogin = mode === "login";
  const state = isLogin ? loginState : signupState;
  const pending = loginPending || signupPending;

  return (
    <form action={isLogin ? loginAction : signupAction} className="flex w-full max-w-sm flex-col gap-4">
      <h1 className="text-center text-2xl font-semibold">{isLogin ? "로그인" : "회원가입"}</h1>
      <input type="hidden" name="next" value={next ?? "/"} />
      {notice && !state.error && (
        <p className="bg-muted rounded-lg px-3 py-2 text-center text-sm">{notice}</p>
      )}

      <label className="flex flex-col gap-1.5 text-sm font-medium">
        이메일
        <input
          key={`email-${mode}`}
          name="email"
          type="email"
          required
          autoComplete="email"
          defaultValue={state.email}
          className={inputClass}
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm font-medium">
        비밀번호
        <input
          name="password"
          type="password"
          required
          minLength={isLogin ? undefined : 8}
          autoComplete={isLogin ? "current-password" : "new-password"}
          className={inputClass}
        />
        {!isLogin && <span className="text-muted-foreground text-xs font-normal">8자 이상</span>}
      </label>
      {isLogin && (
        <Link href="/forgot-password" className="text-muted-foreground -mt-2 self-end text-xs hover:underline">
          비밀번호를 잊으셨나요?
        </Link>
      )}

      {state.error && <p className="text-destructive text-sm">{state.error}</p>}

      <Button type="submit" disabled={pending} size="lg">
        {pending ? "처리 중..." : isLogin ? "로그인" : "가입하기"}
      </Button>

      <Button
        type="button"
        onClick={() => setMode(isLogin ? "signup" : "login")}
        variant="link"
        size="inline"
        className="text-muted-foreground self-center font-normal"
      >
        {isLogin ? "계정이 없으신가요? 회원가입" : "이미 계정이 있으신가요? 로그인"}
      </Button>
    </form>
  );
}
