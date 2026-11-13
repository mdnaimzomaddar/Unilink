import { connection } from "next/server";
import { connectDB } from "@/lib/db";
import { userCollection } from "@/lib/users";
import Job from "@/models/Job";
import PurchaseRequest from "@/models/PurchaseRequest";
import FacultyRequest from "@/models/FacultyRequest";
import Report from "@/models/Report";
import University from "@/models/University";

export type AdminUniversityDTO = {
  id: string;
  name: string;
  slug: string;
  domains: string[];
  active: boolean;
  members: number;
};

export async function getAdminUniversities(): Promise<AdminUniversityDTO[]> {
  await connection();
  await connectDB();
  const unis = await University.find().sort({ name: 1 }).lean();
  const users = await userCollection();
  const counts = await users
    .aggregate([
      { $match: { university: { $in: unis.map((u) => u.slug) } } },
      { $group: { _id: "$university", n: { $sum: 1 } } },
    ])
    .toArray();
  const map = new Map(counts.map((c) => [c._id as string, c.n as number]));

  return unis.map((u) => ({
    id: String(u._id),
    name: u.name,
    slug: u.slug,
    domains: u.domains as string[],
    active: !!u.active,
    members: map.get(u.slug) ?? 0,
  }));
}

const iso = (d: unknown) => new Date(d as string | number | Date).toISOString();

export async function getAdminStats() {
  await connection();
  const users = await userCollection();
  const [totalUsers, totalJobs, openJobs, pendingPurchases, pendingFaculty, openReports] =
    await Promise.all([
      users.countDocuments(),
      Job.countDocuments(),
      Job.countDocuments({ status: "open" }),
      PurchaseRequest.countDocuments({ status: "pending" }),
      FacultyRequest.countDocuments({ status: "pending" }),
      Report.countDocuments({ status: "open" }),
    ]);
  return { totalUsers, totalJobs, openJobs, pendingPurchases, pendingFaculty, openReports };
}

export type AdminPurchaseDTO = {
  id: string;
  userName: string;
  userEmail: string;
  connects: number;
  amount: number;
  method: string;
  senderNumber: string;
  trxId: string;
  status: string;
  adminNote: string;
  createdAt: string;
};

export async function getAdminPurchases(): Promise<{
  pending: AdminPurchaseDTO[];
  recent: AdminPurchaseDTO[];
}> {
  await connection();
  await connectDB();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const toDTO = (r: any): AdminPurchaseDTO => ({
    id: String(r._id),
    userName: r.userName,
    userEmail: r.userEmail,
    connects: r.connects,
    amount: r.amount,
    method: r.method,
    senderNumber: r.senderNumber,
    trxId: r.trxId,
    status: r.status,
    adminNote: r.adminNote ?? "",
    createdAt: iso(r.createdAt),
  });

  const [pending, recent] = await Promise.all([
    PurchaseRequest.find({ status: "pending" }).sort({ createdAt: 1 }).limit(100).lean(),
    PurchaseRequest.find({ status: { $ne: "pending" } }).sort({ reviewedAt: -1 }).limit(20).lean(),
  ]);
  return { pending: pending.map(toDTO), recent: recent.map(toDTO) };
}

export type AdminFacultyDTO = {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  designation: string;
  department: string;
  proof: string;
  status: string;
  createdAt: string;
};

export async function getAdminFaculty(): Promise<{
  pending: AdminFacultyDTO[];
  approved: { id: string; name: string; email: string }[];
}> {
  await connection();
  await connectDB();
  const pending = await FacultyRequest.find({ status: "pending" })
    .sort({ createdAt: 1 })
    .limit(100)
    .lean();

  const users = await userCollection();
  const approved = await users
    .find({ role: "faculty" })
    .project({ name: 1, email: 1 })
    .limit(200)
    .toArray();

  return {
    pending: pending.map((r) => ({
      id: String(r._id),
      userId: r.userId,
      userName: r.userName,
      userEmail: r.userEmail,
      designation: r.designation,
      department: r.department,
      proof: r.proof,
      status: r.status,
      createdAt: iso(r.createdAt),
    })),
    approved: approved.map((u) => ({
      id: String(u._id),
      name: String(u.name ?? ""),
      email: String(u.email ?? ""),
    })),
  };
}

export type AdminReportDTO = {
  id: string;
  jobId: string;
  jobTitle: string;
  jobStatus: string;
  reporterName: string;
  reason: string;
  details: string;
  createdAt: string;
};

export async function getAdminReports(): Promise<AdminReportDTO[]> {
  await connection();
  await connectDB();
  const reports = await Report.find({ status: "open" }).sort({ createdAt: 1 }).limit(100).lean();
  const jobIds = [...new Set(reports.map((r) => r.jobId as string))];
  const jobs = jobIds.length
    ? await Job.find({ _id: { $in: jobIds } }).select("title status").lean()
    : [];
  const jm = new Map(jobs.map((j) => [String(j._id), j]));

  return reports.map((r) => {
    const j = jm.get(r.jobId);
    return {
      id: String(r._id),
      jobId: r.jobId,
      jobTitle: j?.title ?? "(মুছে ফেলা job)",
      jobStatus: j?.status ?? "",
      reporterName: r.reporterName,
      reason: r.reason,
      details: r.details ?? "",
      createdAt: iso(r.createdAt),
    };
  });
}