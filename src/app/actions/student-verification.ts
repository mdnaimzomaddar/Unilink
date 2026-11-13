"use server";

import { isValidObjectId } from "mongoose";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
import { getSession } from "@/lib/session";
import { isVerifiedMember } from "@/lib/university";
import { hashStudentId, newChallengeCode } from "@/lib/student-verification";
import { notify } from "@/lib/notify";
import { setUniversity, unsetUniversity } from "@/lib/users";
import { grantVerificationBonus } from "@/lib/wallet";
import University from "@/models/University";
import StudentVerification from "@/models/StudentVerification";

type Result = { ok: true } | { ok: false; error: string };

const DAY_MS = 24 * 60 * 60 * 1000;

const startSchema = z.object({
  university: z.string().min(1, "University বেছে নাও"),
  department: z.string().trim().min(2, "বিভাগ লেখো").max(80),
  studentId: z
    .string()
    .trim()
    .regex(
      /^[A-Za-z0-9][A-Za-z0-9 \-/_.]{2,29}$/,
      "Student ID ঠিক নয়, card-এ যেভাবে লেখা আছে সেভাবে দাও"
    ),
});

// ধাপ ১: তথ্য নিয়ে draft বানানো ও নিরাপত্তা-কোড দেওয়া
export async function startStudentVerification(
  input: unknown
): Promise<{ ok: true; id: string; code: string } | { ok: false; error: string }> {
  const session = await getSession();
  if (!session) return { ok: false, error: "আগে login করো" };
  const { user } = session;
  if (isVerifiedMember(user)) return { ok: false, error: "তুমি ইতিমধ্যে verified" };

  const parsed = startSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "ভুল তথ্য দেওয়া হয়েছে" };
  }
  const { university, department, studentId } = parsed.data;

  await connectDB();
  const uni = await University.findOne({ slug: university, active: true }).lean();
  if (!uni) return { ok: false, error: "University পাওয়া যায়নি" };

  if (await StudentVerification.exists({ userId: user.id, status: "pending" })) {
    return { ok: false, error: "তোমার আগের আবেদন এখনো যাচাই হচ্ছে" };
  }

  const recent = await StudentVerification.countDocuments({
    userId: user.id,
    createdAt: { $gte: new Date(Date.now() - DAY_MS) },
  });
  if (recent >= 5) return { ok: false, error: "আজকের জন্য চেষ্টার সীমা শেষ, কাল আবার চেষ্টা করো" };

  if (
    await StudentVerification.exists({
      studentIdHash: hashStudentId(university, studentId),
      status: "approved",
    })
  ) {
    return { ok: false, error: "এই student ID আগেই অন্য account-এ verify করা হয়েছে" };
  }

  const code = newChallengeCode();
  const doc = await StudentVerification.create({
    userId: user.id,
    userName: user.name,
    userEmail: user.email,
    university,
    department,
    studentId,
    code,
    purgeAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
  });

  return { ok: true, id: String(doc._id), code };
}

// Admin-এর সিদ্ধান্ত
export async function decideStudentVerification(
  id: string,
  decision: "approve" | "reject",
  note?: string
): Promise<Result> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "এই কাজের অনুমতি তোমার নেই" };
  if (!isValidObjectId(id)) return { ok: false, error: "আবেদন পাওয়া যায়নি" };

  await connectDB();
  const v = await StudentVerification.findOne({ _id: id, status: "pending" }).lean();
  if (!v) return { ok: false, error: "এই আবেদন আর pending নেই" };

  const cleanNote = (note ?? "").trim().slice(0, 300);
  const reviewedAt = new Date();

  if (decision === "reject") {
    if (!cleanNote) return { ok: false, error: "Reject-এর কারণ লিখতে হবে" };

    const r = await StudentVerification.findOneAndUpdate(
      { _id: id, status: "pending" },
      {
        status: "rejected",
        adminNote: cleanNote,
        reviewedBy: admin.user.id,
        reviewedAt,
        $unset: { imageData: "", studentId: "" }, // ছবি ও ID মুছে ফেলা
      }
    );
    if (!r) return { ok: false, error: "এই আবেদন আর pending নেই" };

    await notify(v.userId, {
      type: "verification",
      text: `Student ID যাচাই গৃহীত হয়নি: ${cleanNote}`,
      link: "/verify-university?method=card",
    });
  } else {
    const hash = hashStudentId(v.university, v.studentId ?? "");
    if (await StudentVerification.exists({ studentIdHash: hash, status: "approved" })) {
      return { ok: false, error: "এই student ID আগেই অন্য account-এ verify করা হয়েছে" };
    }
    if (!(await setUniversity(v.userId, v.university))) {
      return { ok: false, error: "User পাওয়া যায়নি" };
    }

    try {
      const r = await StudentVerification.findOneAndUpdate(
        { _id: id, status: "pending" },
        {
          status: "approved",
          studentIdHash: hash,
          reviewedBy: admin.user.id,
          reviewedAt,
          $unset: { imageData: "", studentId: "" },
        }
      );
      if (!r) return { ok: false, error: "এই আবেদন আর pending নেই" };
    } catch (e) {
      if ((e as { code?: number })?.code === 11000) {
        await unsetUniversity(v.userId);
        return { ok: false, error: "এই student ID আগেই অন্য account-এ verify করা হয়েছে" };
      }
      throw e;
    }

    try {
      await grantVerificationBonus(v.userId);
    } catch (e) {
      console.error("verification bonus error:", e);
    }

    await notify(v.userId, {
      type: "verification",
      text: "তোমার Student ID যাচাই সফল হয়েছে। বোনাস যোগ হয়েছে",
      link: "/dashboard",
    });
  }

  revalidatePath("/admin");
  revalidatePath("/dashboard");
  revalidatePath("/verify-university");
  return { ok: true };
}