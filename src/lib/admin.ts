import { getSession } from "@/lib/session";

// admin না হলে null। page-এ notFound(), action-এ error দেখাবে
export async function requireAdmin() {
  const session = await getSession();
  if (!session || session.user.role !== "admin") return null;
  return session;
}