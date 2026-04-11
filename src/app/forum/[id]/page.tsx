import { requireSession } from "@/lib/auth/session";
import { ForumThreadClient } from "./forum-thread-client";

export default async function ForumThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession({
    failureMode: "redirect",
    redirectTo: "/login?reason=forum-required"
  });

  const resolvedParams = await params;
  const threadId = resolvedParams.id;

  return (
    <ForumThreadClient 
      threadId={threadId} 
      userId={session.sub}
      isAdmin={session.role === "ADMIN" || session.role === "SUPER_ADMIN"}
    />
  );
}
