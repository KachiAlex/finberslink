import { requireSession } from "@/lib/auth/session";
import { UnifiedChatHub } from "@/features/chat/components/unified-chat-hub";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ChatPage() {
  const session = await requireSession({ failureMode: "redirect" });

  return <UnifiedChatHub currentUserId={session.sub} />;
}
