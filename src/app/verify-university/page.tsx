import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import StudentCardForm from "@/components/university/student-card-form";
import VerifyForm from "@/components/university/verify-form";
import { Container, PageHeader } from "@/components/layout-kit";
import { ListSkeleton } from "@/components/skeletons";
import {
  IconCheck,
  IconClock,
  IconGift,
  IconGraduation,
  IconMail,
  IconMapPin,
  IconUniversity,
  IconWarning,
} from "@/components/icons";
import { getSession } from "@/lib/session";
import { getUniversityNames, isVerifiedMember, listActiveUniversities } from "@/lib/university";
import { getMyLatestStudentVerification } from "@/lib/student-verification";

type SP = Promise<{ method?: string }>;

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

async function VerifyContent({ searchParams }: { searchParams: SP }) {
  const session = await getSession();
  if (!session) redirect("/login");
  const { user } = session;

  if (isVerifiedMember(user)) {
    const names = await getUniversityNames([user.university]);
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-emerald-200 bg-emerald-50 p-10 text-center text-emerald-900">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
          <IconCheck className="h-7 w-7" />
        </span>
        <p className="mt-4 text-xl font-semibold">তুমি verified</p>
        <p className="text-sm">{names[user.university] ?? user.university}</p>
        <Link
          href="/dashboard"
          className="mt-6 inline-block rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-700"
        >
          Dashboard-এ যাও
        </Link>
      </div>
    );
  }

  const { method } = await searchParams;
  const card = method === "card";
  const [unis, latest] = await Promise.all([
    listActiveUniversities(),
    getMyLatestStudentVerification(user.id),
  ]);

  const tab = (active: boolean) =>
    `flex items-start gap-3 rounded-2xl border p-4 transition ${
      active
        ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200"
        : "bg-white hover:border-slate-300"
    }`;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
      <div className="min-w-0 space-y-6">
        {/* পদ্ধতি বেছে নেওয়া */}
        <div className="grid gap-3 sm:grid-cols-2">
          <Link href="/verify-university" className={tab(!card)}>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <IconMail className="h-5 w-5" />
            </span>
            <span>
              <span className="block font-semibold">Email কোড</span>
              <span className="text-sm text-slate-500">University email থাকলে, সাথে সাথে</span>
            </span>
          </Link>
          <Link href="/verify-university?method=card" className={tab(card)}>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <IconGraduation className="h-5 w-5" />
            </span>
            <span>
              <span className="block font-semibold">Student ID card</span>
              <span className="text-sm text-slate-500">Email না থাকলে, admin দেখে যাচাই করেন</span>
            </span>
          </Link>
        </div>

        {!card ? (
          <VerifyForm universities={unis.map((u) => u.name)} />
        ) : latest?.status === "pending" ? (
          <div className="space-y-3 rounded-2xl border bg-white p-8 text-center shadow-sm">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-amber-600">
              <IconClock className="h-7 w-7" />
            </span>
            <p className="text-lg font-semibold">যাচাই চলছে</p>
            <p className="text-sm text-slate-500">
              {latest.universityName} · জমা দেওয়া হয়েছে {fmtDate(latest.createdAt)}
            </p>
            <p className="text-sm text-slate-500">
              Admin দেখলে তুমি notification পাবে। সাধারণত কয়েক ঘণ্টা লাগে।
            </p>
          </div>
        ) : (
          <>
            {latest?.status === "rejected" && (
              <div className="flex items-start gap-2 rounded-xl bg-red-50 p-4 text-sm text-red-700 ring-1 ring-red-200">
                <IconWarning className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  আগের আবেদন গৃহীত হয়নি
                  {latest.adminNote ? `: ${latest.adminNote}` : "।"} ঠিক করে আবার জমা দাও।
                </span>
              </div>
            )}
            <StudentCardForm universities={unis.map((u) => ({ slug: u.slug, name: u.name }))} />
          </>
        )}
      </div>

      <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        <div className="space-y-4 rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="font-semibold">Verify করলে কী পাবে</h2>
          <ul className="space-y-3 text-sm text-slate-600">
            <li className="flex items-start gap-2.5">
              <IconGift className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              মোট ১০টা ফ্রি Silver post ও ১০ connect
            </li>
            <li className="flex items-start gap-2.5">
              <IconMapPin className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
              Offline কাজ post ও apply করার সুযোগ
            </li>
            <li className="flex items-start gap-2.5">
              <IconUniversity className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
              নিজের university-র job আলাদা করে দেখা
            </li>
          </ul>
        </div>
      </aside>
    </div>
  );
}

export default function VerifyUniversityPage({ searchParams }: { searchParams: SP }) {
  return (
    <main>
      <PageHeader
        title="University verify"
        description="নিজের university-র সদস্য হিসেবে যাচাই হও। Email অথবা Student ID card, যেটা সুবিধা।"
      />
      <Container className="py-8">
        <Suspense fallback={<ListSkeleton rows={3} />}>
          <VerifyContent searchParams={searchParams} />
        </Suspense>
      </Container>
    </main>
  );
}