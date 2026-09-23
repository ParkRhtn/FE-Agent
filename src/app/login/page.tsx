import { LoginForm } from "@/components/auth/login-form";

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next } = await searchParams;

  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <LoginForm next={typeof next === "string" ? next : undefined} />
    </div>
  );
}
