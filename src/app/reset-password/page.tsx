import { Suspense } from "react";
import { ResetPasswordForm } from "./reset-password-form";

export const metadata = {
  title: "Reset Password | Finbers Link",
};

function ResetPasswordLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="text-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-300 border-t-blue-600 mx-auto mb-4"></div>
        <p className="text-slate-600">Loading...</p>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordLoading />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
