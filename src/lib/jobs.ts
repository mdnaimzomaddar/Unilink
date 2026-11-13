import { connection } from "next/server";
import { isValidObjectId } from "mongoose";
import { connectDB } from "@/lib/db";
import { CATEGORIES, JOB_TYPES, type JobType, type WorkMode } from "@/lib/constants";
import { getUniversityNames } from "@/lib/university";
import Job from "@/models/Job";

export type JobDTO = {
  id: string;
  title: string;
  description: string;
  type: JobType;
  budget: number;
  category: string;
  mode: WorkMode;
  skills: string[];
  deadline: string | null;
  status: string;
  postedBy: string;
  posterName: string;
  university: string;
  universityName: string | null;
  createdAt: string;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toDTO(j: any, names: Record<string, string>): JobDTO {
  return {
    id: String(j._id),
    title: j.title,
    description: j.description,
    type: j.type,
    budget: j.budget ?? 0,
    category: j.category,
    mode: j.mode ?? "online",
    skills: j.skills ?? [],
    deadline: j.deadline ? new Date(j.deadline).toISOString() : null,
    status: j.status,
    postedBy: j.postedBy,
    posterName: j.posterName,
    university: j.university ?? "default",
    universityName: names[j.university] ?? null,
    createdAt: new Date(j.createdAt).toISOString(),
  };
}

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export async function getJobs(filters: {
  type?: string;
  category?: string;
  q?: string;
  scope?: string; // "mine" = শুধু নিজের university
  viewerUniversity?: string | null; // verified হলে তার university
}) {
  await connection();
  await connectDB();

  const query: Record<string, unknown> = { status: "open" };
  const and: Record<string, unknown>[] = [];

  if (filters.type && (JOB_TYPES as readonly string[]).includes(filters.type)) {
    query.type = filters.type;
  }
  if (filters.category && (CATEGORIES as readonly string[]).includes(filters.category)) {
    query.category = filters.category;
  }
  if (filters.scope === "mine" && filters.viewerUniversity) {
    query.university = filters.viewerUniversity;
  }

  // Offline job শুধু একই university-র verified সদস্য দেখবে
  if (filters.viewerUniversity) {
    and.push({ $or: [{ mode: { $ne: "offline" } }, { university: filters.viewerUniversity }] });
  } else {
    query.mode = { $ne: "offline" };
  }

  if (filters.q?.trim()) {
    const rx = { $regex: escapeRegex(filters.q.trim()), $options: "i" };
    and.push({ $or: [{ title: rx }, { description: rx }, { skills: rx }] });
  }
  if (and.length > 0) query.$and = and;

  const jobs = await Job.find(query).sort({ createdAt: -1 }).limit(50).lean();
  const names = await getUniversityNames(jobs.map((j) => j.university as string));
  return jobs.map((j) => toDTO(j, names));
}

export async function getJobById(id: string) {
  if (!isValidObjectId(id)) return null;
  await connection();
  await connectDB();
  const job = await Job.findById(id).lean();
  if (!job) return null;
  const names = await getUniversityNames([job.university as string]);
  return toDTO(job, names);
}