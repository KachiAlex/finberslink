import { DashboardChatContent } from "@/app/dashboard/chat/chat-content";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function AdminMessagesPage() {
  return (
    <div className="flex flex-col h-full bg-white rounded-3xl border border-slate-200 overflow-hidden">
      {/* Reuse the dashboard chat client component for admin consoles (layout provides session) */}
      <DashboardChatContent />
    </div>
  );
}

