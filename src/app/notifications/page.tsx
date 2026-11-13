import { Suspense } from "react";
import { redirect } from "next/navigation";
import NotificationList from "@/components/notifications/notification-list";
import { Container, PageHeader } from "@/components/layout-kit";
import { ListSkeleton } from "@/components/skeletons";
import { getNotifications } from "@/lib/notifications";
import { getSession } from "@/lib/session";
import { timeAgo } from "@/lib/time";

async function NotificationsContent() {
  const session = await getSession();
  if (!session) redirect("/login");

  const items = await getNotifications(session.user.id);
  return <NotificationList items={items.map((n) => ({ ...n, ago: timeAgo(n.createdAt) }))} />;
}

export default function NotificationsPage() {
  return (
    <main>
      <PageHeader title="Notification" description="তোমার কাজ, আবেদন ও হিসাবের সব খবর" />
      <Container className="py-8">
        <div className="mx-auto max-w-3xl">
          <Suspense fallback={<ListSkeleton rows={5} />}>
            <NotificationsContent />
          </Suspense>
        </div>
      </Container>
    </main>
  );
}