
import { requireSession } from "@/lib/auth/session";
import { DashboardChatContent } from "./chat-content";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardChatPage() {
  const session = await requireSession({ failureMode: "redirect" });

  return (
    <div className="flex flex-col h-full bg-white rounded-3xl border border-slate-200 overflow-hidden">
      <DashboardChatContent currentUserId={session.sub} />
    </div>
  );
}
