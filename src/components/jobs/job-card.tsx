import Link from "next/link";
import Avatar from "@/components/avatar";
import { IconClock, IconUniversity } from "@/components/icons";
import { JobTypeIcon, ModeIcon } from "@/components/type-icons";
import { JOB_TYPE_META, WORK_MODE_META, formatBudget } from "@/lib/constants";
import type { JobDTO } from "@/lib/jobs";
import { timeAgo } from "@/lib/time";

export function TypeBadge({ type }: { type: JobDTO["type"] }) {
  const meta = JOB_TYPE_META[type];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${meta.badge}`}
    >
      <JobTypeIcon type={type} className="h-3.5 w-3.5" /> {meta.label}
    </span>
  );
}

export default function JobCard({ job }: { job: JobDTO }) {
  const free = job.type === "silver";

  return (
    <Link
      href={`/jobs/${job.id}`}
      className="group flex h-full flex-col rounded-2xl border bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-lg"
    >
      <div className="flex items-center justify-between gap-3">
        <TypeBadge type={job.type} />
        <span className="inline-flex items-center gap-1 text-xs text-slate-400">
          <IconClock className="h-3.5 w-3.5" /> {timeAgo(job.createdAt)}
        </span>
      </div>

      <h2 className="mt-3 line-clamp-2 text-lg font-semibold leading-snug transition group-hover:text-indigo-600">
        {job.title}
      </h2>
      <p className="mt-2 line-clamp-2 text-sm text-slate-600">{job.description}</p>

      {job.skills.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {job.skills.slice(0, 4).map((s) => (
            <span key={s} className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
              {s}
            </span>
          ))}
          {job.skills.length > 4 && (
            <span className="px-1 py-0.5 text-xs text-slate-400">+{job.skills.length - 4}</span>
          )}
        </div>
      )}

      <div className="mt-auto pt-4">
        <div className="flex items-center justify-between gap-3 border-t pt-4">
          <div className="flex min-w-0 items-center gap-2.5">
            <Avatar name={job.posterName} />
            <div className="min-w-0 text-xs">
              <p className="truncate font-medium text-slate-800">{job.posterName}</p>
              <p className="flex flex-wrap items-center gap-x-1.5 text-slate-500">
                <span className="inline-flex items-center gap-1">
                  <ModeIcon mode={job.mode} className="h-3 w-3" /> {WORK_MODE_META[job.mode].label}
                </span>
                {job.universityName && (
                  <span className="inline-flex items-center gap-1">
                    <IconUniversity className="h-3 w-3" />
                    <span className="max-w-32 truncate">{job.universityName}</span>
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="shrink-0 text-right">
            <p
              className={`font-bold ${
                free ? "text-emerald-600" : "text-lg text-slate-900"
              }`}
            >
              {formatBudget(job.type, job.budget)}
            </p>
            <p className="text-[11px] text-slate-400">{job.category}</p>
          </div>
        </div>
      </div>
    </Link>
  );
}