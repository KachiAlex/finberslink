import { redirect } from "next/navigation";

import { requireSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ChatPage() {
  await requireSession({ failureMode: "redirect" });

  // Temporary fallback route so chat CTA does not 404 in production.
  redirect("/forum");
}
