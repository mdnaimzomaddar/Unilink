import { Suspense } from "react";
import Link from "next/link";
import JobCard from "@/components/jobs/job-card";
import { Container, PageHeader } from "@/components/layout-kit";
import { IconPlus, IconSearch, IconUniversity } from "@/components/icons";
import { JobTypeIcon } from "@/components/type-icons";
import { getJobs } from "@/lib/jobs";
import { getSession } from "@/lib/session";
import { isVerifiedMember } from "@/lib/university";
import { JobsSkeleton  } from "@/components/skeletons";
import { CATEGORIES, JOB_TYPES, JOB_TYPE_META, type JobType } from "@/lib/constants";

type SP = Promise<{ type?: string; category?: string; q?: string; scope?: string }>;

const field =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200";

const TYPE_OPTIONS: { value: string; label: string; type: JobType | null }[] = [
  { value: "", label: "সব", type: null },
  ...JOB_TYPES.map((t) => ({ value: t as string, label: JOB_TYPE_META[t].label, type: t as JobType | null })),
];

async function JobsContent({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const session = await getSession();
  const user = session?.user;
  const verified = !!user && isVerifiedMember(user);
  const viewerUniversity = verified ? user.university : null;

  const jobs = await getJobs({ ...sp, viewerUniversity });
  const hasFilter = !!(sp.q || sp.type || sp.category || sp.scope);

  return (
    <Container className="py-8">
      {user && !verified && (
        <Link
          href="/verify-university"
          className="mb-6 flex items-center gap-2 rounded-xl bg-sky-50 p-3 text-sm text-sky-800 ring-1 ring-sky-200"
        >
          <IconUniversity className="h-4 w-4 shrink-0" />
          University verify করলে নিজের university-র job ও Offline কাজ দেখতে পাবে →
        </Link>
      )}

      <div className="grid gap-6 lg:grid-cols-[18rem_1fr] xl:grid-cols-[20rem_1fr]">
        {/* ফিল্টার */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <form
            method="GET"
            action="/jobs"
            className="space-y-5 rounded-2xl border bg-white p-5 shadow-sm"
          >
            <div className="relative">
              <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                name="q"
                defaultValue={sp.q ?? ""}
                placeholder="Job বা skill খোঁজো..."
                className={`${field} pl-9`}
              />
            </div>

            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">ধরন</legend>
              <div className="flex flex-wrap gap-2">
                {TYPE_OPTIONS.map((o) => (
                  <label key={o.value || "all"} className="cursor-pointer">
                    <input
                      type="radio"
                      name="type"
                      value={o.value}
                      defaultChecked={(sp.type ?? "") === o.value}
                      className="peer sr-only"
                    />
                    <span className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm text-slate-600 transition hover:bg-slate-50 peer-checked:border-indigo-500 peer-checked:bg-indigo-50 peer-checked:font-medium peer-checked:text-indigo-700 peer-focus-visible:ring-2 peer-focus-visible:ring-indigo-300">
                      {o.type && <JobTypeIcon type={o.type} className="h-3.5 w-3.5" />}
                      {o.label}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="space-y-2">
              <label htmlFor="category" className="text-sm font-medium">
                Category
              </label>
              <select id="category" name="category" defaultValue={sp.category ?? ""} className={field}>
                <option value="">সব category</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {verified && (
              <div className="space-y-2">
                <label htmlFor="scope" className="text-sm font-medium">
                  University
                </label>
                <select id="scope" name="scope" defaultValue={sp.scope ?? ""} className={field}>
                  <option value="">সব university</option>
                  <option value="mine">শুধু আমার university</option>
                </select>
              </div>
            )}

            <div className="flex gap-2">
              <button className="flex-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700">
                Filter করো
              </button>
              {hasFilter && (
                <Link
                  href="/jobs"
                  className="rounded-lg border px-4 py-2 text-sm text-slate-600 transition hover:bg-slate-50"
                >
                  Reset
                </Link>
              )}
            </div>
          </form>
        </aside>

        {/* ফলাফল */}
        <section className="space-y-4">
          <p className="text-sm text-slate-500">
            <b className="text-slate-900">{jobs.length}</b> টি job পাওয়া গেছে
            {jobs.length >= 50 && " (সর্বশেষ ৫০টি দেখানো হচ্ছে)"}
          </p>

          {jobs.length === 0 ? (
            <div className="rounded-2xl border border-dashed bg-white px-6 py-16 text-center">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                <IconSearch className="h-6 w-6" />
              </span>
              <p className="mt-4 font-medium">কোনো job পাওয়া যায়নি</p>
              <p className="mt-1 text-sm text-slate-500">
                ফিল্টার বদলে দেখো, অথবা প্রথম job-টা তুমিই post করো।
              </p>
              <div className="mt-5 flex justify-center gap-2">
                {hasFilter && (
                  <Link href="/jobs" className="rounded-lg border px-4 py-2 text-sm hover:bg-slate-50">
                    ফিল্টার মুছে দাও
                  </Link>
                )}
                <Link
                  href="/jobs/new"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                >
                  <IconPlus className="h-4 w-4" /> Job post
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
              {jobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          )}
        </section>
      </div>
    </Container>
  );
}

export default function JobsPage({ searchParams }: { searchParams: SP }) {
  return (
    <main>
      <PageHeader
        title="কাজ খোঁজো"
        description="তোমার university কমিউনিটির সব micro-job এক জায়গায়"
        actions={
          <Link
            href="/jobs/new"
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700"
          >
            <IconPlus className="h-4 w-4" /> Job post করো
          </Link>
        }
      />
      <Suspense
        fallback={<JobsSkeleton />}
      >
        <JobsContent searchParams={searchParams} />
      </Suspense>
    </main>
  );
}