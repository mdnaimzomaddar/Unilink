import { createHmac, randomInt } from "node:crypto";
import { connection } from "next/server";
import { connectDB } from "@/lib/db";
import { getUniversityNames } from "@/lib/university";
import StudentVerification from "@/models/StudentVerification";

export const MAX_IMAGE_BYTES = 1_500_000;

// একই ID বড়-ছোট হাতের বা ফাঁকা দিয়ে লিখলেও একই hash
export function hashStudentId(university: string, studentId: string) {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret) throw new Error("BETTER_AUTH_SECRET নেই");
  const normalized = studentId.toUpperCase().replace(/\s+/g, "");
  return createHmac("sha256", secret).update(`${university}:${normalized}`).digest("hex");
}

export function newChallengeCode() {
  return `UL-${randomInt(1000, 10000)}`;
}

// ফাইলের আসল ধরন যাচাই (MIME নাম বিশ্বাস না করে)
export function detectImage(buf: Buffer): "image/jpeg" | "image/png" | "image/webp" | null {
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (
    buf.length > 8 &&
    buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  ) {
    return "image/png";
  }
  if (
    buf.length > 12 &&
    buf.subarray(0, 4).toString("ascii") === "RIFF" &&
    buf.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return "image/webp";
  }
  return null;
}

export type MyStudentVerificationDTO = {
  status: "pending" | "rejected";
  universityName: string;
  adminNote: string;
  createdAt: string;
};

export async function getMyLatestStudentVerification(
  userId: string
): Promise<MyStudentVerificationDTO | null> {
  await connection();
  await connectDB();
  const v = await StudentVerification.findOne({ userId, status: { $in: ["pending", "rejected"] } })
    .sort({ createdAt: -1 })
    .lean();
  if (!v) return null;
  const names = await getUniversityNames([v.university as string]);
  return {
    status: v.status,
    universityName: names[v.university] ?? v.university,
    adminNote: v.adminNote ?? "",
    createdAt: new Date(v.createdAt).toISOString(),
  };
}

export type AdminStudentVerificationDTO = {
  id: string;
  userName: string;
  userEmail: string;
  universityName: string;
  department: string;
  studentId: string;
  code: string;
  createdAt: string;
};

export async function getAdminStudentVerifications(): Promise<AdminStudentVerificationDTO[]> {
  await connection();
  await connectDB();
  const rows = await StudentVerification.find({ status: "pending" }).sort({ createdAt: 1 }).limit(100).lean();
  const names = await getUniversityNames(rows.map((r) => r.university as string));
  return rows.map((r) => ({
    id: String(r._id),
    userName: r.userName,
    userEmail: r.userEmail,
    universityName: names[r.university] ?? r.university,
    department: r.department,
    studentId: r.studentId ?? "",
    code: r.code,
    createdAt: new Date(r.createdAt).toISOString(),
  }));
}

export async function countPendingStudentVerifications() {
  await connection();
  await connectDB();
  return StudentVerification.countDocuments({ status: "pending" });
}