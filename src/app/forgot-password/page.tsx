import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { Logo } from "@/components/logo";

export default function ForgotPasswordPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 p-6">
      <Logo className="text-lg [&_svg]:size-8" />
      <ForgotPasswordForm />
    </div>
  );
}
