import { LoginForm } from "@/components/auth/login-form";

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next, reset } = await searchParams;

  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <LoginForm
        next={typeof next === "string" ? next : undefined}
        notice={reset === "1" ? "비밀번호가 변경되었습니다. 새 비밀번호로 로그인하세요." : undefined}
      />
    </div>
  );
}
