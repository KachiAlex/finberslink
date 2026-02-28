import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function LogoutPage() {
  const store = await cookies();
  store.delete("access_token");
  store.delete("refresh_token");
  redirect("/login");
}
