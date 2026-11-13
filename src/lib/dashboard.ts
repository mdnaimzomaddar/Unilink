import { connection } from "next/server";
import { connectDB } from "@/lib/db";
import type { JobType } from "@/lib/constants";
import Job from "@/models/Job";
import Application from "@/models/Application";

export type MyJobDTO = {
  id: string;
  title: string;
  type: JobType;
  status: string;
  createdAt: string;
  totalApplicants: number;
  pendingApplicants: number;
};

export type MyApplicationDTO = {
  id: string;
  status: "pending" | "hired" | "rejected";
  refunded: boolean;
  connectsSpent: number;
  createdAt: string;
  job: { id: string; title: string; type: JobType; status: string } | null;
};

export async function getMyJobs(userId: string): Promise<MyJobDTO[]> {
  await connection();
  await connectDB();

  const jobs = await Job.find({ postedBy: userId }).sort({ createdAt: -1 }).limit(100).lean();
  const ids = jobs.map((j) => String(j._id));

  const counts = ids.length
    ? await Application.aggregate([
        { $match: { jobId: { $in: ids } } },
        {
          $group: {
            _id: "$jobId",
            total: { $sum: 1 },
            pending: { $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] } },
          },
        },
      ])
    : [];
  const map = new Map(counts.map((c) => [c._id as string, c]));

  return jobs.map((j) => {
    const c = map.get(String(j._id));
    return {
      id: String(j._id),
      title: j.title,
      type: j.type,
      status: j.status,
      createdAt: new Date(j.createdAt).toISOString(),
      totalApplicants: c?.total ?? 0,
      pendingApplicants: c?.pending ?? 0,
    };
  });
}

export async function getMyApplications(userId: string): Promise<MyApplicationDTO[]> {
  await connection();
  await connectDB();

  const apps = await Application.find({ applicantId: userId })
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();

  const jobIds = apps.map((a) => a.jobId);
  const jobs = jobIds.length
    ? await Job.find({ _id: { $in: jobIds } }).select("title type status").lean()
    : [];
  const jm = new Map(jobs.map((j) => [String(j._id), j]));

  return apps.map((a) => {
    const j = jm.get(a.jobId);
    return {
      id: String(a._id),
      status: a.status,
      refunded: !!a.refunded,
      connectsSpent: a.connectsSpent ?? 0,
      createdAt: new Date(a.createdAt).toISOString(),
      job: j ? { id: String(j._id), title: j.title, type: j.type, status: j.status } : null,
    };
  });
}