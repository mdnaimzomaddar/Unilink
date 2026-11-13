"use server";

import { isValidObjectId } from "mongoose";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { getSession } from "@/lib/session";
import { refundConnects } from "@/lib/wallet";
import Job from "@/models/Job";
import Application from "@/models/Application";
import Review from "@/models/Review";
import { notify } from "@/lib/notify";

type Result = { ok: true } | { ok: false; error: string };

function refresh(jobId: string) {
  revalidatePath(`/jobs/${jobId}`);
  revalidatePath("/jobs");
  revalidatePath("/dashboard");
}

// Hire না করে job বন্ধ: সব pending আবেদনকারী connect ফেরত পাবে
export async function closeJob(jobId: string): Promise<Result> {
  const session = await getSession();
  if (!session) return { ok: false, error: "আগে login করো" };
  if (!isValidObjectId(jobId)) return { ok: false, error: "Job পাওয়া যায়নি" };

  await connectDB();

  // atomic: শুধু poster, শুধু open job। এরপর আর কেউ hire করতে পারবে না
  const job = await Job.findOneAndUpdate(
    { _id: jobId, postedBy: session.user.id, status: "open" },
    { status: "closed" },
    { new: true }
  );
  if (!job) {
    return { ok: false, error: "Job বন্ধ করা যায়নি (তুমি poster নও, বা job আর open নেই)" };
  }

  const pending = await Application.find({ jobId, status: "pending" }).select("_id").lean();
  for (const p of pending) {
    try {
      // আগে "দাবি" করি (pending → rejected), তারপর refund। দুবার refund হবে না
      const claimed = await Application.findOneAndUpdate(
        { _id: p._id, status: "pending" },
        { status: "rejected", refunded: true }
      );
      if (claimed) {
        const cost = claimed.connectsSpent ?? 0;
        await refundConnects(claimed.applicantId, cost, jobId);
        await notify(claimed.applicantId, {
          type: "job_closed",
          text: `Job বন্ধ হয়েছে: ${job.title}${cost > 0 ? `। ${cost} connect ফেরত পেয়েছ` : ""}`,
          link: `/jobs/${jobId}`,
        });
      }
    } catch (e) {
      console.error("refund error:", e);
    }
  }

  refresh(jobId);
  return { ok: true };
}

// কাজ শেষ: in_progress → completed

export async function completeJob(jobId: string): Promise<Result> {
  const session = await getSession();
  if (!session) return { ok: false, error: "আগে login করো" };
  if (!isValidObjectId(jobId)) return { ok: false, error: "Job পাওয়া যায়নি" };

  await connectDB();
  const job = await Job.findOneAndUpdate(
    { _id: jobId, postedBy: session.user.id, status: "in_progress" },
    { status: "completed", completedAt: new Date() },
    { new: true }
  );
  if (!job) return { ok: false, error: "কাজ শেষ হিসেবে mark করা যায়নি" };

  if (job.hiredApplicationId) {
    try {
    
      const claimed = await Application.findOneAndUpdate(
        {
          _id: job.hiredApplicationId,
          status: "hired",
          refunded: { $ne: true },
          connectsSpent: { $gt: 0 },
        },
        { refunded: true }
      );
      if (claimed) {
        await refundConnects(claimed.applicantId, claimed.connectsSpent, jobId, "completion_refund");
      }
    } catch (e) {
      console.error("completion refund error:", e);
    }
  }

  refresh(jobId);
  return { ok: true };
}

const reviewSchema = z.object({
  jobId: z.string().min(1),
  rating: z.number().int().min(1, "Star রেটিং দাও").max(5),
  comment: z.string().trim().max(500, "মন্তব্য সর্বোচ্চ ৫০০ অক্ষরের হতে পারবে").optional(),
});

export async function submitReview(input: unknown): Promise<Result> {
  const session = await getSession();
  if (!session) return { ok: false, error: "আগে login করো" };

  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "ভুল তথ্য দেওয়া হয়েছে" };
  }
  const { jobId, rating, comment } = parsed.data;
  if (!isValidObjectId(jobId)) return { ok: false, error: "Job পাওয়া যায়নি" };

  await connectDB();
  const job = await Job.findById(jobId).lean();
  if (!job || job.status !== "completed") {
    return { ok: false, error: "কাজ শেষ হওয়ার পরেই review দেওয়া যায়" };
  }

  
  const uid = session.user.id;
  let revieweeId: string | undefined;
  if (job.postedBy === uid) revieweeId = job.hiredApplicantId;
  else if (job.hiredApplicantId === uid) revieweeId = job.postedBy;
  if (!revieweeId) return { ok: false, error: "শুধু এই কাজের দুই পক্ষ review দিতে পারে" };

  try {
    await Review.create({
      jobId,
      reviewerId: uid,
      reviewerName: session.user.name,
      revieweeId,
      rating,
      comment: comment ?? "",
    });
  } catch (e) {
    if ((e as { code?: number })?.code === 11000) {
      return { ok: false, error: "তুমি আগেই review দিয়েছ" };
    }
    console.error("review error:", e);
    return { ok: false, error: "Review save করা যায়নি, আবার চেষ্টা করো" };
  }

    if (job.hiredApplicantId) {
    await notify(job.hiredApplicantId, {
      type: "completed",
      text: `✅ কাজ সম্পন্ন হয়েছে: ${job.title}। এবার review দাও`,
      link: `/jobs/${jobId}`,
    });
  }

  await notify(revieweeId, {
    type: "review",
    text: `⭐ ${session.user.name} তোমাকে review দিয়েছেন`,
    link: `/jobs/${jobId}`,
  });

  refresh(jobId);
  return { ok: true };
}