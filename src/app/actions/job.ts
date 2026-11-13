"use server";

import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db";
import { getSession } from "@/lib/session";
import { jobSchema } from "@/lib/validations/job";
import { isVerifiedMember } from "@/lib/university";
import { refundSilverCredit, spendSilverCredit } from "@/lib/wallet";
import Job from "@/models/Job";

export type CreateJobResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

export async function createJob(input: unknown): Promise<CreateJobResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Job post করতে আগে login করো" };

  const parsed = jobSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "ভুল তথ্য দেওয়া হয়েছে" };
  }

  const data = parsed.data;
  const { user } = session;

  // Premium: শুধু approved faculty (বা admin)
  if (data.type === "premium") {
    const allowed =
      user.role === "admin" || (user.role === "faculty" && user.isFacultyApproved);
    if (!allowed) {
      return { ok: false, error: "Premium job শুধু approved faculty member-রা post করতে পারেন" };
    }
  }

  // Offline/Both job-এ সরাসরি দেখা হতে পারে, তাই poster-কে verified হতে হবে
  if (data.mode !== "online" && !isVerifiedMember(user)) {
    return {
      ok: false,
      error: "Offline/Both job post করতে আগে University verify করো (Dashboard → University verify)",
    };
  }

  // Silver: ১টা Silver post credit লাগে (atomic, minus হবে না)
  let silverSpent = false;
  if (data.type === "silver") {
    const left = await spendSilverCredit(user.id);
    if (left === null) {
      return {
        ok: false,
        error:
          "তোমার Silver post শেষ। ৫ connect কিনলে ১টা Silver post পাবে, অথবা টাকা দিয়ে কাজ করাতে Golden job post করো",
      };
    }
    silverSpent = true;
  }

  try {
    await connectDB();
    const { contact, ...jobData } = data;
    const job = await Job.create({
      ...jobData,
      budget: data.type === "silver" ? 0 : data.budget, // Silver সবসময় ফ্রি
      deadline: data.deadline ? new Date(data.deadline) : undefined,
      postedBy: user.id,
      posterName: user.name,
      posterEmail: user.email,
      posterContact: contact,
      university: user.university ?? "default",
    });
    revalidatePath("/jobs");
    return { ok: true, id: String(job._id) };
  } catch (e) {
    console.error("createJob error:", e);
    // Job তৈরি হয়নি, তাই credit ফেরত
    if (silverSpent) {
      await refundSilverCredit(user.id).catch((err) => console.error("silver refund error:", err));
    }
    return { ok: false, error: "Job save করা যায়নি, আবার চেষ্টা করো" };
  }
}