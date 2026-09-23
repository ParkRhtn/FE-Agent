"use server";

import { redirect } from "next/navigation";

import { BACKEND_URL } from "@/lib/api/server";
import { clearToken, setToken } from "@/lib/auth";

export type AuthState = { error?: string; email?: string };

function safeNext(value: FormDataEntryValue | null): string {
  // 오픈 리다이렉트 방지: 같은 사이트의 경로만 허용
  const next = typeof value === "string" ? value : "";
  return next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

async function authenticate(mode: "login" | "signup", formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  let response: Response;
  try {
    response = await fetch(new URL(`/api/v1/auth/${mode}`, BACKEND_URL), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password }),
      cache: "no-store",
    });
  } catch {
    return { email, error: "백엔드에 연결할 수 없습니다." };
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const detail = body?.detail;
    const message =
      typeof detail === "string"
        ? detail
        : response.status === 422
          ? "이메일 형식과 비밀번호(8자 이상)를 확인하세요."
          : "요청에 실패했습니다.";
    return { email, error: message };
  }

  const { access_token, expires_in } = (await response.json()) as { access_token: string; expires_in: number };
  await setToken(access_token, expires_in);
  redirect(safeNext(formData.get("next")));
}

export async function login(_prev: AuthState, formData: FormData): Promise<AuthState> {
  return authenticate("login", formData);
}

export async function signup(_prev: AuthState, formData: FormData): Promise<AuthState> {
  return authenticate("signup", formData);
}

export type ResetState = { error?: string; done?: boolean; email?: string };

async function postAuth(path: string, body: unknown): Promise<Response | null> {
  try {
    return await fetch(new URL(`/api/v1/auth/${path}`, BACKEND_URL), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
  } catch {
    return null;
  }
}

export async function requestPasswordReset(_prev: ResetState, formData: FormData): Promise<ResetState> {
  const email = String(formData.get("email") ?? "").trim();
  const response = await postAuth("password-reset/request", { email });
  if (!response) return { email, error: "백엔드에 연결할 수 없습니다." };
  if (!response.ok) return { email, error: "요청에 실패했습니다. 잠시 후 다시 시도하세요." };
  return { email, done: true };
}

export async function confirmPasswordReset(_prev: ResetState, formData: FormData): Promise<ResetState> {
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  if (password !== String(formData.get("passwordConfirm") ?? "")) {
    return { error: "비밀번호가 서로 다릅니다." };
  }

  const response = await postAuth("password-reset/confirm", { token, new_password: password });
  if (!response) return { error: "백엔드에 연결할 수 없습니다." };
  if (!response.ok) {
    const detail = (await response.json().catch(() => null))?.detail;
    return { error: typeof detail === "string" ? detail : "비밀번호는 8자 이상이어야 합니다." };
  }
  // 재설정되면 기존 세션은 백엔드에서 무효가 되므로 쿠키도 정리한다.
  await clearToken();
  redirect("/login?reset=1");
}

export async function logout(): Promise<void> {
  await clearToken();
  redirect("/login");
}
