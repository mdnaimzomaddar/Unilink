import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { IconType } from "react-icons";
import { requireAdmin } from "@/lib/admin";
import {
  getAdminFaculty,
  getAdminPurchases,
  getAdminReports,
  getAdminStats,
  getAdminUniversities,
} from "@/lib/admin-data";
import {
  PAYMENT_METHOD_LABEL,
  REPORT_REASON_LABEL,
  type PaymentMethod,
  type ReportReason,
} from "@/lib/constants";
import {
  FacultyActions,
  PurchaseActions,
  ReportActions,
  RevokeButton,
} from "@/components/admin/admin-actions";
import { AddUniversityForm, UniversityRowActions } from "@/components/admin/university-admin";
import {
  IconCoins,
  IconFlag,
  IconGraduation,
  IconGrid,
  IconShield,
  IconUniversity,
  IconZap,
} from "@/components/icons";
import { Container } from "@/components/layout-kit";
import { ListSkeleton } from "@/components/skeletons";
import {
  countPendingStudentVerifications,
  getAdminStudentVerifications,
} from "@/lib/student-verification";
import StudentVerificationActions from "@/components/admin/student-verification-actions";
import { IconCamera } from "@/components/icons";

type SP = Promise<{ tab?: string }>;

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

const card = "space-y-2 rounded-2xl border bg-white p-4 shadow-sm";
const empty = "rounded-2xl border border-dashed bg-white p-8 text-center text-sm text-slate-500";

function Stat({ label, value, warn }: { label: string; value: number; warn?: boolean }) {
  return (
    <div className={`rounded-2xl border bg-white p-5 shadow-sm ${warn && value > 0 ? "border-amber-300" : ""}`}>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  );
}

async function Overview() {
  const s = await getAdminStats();
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Stat label="মোট user" value={s.totalUsers} />
      <Stat label="মোট job" value={s.totalJobs} />
      <Stat label="Open job" value={s.openJobs} />
      <Stat label="অপেক্ষমান connect request" value={s.pendingPurchases} warn />
      <Stat label="অপেক্ষমান faculty আবেদন" value={s.pendingFaculty} warn />
      <Stat label="Open report" value={s.openReports} warn />
    </div>
  );
}

async function Purchases() {
  const { pending, recent } = await getAdminPurchases();
  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">অপেক্ষমান ({pending.length})</h2>
        {pending.length === 0 ? (
          <div className={empty}>কোনো অপেক্ষমান request নেই</div>
        ) : (
          pending.map((p) => (
            <div key={p.id} className={card}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold">
                  {p.userName} <span className="text-sm font-normal text-slate-500">({p.userEmail})</span>
                </p>
                <p className="inline-flex items-center gap-1 text-sm font-semibold text-amber-700">
                  <IconZap className="h-4 w-4" /> {p.connects} · ৳{p.amount}
                </p>
              </div>
              <p className="text-sm text-slate-600">
                {PAYMENT_METHOD_LABEL[p.method as PaymentMethod] ?? p.method} · Sender {p.senderNumber} · TrxID{" "}
                <b className="select-all">{p.trxId}</b>
              </p>
              <p className="text-xs text-slate-400">{fmtDate(p.createdAt)}</p>
              <PurchaseActions id={p.id} amount={p.amount} trxId={p.trxId} />
            </div>
          ))
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">সাম্প্রতিক সিদ্ধান্ত</h2>
        {recent.length === 0 ? (
          <div className={empty}>এখনো কোনো সিদ্ধান্ত নেই।</div>
        ) : (
          recent.map((p) => (
            <div key={p.id} className="flex items-center justify-between gap-3 rounded-xl border bg-white p-3 text-sm">
              <span className="inline-flex flex-wrap items-center gap-1">
                {p.userName} · <IconZap className="h-3.5 w-3.5" /> {p.connects} · ৳{p.amount} · {p.trxId}
              </span>
              <span className={p.status === "approved" ? "text-emerald-700" : "text-red-600"}>
                {p.status === "approved" ? "Approved" : "Rejected"}
              </span>
            </div>
          ))
        )}
      </section>
    </div>
  );
}

async function Faculty() {
  const { pending, approved } = await getAdminFaculty();
  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">অপেক্ষমান আবেদন ({pending.length})</h2>
        {pending.length === 0 ? (
          <div className={empty}>কোনো অপেক্ষমান আবেদন নেই।</div>
        ) : (
          pending.map((f) => (
            <div key={f.id} className={card}>
              <p className="font-semibold">
                {f.userName} <span className="text-sm font-normal text-slate-500">({f.userEmail})</span>
              </p>
              <p className="text-sm text-slate-600">
                {f.designation} · {f.department}
              </p>
              <p className="break-all text-sm">
                প্রমাণ: <span className="select-all font-medium">{f.proof}</span>
              </p>
              <p className="text-xs text-slate-400">{fmtDate(f.createdAt)}</p>
              <FacultyActions id={f.id} />
            </div>
          ))
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Verified faculty ({approved.length})</h2>
        {approved.length === 0 ? (
          <div className={empty}>এখনো কেউ নেই।</div>
        ) : (
          approved.map((u) => (
            <div key={u.id} className="flex items-center justify-between gap-3 rounded-xl border bg-white p-3 text-sm">
              <span>
                {u.name} <span className="text-slate-500">({u.email})</span>
              </span>
              <RevokeButton userId={u.id} />
            </div>
          ))
        )}
      </section>
    </div>
  );
}

async function Reports() {
  const reports = await getAdminReports();
  if (reports.length === 0) return <div className={empty}>কোনো open report নেই</div>;
  return (
    <div className="space-y-3">
      {reports.map((r) => (
        <div key={r.id} className={card}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Link href={`/jobs/${r.jobId}`} className="font-semibold text-indigo-600 hover:underline">
              {r.jobTitle}
            </Link>
            <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-600">
              {REPORT_REASON_LABEL[r.reason as ReportReason] ?? r.reason}
            </span>
          </div>
          <p className="text-sm text-slate-600">
            Report করেছেন: {r.reporterName} · Job status: {r.jobStatus || "—"}
          </p>
          {r.details && <p className="whitespace-pre-wrap text-sm text-slate-700">{r.details}</p>}
          <p className="text-xs text-slate-400">{fmtDate(r.createdAt)}</p>
          <ReportActions
            id={r.id}
            jobId={r.jobId}
            canClose={r.jobStatus === "open" || r.jobStatus === "in_progress"}
          />
        </div>
      ))}
    </div>
  );
}

async function StudentVerifications() {
  const list = await getAdminStudentVerifications();
  if (list.length === 0) {
    return <div className={empty}>কোনো অপেক্ষমান Student ID যাচাই নেই</div>;
  }
  return (
    <div className="space-y-4">
      {list.map((v) => (
        <div
          key={v.id}
          className="grid gap-5 rounded-2xl border bg-white p-5 shadow-sm md:grid-cols-[1fr_16rem]"
        >
          <div className="space-y-3">
            <div>
              <p className="font-semibold">
                {v.userName} <span className="text-sm font-normal text-slate-500">({v.userEmail})</span>
              </p>
              <p className="text-sm text-slate-600">
                {v.universityName} · {v.department}
              </p>
            </div>
            <dl className="grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3 text-sm">
              <div>
                <dt className="text-xs text-slate-500">Student ID</dt>
                <dd className="select-all font-mono font-semibold">{v.studentId}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">ছবিতে থাকা উচিত কোড</dt>
                <dd className="font-mono font-semibold text-indigo-700">{v.code}</dd>
              </div>
            </dl>
            <p className="text-xs text-slate-500">
              মিলিয়ে দেখো: card-এর নাম ও ID, কাগজে লেখা কোড, আর ছবিটা একসাথে এক ফ্রেমে আছে কিনা।
            </p>
            <p className="text-xs text-slate-400">{fmtDate(v.createdAt)}</p>
            <StudentVerificationActions id={v.id} />
          </div>

          <a
            href={`/api/admin/verification-image/${v.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block overflow-hidden rounded-xl border bg-slate-100"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/admin/verification-image/${v.id}`}
              alt="Student card ও কোডের ছবি"
              className="h-56 w-full object-contain md:h-full"
            />
          </a>
        </div>
      ))}
    </div>
  );
}

async function Universities() {
  const list = await getAdminUniversities();
  return (
    <div className="space-y-6">
      <AddUniversityForm />
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">University তালিকা ({list.length})</h2>
        {list.length === 0 ? (
          <div className={empty}>এখনো কোনো university যোগ করা হয়নি। উপরের ফর্ম থেকে প্রথমটা যোগ করো।</div>
        ) : (
          list.map((u) => (
            <div key={u.id} className={card}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold">
                  {u.name} <span className="text-xs font-normal text-slate-500">({u.slug})</span>
                </p>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    u.active ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {u.active ? "Active" : "বন্ধ"}
                </span>
              </div>
              <p className="break-all text-sm text-slate-600">Domain: {u.domains.join(", ")}</p>
              <p className="text-xs text-slate-400">Verified সদস্য: {u.members}</p>
              <UniversityRowActions id={u.id} active={u.active} domains={u.domains.join(", ")} />
            </div>
          ))
        )}
      </section>
    </div>
  );
}

async function AdminContent({ searchParams }: { searchParams: SP }) {
  const pendingStudent = await countPendingStudentVerifications();
  const session = await requireAdmin();
  if (!session) notFound(); // admin না হলে পেজের অস্তিত্বই বোঝা যাবে না

  const { tab } = await searchParams;
  const stats = await getAdminStats();

  const TABS: { key: string; label: string; icon: IconType; count: number }[] = [
    { key: "overview", label: "Overview", icon: IconGrid, count: 0 },
    { key: "purchases", label: "Connect কেনা", icon: IconCoins, count: stats.pendingPurchases },
    { key: "faculty", label: "Faculty", icon: IconGraduation, count: stats.pendingFaculty },
    { key: "reports", label: "Report", icon: IconFlag, count: stats.openReports },
    { key: "universities", label: "University", icon: IconUniversity, count: 0 },
    { key: "student-id", label: "Student ID", icon: IconCamera, count: pendingStudent },
  ];
  const active = TABS.some((t) => t.key === tab) ? tab : "overview";

  return (
    <>
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <IconShield className="h-6 w-6 text-indigo-600" /> Admin panel
        </h1>
        <p className="text-sm text-slate-500">{session.user.email}</p>
      </div>

      <nav className="flex flex-wrap gap-1 border-b">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <Link
              key={t.key}
              href={`/admin?tab=${t.key}`}
              className={`-mb-px flex items-center gap-1.5 border-b-2 px-4 py-2 text-sm font-medium ${
                active === t.key
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <Icon className="h-4 w-4" /> {t.label}
              {t.count > 0 && (
                <span className="rounded-full bg-amber-500 px-1.5 text-xs text-white">{t.count}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {active === "overview" && <Overview />}
      {active === "purchases" && <Purchases />}
      {active === "faculty" && <Faculty />}
      {active === "reports" && <Reports />}
      {active === "universities" && <Universities />}
      {active === "student-id" && <StudentVerifications />}
    </>
  );
}
export default function AdminPage({ searchParams }: { searchParams: SP }) {
  return (
    <main>
      <Container className="space-y-6 py-8">
        <Suspense fallback={<ListSkeleton />}>
          <AdminContent searchParams={searchParams} />
        </Suspense>
      </Container>
    </main>
  );
}