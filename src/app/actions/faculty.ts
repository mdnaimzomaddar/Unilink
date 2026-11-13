"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { getSession } from "@/lib/session";
import FacultyRequest from "@/models/FacultyRequest";

type Result = { ok: true } | { ok: false; error: string };

const schema = z.object({
  designation: z.string().trim().min(2, "পদবি লেখো").max(80),
  department: z.string().trim().min(2, "বিভাগ লেখো").max(80),
  proof: z
    .string()
    .trim()
    .min(5, "প্রমাণ দাও: university-র official profile link বা staff ID")
    .max(300),
});

export async function requestFaculty(input: unknown): Promise<Result> {
  const session = await getSession();
  if (!session) return { ok: false, error: "আগে login করো" };

  const { user } = session;
  if (user.role === "admin" || (user.role === "faculty" && user.isFacultyApproved)) {
    return { ok: false, error: "তুমি ইতিমধ্যে verified" };
  }

  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "ভুল তথ্য দেওয়া হয়েছে" };
  }

  await connectDB();
  const pending = await FacultyRequest.exists({ userId: user.id, status: "pending" });
  if (pending) return { ok: false, error: "তোমার আগের আবেদন এখনো যাচাই হচ্ছে" };

  await FacultyRequest.create({
    userId: user.id,
    userName: user.name,
    userEmail: user.email,
    ...parsed.data,
  });

  revalidatePath("/faculty/apply");
  revalidatePath("/admin");
  return { ok: true };
}