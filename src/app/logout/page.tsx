"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;

    async function performLogout() {
      try {
        await fetch("/api/auth/logout", {
          method: "POST",
          credentials: "include",
        });
      } catch (error) {
        console.error("Logout request failed", error);
      } finally {
        if (isMounted) {
          router.replace("/login");
        }
      }
    }

    performLogout();
    return () => {
      isMounted = false;
    };
  }, [router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#01030c] text-white">
      <div className="flex flex-col items-center gap-3 rounded-3xl border border-white/10 bg-white/5 px-8 py-6 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-white/70" />
        <div>
          <p className="text-lg font-semibold">Signing you out</p>
          <p className="text-sm text-white/70">Please hold on for just a moment…</p>
        </div>
      </div>
    </div>
  );
}
