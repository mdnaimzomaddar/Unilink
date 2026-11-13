import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { IconType } from "react-icons";
import Avatar from "@/components/avatar";
import { Container } from "@/components/layout-kit";
import { DashboardSkeleton } from "@/components/skeletons";
import { TypeBadge } from "@/components/jobs/job-card";
import {
  IconBriefcase,
  IconChat,
  IconCheck,
  IconChevronRight,
  IconGraduation,
  IconGrid,
  IconMedal,
  IconPlus,
  IconSearch,
  IconSend,
  IconUniversity,
  IconZap,
} from "@/components/icons";
import { getSession } from "@/lib/session";
import { getMyApplications, getMyJobs } from "@/lib/dashboard";
import { getMyChats } from "@/lib/chat";
import { getRecentTransactions, getWalletSummary } from "@/lib/wallet";
import { getUniversityNames, isVerifiedMember } from "@/lib/university";
import SignOutButton from "./sign-out-button";

type SP = Promise<{ tab?: string }>;

const TABS: { key: string; label: string; icon: IconType }[] = [
  { key: "overview", label: "Overview", icon: IconGrid },
  { key: "jobs", label: "আমার Job", icon: IconBriefcase },
  { key: "applications", label: "আমার আবেদন", icon: IconSend },
  { key: "messages", label: "Messages", icon: IconChat },
  { key: "wallet", label: "Connect ও Silver post", icon: IconZap },
];

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

const JOB_STATUS: Record<string, { label: string; style: string }> = {
  open: { label: "Open", style: "bg-emerald-50 text-emerald-700" },
  in_progress: { label: "কাজ চলছে", style: "bg-sky-50 text-sky-700" },
  completed: { label: "সম্পন্ন", style: "bg-violet-50 text-violet-700" },
  closed: { label: "বন্ধ", style: "bg-slate-100 text-slate-600" },
};

const APP_STATUS: Record<string, { label: string; style: string }> = {
  pending: { label: "অপেক্ষায়", style: "bg-slate-100 text-slate-700" },
  hired: { label: "Hired", style: "bg-emerald-100 text-emerald-800" },
  rejected: { label: "Reject", style: "bg-red-50 text-red-600" },
};

const TX_REASON: Record<string, string> = {
  signup_bonus: "Signup বোনাস",
  verify_bonus: "University verify বোনাস",
  apply: "Apply খরচ",
  refund: "ফেরত",
  completion_refund: "কাজ সম্পূর্ণের ফেরত",
  purchase: "Connect কেনা",
  silver_post: "Silver job post",
  silver_refund: "Silver post ফেরত",
  admin_adjust: "Admin adjust",
};

const ROLE_LABEL: Record<string, string> = {
  admin: "Admin",
  faculty: "Faculty",
  student: "সদস্য",
};

const TONES = {
  indigo: "bg-indigo-50 text-indigo-600",
  amber: "bg-amber-50 text-amber-600",
  emerald: "bg-emerald-50 text-emerald-600",
  slate: "bg-slate-100 text-slate-600",
};

function Pill({ meta }: { meta: { label: string; style: string } }) {
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${meta.style}`}>{meta.label}</span>
  );
}

function Empty({ text, href, cta }: { text: string; href?: string; cta?: string }) {
  return (
    <div className="rounded-2xl border border-dashed bg-white p-10 text-center text-sm text-slate-500">
      <p>{text}</p>
      {href && cta && (
        <Link
          href={href}
          className="mt-3 inline-block rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700"
        >
          {cta}
        </Link>
      )}
    </div>
  );
}

function Panel({
  title,
  action,
  children,
}: {
  title: string;
  action?: { href: string; label: string };
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b px-5 py-4">
        <h2 className="font-semibold">{title}</h2>
        {action && (
          <Link
            href={action.href}
            className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:underline"
          >
            {action.label} <IconChevronRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  tone = "indigo",
  href,
}: {
  icon: IconType;
  label: string;
  value: number;
  hint?: string;
  tone?: keyof typeof TONES;
  href?: string;
}) {
  const body = (
    <div className="flex h-full items-start justify-between gap-3 rounded-2xl border bg-white p-5 shadow-sm transition hover:shadow-md">
      <div>
        <p className="text-sm text-slate-500">{label}</p>
        <p className="mt-1 text-3xl font-bold tracking-tight">{value}</p>
        {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
      </div>
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${TONES[tone]}`}>
        <Icon className="h-5 w-5" />
      </span>
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

/* ───────── Overview ───────── */

async function Overview({ userId, verified }: { userId: string; verified: boolean }) {
  const [jobs, apps, wallet, chats] = await Promise.all([
    getMyJobs(userId),
    getMyApplications(userId),
    getWalletSummary(userId),
    getMyChats(userId),
  ]);

  const openJobs = jobs.filter((j) => j.status === "open");
  const pendingApplicants = openJobs.reduce((s, j) => s + j.pendingApplicants, 0);
  const hired = apps.filter((a) => a.status === "hired").length;
  const unread = chats.reduce((s, c) => s + c.unread, 0);

  const steps = [
    { done: true, label: "Account খোলা হয়েছে", href: null as string | null },
    { done: verified, label: "University verify করা", href: "/verify-university" },
    { done: jobs.length > 0, label: "প্রথম job post করা", href: "/jobs/new" },
    { done: apps.length > 0, label: "প্রথম আবেদন করা", href: "/jobs" },
  ];
  const doneCount = steps.filter((s) => s.done).length;
  const pct = Math.round((doneCount / steps.length) * 100);

  return (
    <div className="space-y-6">
      {(pendingApplicants > 0 || unread > 0) && (
        <div className="grid gap-3 sm:grid-cols-2">
          {pendingApplicants > 0 && (
            <Link
              href="/dashboard?tab=jobs"
              className="flex items-center justify-between gap-3 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800 ring-1 ring-amber-200"
            >
              <span>
                <b>{pendingApplicants} জন</b> আবেদনকারীর সিদ্ধান্ত বাকি
              </span>
              <IconChevronRight className="h-4 w-4" />
            </Link>
          )}
          {unread > 0 && (
            <Link
              href="/dashboard?tab=messages"
              className="flex items-center justify-between gap-3 rounded-xl bg-indigo-50 px-4 py-3 text-sm text-indigo-700 ring-1 ring-indigo-200"
            >
              <span>
                <b>{unread}টি</b> নতুন message
              </span>
              <IconChevronRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={IconBriefcase}
          label="আমার Job"
          value={jobs.length}
          hint={`${openJobs.length}টি open`}
          href="/dashboard?tab=jobs"
        />
        <StatCard
          icon={IconSend}
          label="আমার আবেদন"
          value={apps.length}
          hint={`${hired}টি hired`}
          tone="emerald"
          href="/dashboard?tab=applications"
        />
        <StatCard
          icon={IconZap}
          label="Connect"
          value={wallet.balance}
          hint="Apply-এর ক্রেডিট"
          tone="amber"
          href="/dashboard?tab=wallet"
        />
        <StatCard
          icon={IconMedal}
          label="Silver post বাকি"
          value={wallet.silverCredits}
          hint="ফ্রি job post"
          tone="slate"
          href="/dashboard?tab=wallet"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="শুরু করার ধাপ">
          <div className="space-y-4">
            <div>
              <div className="mb-1.5 flex justify-between text-xs text-slate-500">
                <span>
                  {doneCount}/{steps.length} সম্পন্ন
                </span>
                <span>{pct}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-indigo-600 transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
            <ul className="space-y-2.5">
              {steps.map((s) => (
                <li key={s.label} className="flex items-center gap-3 text-sm">
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                      s.done
                        ? "bg-emerald-500 text-white"
                        : "border border-slate-300 text-transparent"
                    }`}
                  >
                    <IconCheck className="h-3 w-3" />
                  </span>
                  {s.done || !s.href ? (
                    <span className={s.done ? "text-slate-500 line-through" : ""}>{s.label}</span>
                  ) : (
                    <Link href={s.href} className="font-medium text-indigo-600 hover:underline">
                      {s.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </Panel>

        <Panel title="দ্রুত কাজ">
          <div className="grid gap-3 sm:grid-cols-2">
            <Link
              href="/jobs/new"
              className="flex items-center gap-2.5 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-indigo-700"
            >
              <IconPlus className="h-4 w-4" /> নতুন Job post
            </Link>
            <Link
              href="/jobs"
              className="flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm font-medium transition hover:bg-slate-50"
            >
              <IconSearch className="h-4 w-4" /> কাজ খোঁজো
            </Link>
            <Link
              href="/connects/buy"
              className="flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm font-medium transition hover:bg-slate-50"
            >
              <IconZap className="h-4 w-4" /> Connect কেনো
            </Link>
            <Link
              href="/notifications"
              className="flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm font-medium transition hover:bg-slate-50"
            >
              <IconChat className="h-4 w-4" /> Notification
            </Link>
          </div>
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="সাম্প্রতিক Job" action={{ href: "/dashboard?tab=jobs", label: "সব" }}>
          {jobs.length === 0 ? (
            <p className="text-sm text-slate-500">এখনো কোনো job post করোনি।</p>
          ) : (
            <ul className="divide-y">
              {jobs.slice(0, 4).map((j) => (
                <li key={j.id}>
                  <Link
                    href={`/jobs/${j.id}`}
                    className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">{j.title}</span>
                      <span className="text-xs text-slate-500">
                        {fmtDate(j.createdAt)} · আবেদন {j.totalApplicants}
                      </span>
                    </span>
                    <Pill meta={JOB_STATUS[j.status] ?? JOB_STATUS.closed} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="সাম্প্রতিক আবেদন" action={{ href: "/dashboard?tab=applications", label: "সব" }}>
          {apps.length === 0 ? (
            <p className="text-sm text-slate-500">এখনো কোনো job-এ apply করোনি।</p>
          ) : (
            <ul className="divide-y">
              {apps.slice(0, 4).map((a) =>
                a.job ? (
                  <li key={a.id}>
                    <Link
                      href={`/jobs/${a.job.id}`}
                      className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium">{a.job.title}</span>
                        <span className="text-xs text-slate-500">{fmtDate(a.createdAt)}</span>
                      </span>
                      <Pill meta={APP_STATUS[a.status]} />
                    </Link>
                  </li>
                ) : null
              )}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}

/* ───────── বাকি ট্যাব ───────── */

async function JobsTab({ userId }: { userId: string }) {
  const jobs = await getMyJobs(userId);
  if (jobs.length === 0) {
    return <Empty text="তুমি এখনো কোনো job post করোনি।" href="/jobs/new" cta="+ প্রথম job post করো" />;
  }
  return (
    <div className="space-y-3">
      {jobs.map((j) => (
        <Link
          key={j.id}
          href={`/jobs/${j.id}`}
          className="flex items-center justify-between gap-3 rounded-2xl border bg-white p-4 shadow-sm transition hover:shadow-md"
        >
          <div className="min-w-0 space-y-1">
            <p className="truncate font-semibold">{j.title}</p>
            <p className="text-xs text-slate-500">
              {fmtDate(j.createdAt)} · আবেদন {j.totalApplicants}
              {j.pendingApplicants > 0 && ` (অপেক্ষায় ${j.pendingApplicants})`}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <TypeBadge type={j.type} />
            <Pill meta={JOB_STATUS[j.status] ?? JOB_STATUS.closed} />
          </div>
        </Link>
      ))}
    </div>
  );
}

async function ApplicationsTab({ userId }: { userId: string }) {
  const apps = await getMyApplications(userId);
  if (apps.length === 0) {
    return <Empty text="তুমি এখনো কোনো job-এ apply করোনি।" href="/jobs" cta="কাজ খোঁজো" />;
  }
  return (
    <div className="space-y-3">
      {apps.map((a) =>
        a.job ? (
          <Link
            key={a.id}
            href={`/jobs/${a.job.id}`}
            className="flex items-center justify-between gap-3 rounded-2xl border bg-white p-4 shadow-sm transition hover:shadow-md"
          >
            <div className="min-w-0 space-y-1">
              <p className="truncate font-semibold">{a.job.title}</p>
              <p className="flex flex-wrap items-center gap-x-1.5 text-xs text-slate-500">
                {fmtDate(a.createdAt)}
                {a.connectsSpent > 0 && (
                  <span className="inline-flex items-center gap-0.5">
                    · <IconZap className="h-3 w-3" /> {a.connectsSpent} খরচ
                  </span>
                )}
                {a.refunded && (
                  <span className="inline-flex items-center gap-0.5 text-emerald-600">
                    · <IconCheck className="h-3 w-3" /> connect ফেরত পেয়েছ
                  </span>
                )}
                {a.status === "hired" && <span>· যোগাযোগের তথ্য দেখো</span>}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <TypeBadge type={a.job.type} />
              <Pill meta={APP_STATUS[a.status]} />
            </div>
          </Link>
        ) : null
      )}
    </div>
  );
}

async function MessagesTab({ userId }: { userId: string }) {
  const chats = await getMyChats(userId);
  if (chats.length === 0) {
    return <Empty text="কাউকে hire করার বা hire হওয়ার পর এখানে chat দেখা যাবে।" />;
  }
  return (
    <div className="space-y-3">
      {chats.map((c) => (
        <Link
          key={c.jobId}
          href={`/jobs/${c.jobId}`}
          className="flex items-center gap-3 rounded-2xl border bg-white p-4 shadow-sm transition hover:shadow-md"
        >
          <Avatar name={c.otherName} size="h-10 w-10" text="text-sm" />
          <div className="min-w-0 flex-1 space-y-0.5">
            <p className="truncate font-semibold">{c.otherName}</p>
            <p className="truncate text-xs text-slate-500">
              {c.title}
              {c.lastText ? ` · ${c.lastText}` : " · এখনো কোনো message নেই"}
            </p>
          </div>
          {c.unread > 0 && (
            <span className="shrink-0 rounded-full bg-indigo-600 px-2 py-0.5 text-xs font-medium text-white">
              {c.unread}
            </span>
          )}
        </Link>
      ))}
    </div>
  );
}

async function WalletTab({ userId }: { userId: string }) {
  const [wallet, txs] = await Promise.all([getWalletSummary(userId), getRecentTransactions(userId)]);
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <p className="flex items-center gap-1.5 text-sm text-slate-500">
            <IconZap className="h-4 w-4" /> Connect
          </p>
          <p className="text-4xl font-bold text-amber-600">{wallet.balance}</p>
          <p className="mt-2 text-xs text-slate-500">Golden ও Premium job-এ apply করতে লাগে।</p>
        </div>
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <p className="flex items-center gap-1.5 text-sm text-slate-500">
            <IconMedal className="h-4 w-4" /> Silver post বাকি
          </p>
          <p className="text-4xl font-bold text-slate-700">{wallet.silverCredits}</p>
          <p className="mt-2 text-xs text-slate-500">প্রতি ৫ connect কিনলে ১টা নতুন Silver post পাবে।</p>
        </div>
      </div>

      <Link
        href="/connects/buy"
        className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
      >
        <IconPlus className="h-4 w-4" /> Connect কেনো
      </Link>

      <div className="rounded-2xl border bg-white shadow-sm">
        <h3 className="border-b p-4 font-semibold">সাম্প্রতিক হিসাব</h3>
        {txs.length === 0 ? (
          <p className="p-4 text-sm text-slate-500">এখনো কোনো লেনদেন নেই।</p>
        ) : (
          <ul className="divide-y">
            {txs.map((t) => {
              const Icon = t.unit === "silver" ? IconMedal : IconZap;
              return (
                <li key={t.id} className="flex items-center justify-between p-4 text-sm">
                  <div>
                    <p className="font-medium">{TX_REASON[t.reason] ?? t.reason}</p>
                    <p className="text-xs text-slate-500">{fmtDate(t.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <p
                      className={`inline-flex items-center gap-1 font-semibold ${
                        t.amount >= 0 ? "text-emerald-600" : "text-red-600"
                      }`}
                    >
                      {t.amount >= 0 ? `+${t.amount}` : t.amount}
                      <Icon className="h-3.5 w-3.5" />
                    </p>
                    {t.balanceAfter !== undefined && (
                      <p className="text-xs text-slate-400">বাকি {t.balanceAfter}</p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

/* ───────── মূল কাঠামো ───────── */

async function DashboardContent({ searchParams }: { searchParams: SP }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { tab } = await searchParams;
  const active = TABS.some((t) => t.key === tab) ? (tab as string) : "overview";
  const { user } = session;
  const verified = isVerifiedMember(user);

  const uniName = verified
    ? (await getUniversityNames([user.university]))[user.university]
    : null;
  const current = TABS.find((t) => t.key === active)!;

  return (
    <Container className="py-8">
      <div className="grid gap-6 lg:grid-cols-[16rem_1fr] xl:grid-cols-[18rem_1fr]">
        {/* পাশের অংশ */}
        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <Avatar name={user.name} size="h-14 w-14" text="text-xl" />
              <div className="min-w-0">
                <p className="truncate font-semibold">{user.name}</p>
                <p className="truncate text-xs text-slate-500">{user.email}</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-indigo-50 px-2.5 py-1 font-medium text-indigo-700">
                {ROLE_LABEL[user.role ?? "student"] ?? "সদস্য"}
              </span>
              {uniName ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 font-medium text-emerald-700">
                  <IconUniversity className="h-3 w-3" /> {uniName}
                </span>
              ) : (
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-500">
                  University verify হয়নি
                </span>
              )}
            </div>
          </div>

          <nav className="rounded-2xl border bg-white p-2 shadow-sm">
            <div className="flex gap-1 overflow-x-auto lg:flex-col">
              {TABS.map((t) => {
                const Icon = t.icon;
                return (
                  <Link
                    key={t.key}
                    href={t.key === "overview" ? "/dashboard" : `/dashboard?tab=${t.key}`}
                    className={`flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                      active === t.key
                        ? "bg-indigo-50 text-indigo-700"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    <Icon className="h-4 w-4" /> {t.label}
                  </Link>
                );
              })}
            </div>
          </nav>

          {!verified && (
            <Link
              href="/verify-university"
              className="flex items-start gap-2 rounded-xl bg-sky-50 p-3 text-xs text-sky-800 ring-1 ring-sky-200"
            >
              <IconUniversity className="mt-0.5 h-4 w-4 shrink-0" />
              University verify করলে Offline কাজ ও বোনাস আনলক হবে →
            </Link>
          )}

          {user.role === "student" && (
            <Link
              href="/faculty/apply"
              className="flex items-start gap-2 rounded-xl bg-violet-50 p-3 text-xs text-violet-800 ring-1 ring-violet-200"
            >
              <IconGraduation className="mt-0.5 h-4 w-4 shrink-0" />
              তুমি কি faculty? Verify করে Premium job post করো →
            </Link>
          )}

          <SignOutButton />
        </aside>

        {/* মূল অংশ */}
        <div className="min-w-0 space-y-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {active === "overview" ? `হ্যালো, ${user.name.split(" ")[0]}` : current.label}
            </h1>
            {active === "overview" && (
              <p className="text-sm text-slate-500">তোমার কাজ, আবেদন ও হিসাবের সারসংক্ষেপ</p>
            )}
          </div>

          {active === "overview" && <Overview userId={user.id} verified={verified} />}
          {active === "jobs" && <JobsTab userId={user.id} />}
          {active === "applications" && <ApplicationsTab userId={user.id} />}
          {active === "messages" && <MessagesTab userId={user.id} />}
          {active === "wallet" && <WalletTab userId={user.id} />}
        </div>
      </div>
    </Container>
  );
}

export default function DashboardPage({ searchParams }: { searchParams: SP }) {
  return (
    <main>
      <Suspense
        fallback={
          <DashboardSkeleton />
        }
      >
        <DashboardContent searchParams={searchParams} />
      </Suspense>
    </main>
  );
}