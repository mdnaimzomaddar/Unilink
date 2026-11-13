import { Suspense } from "react";
import NavClient, { type NavUser } from "@/components/nav-client";
import { getSession } from "@/lib/session";
import { getWalletSummary } from "@/lib/wallet";
import { getUnreadCount } from "@/lib/chat";
import { getUnreadNotificationCount } from "@/lib/notifications";

async function NavData() {
  const session = await getSession();
  let user: NavUser | null = null;

  if (session) {
    const [wallet, chat, notif] = await Promise.all([
      getWalletSummary(session.user.id),
      getUnreadCount(session.user.id),
      getUnreadNotificationCount(session.user.id),
    ]);
    user = {
      name: session.user.name,
      email: session.user.email,
      role: session.user.role ?? "student",
      notif,
      chat,
      connects: wallet.balance,
      silver: wallet.silverCredits,
    };
  }

  return <NavClient user={user} />;
}

export default function Navbar() {
  return (
    // লোড হওয়ার সময় শুধু লোগো ও মেনু দেখায়, বোতাম লাফায় না
    <Suspense fallback={<NavClient user={null} loading />}>
      <NavData />
    </Suspense>
  );
}