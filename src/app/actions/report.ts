"use server";

import { isValidObjectId } from "mongoose";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { getSession } from "@/lib/session";
import { REPORT_REASONS } from "@/lib/constants";
import Job from "@/models/Job";
import Report from "@/models/Report";

type Result = { ok: true } | { ok: false; error: string };

const schema = z.object({
  jobId: z.string().min(1),
  reason: z.enum(REPORT_REASONS),
  details: z.string().trim().max(500, "বিবরণ সর্বোচ্চ ৫০০ অক্ষরের হতে পারবে").optional(),
});

export async function createReport(input: unknown): Promise<Result> {
  const session = await getSession();
  if (!session) return { ok: false, error: "আগে login করো" };

  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "ভুল তথ্য দেওয়া হয়েছে" };
  }
  const { jobId, reason, details } = parsed.data;
  if (!isValidObjectId(jobId)) return { ok: false, error: "Job পাওয়া যায়নি" };

  await connectDB();
  const job = await Job.findById(jobId).select("postedBy").lean();
  if (!job) return { ok: false, error: "Job পাওয়া যায়নি" };
  if (job.postedBy === session.user.id) {
    return { ok: false, error: "নিজের job report করা যায় না" };
  }

  try {
    await Report.create({
      jobId,
      reporterId: session.user.id,
      reporterName: session.user.name,
      reason,
      details: details ?? "",
    });
  } catch (e) {
    if ((e as { code?: number })?.code === 11000) {
      return { ok: false, error: "তুমি আগেই এই job report করেছ" };
    }
    console.error("report error:", e);
    return { ok: false, error: "Report পাঠানো যায়নি, আবার চেষ্টা করো" };
  }

  revalidatePath("/admin");
  return { ok: true };
}