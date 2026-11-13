import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { IconType } from "react-icons";
import Avatar from "@/components/avatar";
import { Container } from "@/components/layout-kit";
import { TypeBadge } from "@/components/jobs/job-card";
import ApplyBox from "@/components/jobs/apply-box";
import ApplicantList from "@/components/jobs/applicant-list";
import PosterControls from "@/components/jobs/poster-controls";
import ReviewBox from "@/components/jobs/review-box";
import ReportButton from "@/components/jobs/report-button";
import ChatBox from "@/components/jobs/chat-box";
import { Stars } from "@/components/stars";
import { JobDetailsSkeleton, Skeleton  } from "@/components/skeletons";
import { ModeIcon } from "@/components/type-icons";
import {
  IconAward,
  IconBack,
  IconBan,
  IconCalendar,
  IconCheck,
  IconClock,
  IconMapPin,
  IconTool,
  IconUniversity,
  IconZap,
} from "@/components/icons";
import { WORK_MODE_META, connectCost, formatBudget } from "@/lib/constants";
import { getJobById, type JobDTO } from "@/lib/jobs";
import { getApplicationsForJob, getMyApplication, getPosterContact } from "@/lib/applications";
import { getReviewsForJob, type ReviewDTO } from "@/lib/reviews";
import { getBalance } from "@/lib/wallet";
import { getSession } from "@/lib/session";
import { isVerifiedMember } from "@/lib/university";
import { timeAgo } from "@/lib/time";

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

const STATUS_META: Record<string, { label: string; style: string }> = {
  open: { label: "Open", style: "bg-emerald-50 text-emerald-700" },
  in_progress: { label: "কাজ চলছে", style: "bg-sky-50 text-sky-700" },
  completed: { label: "সম্পন্ন", style: "bg-violet-50 text-violet-700" },
  closed: { label: "বন্ধ", style: "bg-slate-100 text-slate-600" },
};

function Note({
  icon: Icon,
  tone = "slate",
  children,
}: {
  icon: IconType;
  tone?: "slate" | "green";
  children: React.ReactNode;
}) {
  const styles =
    tone === "green" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "bg-white text-slate-600";
  return (
    <div
      className={`flex items-start justify-center gap-2 rounded-2xl border p-6 text-center text-sm shadow-sm ${styles}`}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{children}</span>
    </div>
  );
}

function ContactCard({
  title,
  name,
  phone,
  email,
}: {
  title: string;
  name: string;
  phone?: string;
  email?: string;
}) {
  return (
    <div className="space-y-1 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-sm text-emerald-900">
      <h3 className="mb-2 flex items-center gap-2 text-base font-semibold">
        <IconAward className="h-5 w-5" /> {title}
      </h3>
      <p>নাম: <b>{name}</b></p>
      <p>Phone/WhatsApp: <b>{phone || "দেওয়া হয়নি"}</b></p>
      <p>Email: <b>{email}</b></p>
    </div>
  );
}

function ReviewCard({ title, r }: { title: string; r: ReviewDTO }) {
  return (
    <div className="space-y-1 rounded-2xl border bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <Stars value={r.rating} className="text-xl" />
      {r.comment && <p className="text-sm text-slate-700">{r.comment}</p>}
    </div>
  );
}

// নিজের review না দেওয়া পর্যন্ত অপর পক্ষেরটা দেখানো হয় না
function ReviewSection({
  jobId,
  myId,
  otherName,
  reviews,
}: {
  jobId: string;
  myId: string;
  otherName: string;
  reviews: ReviewDTO[];
}) {
  const mine = reviews.find((r) => r.reviewerId === myId);
  const theirs = reviews.find((r) => r.reviewerId !== myId);

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">Review</h2>
      {mine ? (
        <>
          <ReviewCard title="তোমার review" r={mine} />
          {theirs ? (
            <ReviewCard title={`${theirs.reviewerName}-এর review`} r={theirs} />
          ) : (
            <p className="text-sm text-slate-500">{otherName} এখনো review দেননি।</p>
          )}
        </>
      ) : (
        <ReviewBox jobId={jobId} revieweeName={otherName} />
      )}
    </div>
  );
}

async function ReportSlot({ job }: { job: JobDTO }) {
  const session = await getSession();
  if (!session || session.user.id === job.postedBy) return null;
  return <ReportButton jobId={job.id} />;
}

async function JobActions({ job }: { job: JobDTO }) {
  const session = await getSession();

  if (!session) {
    return (
      <div className="rounded-2xl border bg-white p-6 text-center text-sm text-slate-600 shadow-sm">
        <p className="mb-3">Apply করতে login করো</p>
        <Link
          href="/login"
          className="rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700"
        >
          Login
        </Link>
      </div>
    );
  }
  const { user } = session;
  const showContact = job.mode !== "online"; // Online job-এ chat-ই যথেষ্ট
  const chatOpen = job.status === "in_progress" || job.status === "completed";

  // ---------- Poster ----------
  if (job.postedBy === user.id) {
    const apps = await getApplicationsForJob(job.id);
    const hired = apps.find((a) => a.status === "hired");
    const pendingCount = apps.filter((a) => a.status === "pending").length;
    const reviews = job.status === "completed" ? await getReviewsForJob(job.id) : [];

    return (
      <section className="space-y-6">
        {hired && chatOpen && (
          <ChatBox
            jobId={job.id}
            myId={user.id}
            otherName={hired.applicantName}
            mode={job.mode}
            canSend={job.status === "in_progress"}
          />
        )}

        {(job.status === "open" || job.status === "in_progress") && (
          <PosterControls
            jobId={job.id}
            status={job.status as "open" | "in_progress"}
            pendingCount={pendingCount}
          />
        )}

        {job.status === "completed" && hired && (
          <ReviewSection
            jobId={job.id}
            myId={user.id}
            otherName={hired.applicantName}
            reviews={reviews}
          />
        )}

        <div className="space-y-3">
          <h2 className="text-lg font-semibold">আবেদনকারী ({apps.length})</h2>
          <ApplicantList
            applications={apps}
            jobOpen={job.status === "open"}
            showContact={showContact}
          />
        </div>
      </section>
    );
  }

  // ---------- যে আগেই apply করেছে ----------
  const mine = await getMyApplication(job.id, user.id);
  if (mine) {
    if (mine.status === "hired") {
      const c = showContact ? await getPosterContact(job.id) : null;
      const reviews = job.status === "completed" ? await getReviewsForJob(job.id) : [];
      return (
        <div className="space-y-6">
          {showContact ? (
            <ContactCard
              title="তোমাকে hire করা হয়েছে! এবার যোগাযোগ করো"
              name={job.posterName}
              phone={c?.phone}
              email={c?.email}
            />
          ) : (
            <Note icon={IconAward} tone="green">
              তোমাকে hire করা হয়েছে! এটি Online job, নিচের chat-এ কথা বলে meeting ঠিক করো।
            </Note>
          )}

          {chatOpen && (
            <ChatBox
              jobId={job.id}
              myId={user.id}
              otherName={job.posterName}
              mode={job.mode}
              canSend={job.status === "in_progress"}
            />
          )}

          {job.status === "in_progress" && (
            <Note icon={IconTool}>
              {`কাজ চলছে। শেষ হলে poster "কাজ শেষ" mark করবেন। তখন তোমার connect ফেরত আসবে ও review দিতে পারবে।`}
            </Note>
          )}

          {job.status === "completed" && mine.refunded && (
            <Note icon={IconCheck} tone="green">
              কাজ সম্পন্ন! তোমার খরচ হওয়া connect ফেরত দেওয়া হয়েছে।
            </Note>
          )}

          {job.status === "completed" && (
            <ReviewSection
              jobId={job.id}
              myId={user.id}
              otherName={job.posterName}
              reviews={reviews}
            />
          )}
        </div>
      );
    }
    if (mine.status === "rejected") {
      return (
        <Note icon={mine.refunded ? IconCheck : IconBan}>
          {mine.refunded
            ? "Job বন্ধ হয়ে গেছে। তোমার connect ফেরত দেওয়া হয়েছে।"
            : "এই job-এ অন্য কাউকে নেওয়া হয়েছে।"}
        </Note>
      );
    }
    return (
      <Note icon={IconCheck}>তুমি apply করেছ। Poster সিদ্ধান্ত নিলে এখানে জানতে পারবে।</Note>
    );
  }

  // ---------- নতুন আবেদনকারী ----------
  if (job.status !== "open") {
    return <Note icon={IconBan}>এই job আর আবেদন নিচ্ছে না।</Note>;
  }

  if (job.mode === "offline" && !(isVerifiedMember(user) && user.university === job.university)) {
    return (
      <Note icon={IconMapPin}>
        <span>
          এটি Offline job। শুধু একই university-র verified শিক্ষার্থীরা apply করতে পারবে।{" "}
          {!isVerifiedMember(user) && (
            <Link href="/verify-university" className="font-medium text-indigo-600 underline">
              University verify করো →
            </Link>
          )}
        </span>
      </Note>
    );
  }

  const cost = connectCost(job.type, job.category, job.budget);
  const balance = await getBalance(user.id);
  return <ApplyBox jobId={job.id} cost={cost} balance={balance} mode={job.mode} />;
}

function Row({
  icon: Icon,
  label,
  children,
}: {
  icon: IconType;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <dt className="flex items-center gap-2 text-slate-500">
        <Icon className="h-4 w-4" /> {label}
      </dt>
      <dd className="text-right font-medium">{children}</dd>
    </div>
  );
}

async function JobDetails({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = await getJobById(id);
  if (!job) notFound();

  const mode = WORK_MODE_META[job.mode];
  const cost = connectCost(job.type, job.category, job.budget);
  const status = STATUS_META[job.status] ?? STATUS_META.closed;

  return (
    <>
      {/* শিরোনামের ব্যান্ড */}
      <div className="border-b bg-white">
        <Container className="space-y-4 py-8">
          <Link
            href="/jobs"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 transition hover:text-slate-900"
          >
            <IconBack className="h-4 w-4" /> সব job
          </Link>

          <div className="flex flex-wrap items-center gap-2">
            <TypeBadge type={job.type} />
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${status.style}`}>
              {status.label}
            </span>
            <span className="inline-flex items-center gap-1 text-xs text-slate-400">
              <IconClock className="h-3.5 w-3.5" /> {timeAgo(job.createdAt)}
            </span>
          </div>

          <h1 className="max-w-4xl text-2xl font-bold leading-tight tracking-tight sm:text-3xl">
            {job.title}
          </h1>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-500">
            <span className="inline-flex items-center gap-2">
              <Avatar name={job.posterName} /> {job.posterName}
            </span>
            <span>{job.category}</span>
            {job.universityName && (
              <span className="inline-flex items-center gap-1.5">
                <IconUniversity className="h-4 w-4" /> {job.universityName}
              </span>
            )}
          </div>
        </Container>
      </div>

      {/* বিষয়বস্তু: দুই কলাম */}
      <Container className="grid gap-6 py-8 lg:grid-cols-[1fr_22rem] xl:grid-cols-[1fr_24rem]">
        <div className="min-w-0 space-y-6">
          <article className="space-y-5 rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">বিবরণ</h2>
            <p className="whitespace-pre-wrap leading-relaxed text-slate-700">{job.description}</p>

            {job.skills.length > 0 && (
              <div className="space-y-2 border-t pt-5">
                <h3 className="text-sm font-medium text-slate-500">প্রয়োজনীয় দক্ষতা</h3>
                <div className="flex flex-wrap gap-2">
                  {job.skills.map((s) => (
                    <span
                      key={s}
                      className="rounded-lg bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </article>

          <Suspense fallback={<Skeleton className="h-48 rounded-2xl" />}>
            <JobActions job={job} />
          </Suspense>
        </div>

        {/* ডানের সারসংক্ষেপ কার্ড */}
        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="space-y-5 rounded-2xl border bg-white p-6 shadow-sm">
            <div>
              <p className="text-sm text-slate-500">Budget</p>
              <p
                className={`text-3xl font-bold tracking-tight ${
                  job.type === "silver" ? "text-emerald-600" : ""
                }`}
              >
                {formatBudget(job.type, job.budget)}
              </p>
            </div>

            <dl className="space-y-3.5 border-t pt-5">
              <Row icon={IconZap} label="Apply খরচ">
                {cost === 0 ? "ফ্রি" : `${cost} connect`}
              </Row>
              <Row icon={IconMapPin} label="কীভাবে">
                <span className="inline-flex items-center gap-1.5">
                  <ModeIcon mode={job.mode} className="h-4 w-4" /> {mode.label}
                </span>
              </Row>
              <Row icon={IconCalendar} label="Deadline">
                {job.deadline ? fmtDate(job.deadline) : "নেই"}
              </Row>
              <Row icon={IconClock} label="Post করা হয়েছে">
                {fmtDate(job.createdAt)}
              </Row>
            </dl>

            {job.universityName && (
              <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
                <IconUniversity className="h-4 w-4 shrink-0" />
                <span className="min-w-0 truncate">{job.universityName}</span>
              </div>
            )}
          </div>

          <Suspense fallback={null}>
            <ReportSlot job={job} />
          </Suspense>
        </aside>
      </Container>
    </>
  );
}

export default function JobPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <main>
      <Suspense
        fallback={
          <JobDetailsSkeleton />
        }
      >
        <JobDetails params={params} />
      </Suspense>
    </main>
  );
}

