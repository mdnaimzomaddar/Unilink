import { connection } from "next/server";
import { isValidObjectId } from "mongoose";
import { connectDB } from "@/lib/db";
import { getRatings, type RatingSummary } from "@/lib/reviews";
import Application from "@/models/Application";
import Job from "@/models/Job";

export type ApplicationDTO = {
  id: string;
  applicantId: string;
  applicantName: string;
  coverNote: string;
  status: "pending" | "hired" | "rejected";
  refunded: boolean;
  createdAt: string;
  rating?: RatingSummary;
  contact?: { phone: string; email: string }; // শুধু hired হলে
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const toDTO = (a: any): ApplicationDTO => ({
  id: String(a._id),
  applicantId: a.applicantId,
  applicantName: a.applicantName,
  coverNote: a.coverNote,
  status: a.status,
  refunded: !!a.refunded,
  createdAt: new Date(a.createdAt).toISOString(),
});

export async function getApplicationsForJob(jobId: string): Promise<ApplicationDTO[]> {
  await connection();
  await connectDB();

  const apps = await Application.find({ jobId }).sort({ createdAt: -1 }).lean();
  const list = apps.map(toDTO);

  const ratings = await getRatings(list.map((a) => a.applicantId));
  for (const a of list) a.rating = ratings[a.applicantId];

  const hired = await Application.findOne({ jobId, status: "hired" })
    .select("+applicantContact +applicantEmail")
    .lean();

  if (hired) {
    const item = list.find((a) => a.id === String(hired._id));
    if (item) item.contact = { phone: hired.applicantContact, email: hired.applicantEmail };
  }
  return list;
}

export async function getMyApplication(jobId: string, userId: string) {
  await connection();
  await connectDB();
  const a = await Application.findOne({ jobId, applicantId: userId }).lean();
  return a ? toDTO(a) : null;
}

export async function getPosterContact(jobId: string) {
  if (!isValidObjectId(jobId)) return null;
  await connection();
  await connectDB();
  const j = await Job.findById(jobId).select("+posterContact +posterEmail").lean();
  return j ? { phone: j.posterContact as string, email: j.posterEmail as string } : null;
}