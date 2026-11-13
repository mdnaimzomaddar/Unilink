"use server";

import { isValidObjectId } from "mongoose";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { getSession } from "@/lib/session";
import { connectCost } from "@/lib/constants";
import { spendConnects } from "@/lib/wallet";
import Job from "@/models/Job";
import Application from "@/models/Application";
import { isVerifiedMember } from "@/lib/university";


type Result = { ok: true } | { ok: false; error: string };

const applySchema = z.object({
  jobId: z.string().min(1),
  coverNote: z.string().trim().min(10, "কেন তুমি উপযুক্ত, কমপক্ষে ১০ অক্ষরে লেখো").max(1000),
  contact: z.string().trim().max(60),
});

export async function applyToJob(input: unknown): Promise<Result> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Apply করতে আগে login করো" };

  const parsed = applySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "ভুল তথ্য দেওয়া হয়েছে" };
  }
  const { jobId, coverNote, contact } = parsed.data;
  if (!isValidObjectId(jobId)) return { ok: false, error: "Job পাওয়া যায়নি" };

  const { user } = session;
  await connectDB();

  const job = await Job.findById(jobId).lean();
  if (!job) return { ok: false, error: "Job পাওয়া যায়নি" };
  if (job.status !== "open") return { ok: false, error: "এই job আর আবেদন নিচ্ছে না" };
  if (job.postedBy === user.id) return { ok: false, error: "নিজের job-এ apply করা যায় না" };
  if (job.mode === "offline" && !(isVerifiedMember(user) && user.university === job.university)) {
    return {
      ok: false,
      error: "Offline job-এ শুধু একই university-র verified শিক্ষার্থীরা apply করতে পারবে",
    };
  }
  
    if (job.mode !== "online" && contact.length < 6) {
    return { ok: false, error: "Offline/Both job-এ Phone/WhatsApp নম্বর দাও" };
  }

  const cost = connectCost(job.type, job.category, job.budget ?? 0);

  // ১) আগে application তৈরি। unique index দ্বিতীয়বার apply আটকাবে
  let application;
  try {
    application = await Application.create({
      jobId,
      applicantId: user.id,
      applicantName: user.name,
      applicantEmail: user.email,
      applicantContact: contact,
      coverNote,
      connectsSpent: cost,
    });
  } catch (e) {
    if ((e as { code?: number })?.code === 11000) {
      return { ok: false, error: "তুমি আগেই এই job-এ apply করেছ" };
    }
    console.error("apply error:", e);
    return { ok: false, error: "Apply করা যায়নি, আবার চেষ্টা করো" };
  }

  // ২) connect কাটা (Silver-এ কাটা নেই)
  if (cost > 0) {
    try {
      const balance = await spendConnects(user.id, cost, jobId);
      if (balance === null) {
        await Application.deleteOne({ _id: application._id });
        return { ok: false, error: `Apply করতে ${cost} connect লাগবে, তোমার কাছে যথেষ্ট নেই` };
      }
    } catch (e) {
      console.error("spend error:", e);
      await Application.deleteOne({ _id: application._id });
      return { ok: false, error: "Connect কাটা যায়নি, আবার চেষ্টা করো" };
    }
  }

  revalidatePath(`/jobs/${jobId}`);
  return { ok: true };
}

export async function hireApplicant(applicationId: string): Promise<Result> {
  const session = await getSession();
  if (!session) return { ok: false, error: "আগে login করো" };
  if (!isValidObjectId(applicationId)) return { ok: false, error: "আবেদন পাওয়া যায়নি" };

  await connectDB();
  const app = await Application.findById(applicationId).lean();
  if (!app || app.status !== "pending") {
    return { ok: false, error: "এই আবেদনটি আর hire করা যাবে না" };
  }

  // atomic: শুধু poster-ই, শুধু open job-এ, একবারই hire করতে পারবে
  const job = await Job.findOneAndUpdate(
    { _id: app.jobId, postedBy: session.user.id, status: "open" },
    {
      status: "in_progress",
      hiredApplicantId: app.applicantId,
      hiredApplicationId: String(app._id),
    },
    { new: true }
  );
  if (!job) {
    return { ok: false, error: "Hire করা যায়নি (তুমি poster নও, বা job আর open নেই)" };
  }

  await Application.updateOne({ _id: app._id }, { status: "hired" });
  await Application.updateMany(
    { jobId: app.jobId, _id: { $ne: app._id }, status: "pending" },
    { status: "rejected" }
  );

  revalidatePath(`/jobs/${app.jobId}`);
  revalidatePath("/jobs");
  return { ok: true };
}