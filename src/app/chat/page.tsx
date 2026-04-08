import { redirect } from "next/navigation";

import { requireSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ChatPage() {
  await requireSession({ failureMode: "redirect" });

  // Redirect to the main chat interface at /dashboard/chat
  redirect("/dashboard/chat");
}
