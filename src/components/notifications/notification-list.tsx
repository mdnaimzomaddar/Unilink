"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import type { IconType } from "react-icons";
import { markAllNotificationsRead, markNotificationRead } from "@/app/actions/notifications";
import type { NotificationDTO } from "@/lib/notifications";
import {
  IconAward,
  IconBan,
  IconBell,
  IconCheck,
  IconGraduation,
  IconSend,
  IconStar,
  IconZap,
} from "@/components/icons";

type Item = NotificationDTO & { ago: string };

const META: Record<string, { icon: IconType; tone: string }> = {
  application: { icon: IconSend, tone: "bg-indigo-50 text-indigo-600" },
  hired: { icon: IconAward, tone: "bg-emerald-50 text-emerald-600" },
  completed: { icon: IconCheck, tone: "bg-emerald-50 text-emerald-600" },
  job_closed: { icon: IconBan, tone: "bg-slate-100 text-slate-600" },
  review: { icon: IconStar, tone: "bg-amber-50 text-amber-600" },
  purchase: { icon: IconZap, tone: "bg-amber-50 text-amber-600" },
  faculty: { icon: IconGraduation, tone: "bg-violet-50 text-violet-600" },
  verification: { icon: IconGraduation, tone: "bg-sky-50 text-sky-600" },
};

function Group({
  title,
  items,
  onOpen,
}: {
  title: string;
  items: Item[];
  onOpen: (n: Item) => void;
}) {
  return (
    <section className="space-y-2">
      <h2 className="px-1 text-xs font-semibold uppercase tracking-wide text-slate-400">{title}</h2>
      <ul className="divide-y overflow-hidden rounded-2xl border bg-white shadow-sm">
        {items.map((n) => {
          const m = META[n.type] ?? { icon: IconBell, tone: "bg-slate-100 text-slate-600" };
          const Icon = m.icon;
          return (
            <li key={n.id}>
              <button
                type="button"
                onClick={() => onOpen(n)}
                className={`flex w-full items-start gap-4 p-4 text-left transition hover:bg-slate-50 ${
                  n.read ? "" : "bg-indigo-50/50"
                }`}
              >
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${m.tone}`}>
                  <Icon className="h-[18px] w-[18px]" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className={`block text-sm ${n.read ? "text-slate-600" : "font-medium"}`}>
                    {n.text}
                  </span>
                  <span className="text-xs text-slate-400">{n.ago}</span>
                </span>
                {!n.read && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-indigo-600" />}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export default function NotificationList({ items }: { items: Item[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const unreadItems = items.filter((i) => !i.read);
  const readItems = items.filter((i) => i.read);

  async function open(item: Item) {
    if (!item.read) await markNotificationRead(item.id);
    router.push(item.link);
    router.refresh();
  }

  async function readAll() {
    setBusy(true);
    await markAllNotificationsRead();
    setBusy(false);
    toast.success("সব notification পড়া হয়েছে");
    router.refresh();
  }

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed bg-white px-6 py-16 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
          <IconBell className="h-6 w-6" />
        </span>
        <p className="mt-4 font-medium">এখনো কোনো notification নেই</p>
        <p className="mt-1 text-sm text-slate-500">
          কেউ আবেদন করলে, hire হলে বা কাজ সম্পন্ন হলে এখানে জানানো হবে।
        </p>
        <Link
          href="/jobs"
          className="mt-5 inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          কাজ খোঁজো
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          {unreadItems.length > 0 ? `${unreadItems.length}টি অপঠিত` : "সব পড়া হয়েছে"}
        </p>
        {unreadItems.length > 0 && (
          <button
            type="button"
            onClick={readAll}
            disabled={busy}
            className="text-sm font-medium text-indigo-600 hover:underline disabled:opacity-50"
          >
            সব পড়া হয়েছে চিহ্নিত করো
          </button>
        )}
      </div>

      {unreadItems.length > 0 && <Group title="নতুন" items={unreadItems} onOpen={open} />}
      {readItems.length > 0 && <Group title="আগের" items={readItems} onOpen={open} />}
    </div>
  );
}