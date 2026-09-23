import Link from "next/link";

import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export default async function ResetPasswordPage({ searchParams }: PageProps<"/reset-password">) {
  const { token } = await searchParams;

  return (
    <div className="flex flex-1 items-center justify-center p-6">
      {typeof token === "string" && token ? (
        <ResetPasswordForm token={token} />
      ) : (
        <div className="flex flex-col gap-3 text-center">
          <p className="text-sm">재설정 링크가 올바르지 않습니다.</p>
          <Link href="/forgot-password" className="text-sm underline">
            재설정 링크 다시 받기
          </Link>
        </div>
      )}
    </div>
  );
}
