"use server";

import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db";
import { getSession } from "@/lib/session";
import { sendMail } from "@/lib/mailer";
import { isVerifiedMember, matchUniversity, parseEmail } from "@/lib/university";
import { setUniversity } from "@/lib/users";
import University from "@/models/University";
import UniversityVerification from "@/models/UniversityVerification";
import { grantVerificationBonus } from "@/lib/wallet";

type Result = { ok: true } | { ok: false; error: string };
type VerifyResult = { ok: true; universityName: string } | { ok: false; error: string };

const CODE_TTL_MS = 10 * 60 * 1000;
const COOLDOWN_MS = 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const MAX_SENDS_PER_DAY = 5;

// কোড কখনো সরাসরি রাখা হয় না, শুধু HMAC hash
function hashCode(userId: string, email: string, code: string) {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret) throw new Error("BETTER_AUTH_SECRET নেই");
  return createHmac("sha256", secret).update(`${userId}:${email}:${code}`).digest("hex");
}

export async function sendUniversityCode(rawEmail: string): Promise<Result> {
  const session = await getSession();
  if (!session) return { ok: false, error: "আগে login করো" };
  const { user } = session;
  if (isVerifiedMember(user)) return { ok: false, error: "তুমি ইতিমধ্যে verified" };

  const parsed = parseEmail(String(rawEmail ?? ""));
  if (!parsed) return { ok: false, error: "সঠিক email দাও" };

  const uni = await matchUniversity(parsed.domain);
  if (!uni) {
    return {
      ok: false,
      error: "এই email-এর domain কোনো সমর্থিত university-র সাথে মেলেনি। তোমার university-র email ব্যবহার করো",
    };
  }

  await connectDB();

  if (await UniversityVerification.exists({ email: parsed.email, status: "verified" })) {
    return { ok: false, error: "এই email আগেই অন্য account-এ verify করা হয়েছে" };
  }

  const now = Date.now();

  // ৬০ সেকেন্ডের অপেক্ষা
  const last = await UniversityVerification.findOne({ userId: user.id })
    .sort({ createdAt: -1 })
    .lean();
  if (last) {
    const elapsed = now - new Date(last.createdAt).getTime();
    if (elapsed < COOLDOWN_MS) {
      return { ok: false, error: `${Math.ceil((COOLDOWN_MS - elapsed) / 1000)} সেকেন্ড পরে আবার পাঠাতে পারবে` };
    }
  }

  // দিনে সীমা: user-এর দিক থেকেও, target email-এর দিক থেকেও (অন্যের inbox ভরে দেওয়া ঠেকাতে)
  const since = new Date(now - DAY_MS);
  const [byUser, byEmail] = await Promise.all([
    UniversityVerification.countDocuments({ userId: user.id, createdAt: { $gte: since } }),
    UniversityVerification.countDocuments({ email: parsed.email, createdAt: { $gte: since } }),
  ]);
  if (byUser >= MAX_SENDS_PER_DAY || byEmail >= MAX_SENDS_PER_DAY) {
    return { ok: false, error: "আজকের জন্য কোড পাঠানোর সীমা শেষ, কাল আবার চেষ্টা করো" };
  }

  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");

  await UniversityVerification.updateMany(
    { userId: user.id, status: "pending" },
    { status: "superseded" }
  );
  const doc = await UniversityVerification.create({
    userId: user.id,
    email: parsed.email,
    university: uni.slug,
    codeHash: hashCode(user.id, parsed.email, code),
    expiresAt: new Date(now + CODE_TTL_MS),
    purgeAt: new Date(now + 7 * DAY_MS),
  });

  const sent = await sendMail({
    to: parsed.email,
    subject: "Unilink verification code",
    text: `তোমার Unilink verification কোড: ${code}\n\nএই কোড ১০ মিনিট পর্যন্ত কাজ করবে। তুমি চাওনি? এই email উপেক্ষা করো।`,
    html: `<p>তোমার Unilink verification কোড:</p><p style="font-size:28px;font-weight:bold;letter-spacing:4px">${code}</p><p>এই কোড ১০ মিনিট পর্যন্ত কাজ করবে। তুমি চাওনি? এই email উপেক্ষা করো।</p>`,
  });
  if (!sent.ok) {
    await UniversityVerification.updateOne({ _id: doc._id }, { status: "superseded" });
    return { ok: false, error: sent.error };
  }

  revalidatePath("/verify-university");
  return { ok: true };
}

export async function verifyUniversityCode(rawCode: string): Promise<VerifyResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "আগে login করো" };
  const { user } = session;
  if (isVerifiedMember(user)) return { ok: false, error: "তুমি ইতিমধ্যে verified" };

  const code = String(rawCode ?? "").trim();
  if (!/^\d{6}$/.test(code)) return { ok: false, error: "৬ সংখ্যার কোড দাও" };

  await connectDB();

  const pending = await UniversityVerification.findOne({ userId: user.id, status: "pending" })
    .sort({ createdAt: -1 })
    .lean();
  if (!pending) return { ok: false, error: "কোড পাওয়া যায়নি, নতুন করে কোড পাঠাও" };
  if (new Date(pending.expiresAt).getTime() < Date.now()) {
    return { ok: false, error: "কোডের মেয়াদ শেষ, নতুন কোড পাঠাও" };
  }

  const uni = await University.findOne({ slug: pending.university, active: true }).lean();
  if (!uni) return { ok: false, error: "এই university এখন সক্রিয় নয়" };

  // atomic: ভুল চেষ্টার সীমা পার হলে আর কোড মেলানোই হবে না
  const tried = await UniversityVerification.findOneAndUpdate(
    { _id: pending._id, status: "pending", attempts: { $lt: MAX_ATTEMPTS } },
    { $inc: { attempts: 1 } },
    { new: true }
  );
  if (!tried) return { ok: false, error: "অনেকবার ভুল হয়েছে, নতুন কোড পাঠাও" };

  const expected = Buffer.from(hashCode(user.id, pending.email, code), "hex");
  const actual = Buffer.from(pending.codeHash, "hex");
  const match = expected.length === actual.length && timingSafeEqual(expected, actual);
  if (!match) {
    const left = MAX_ATTEMPTS - tried.attempts;
    return { ok: false, error: `ভুল কোড${left > 0 ? `, আর ${left} বার চেষ্টা করতে পারবে` : ", নতুন কোড পাঠাও"}` };
  }

  // সফল: verified দাবি করা। একই email অন্য account-এ থাকলে unique index আটকাবে
  try {
    const claimed = await UniversityVerification.findOneAndUpdate(
      { _id: pending._id, status: "pending" },
      { status: "verified", verifiedAt: new Date(), $unset: { purgeAt: "" } }
    );
    if (!claimed) return { ok: false, error: "কোডটি আর ব্যবহারযোগ্য নয়, নতুন কোড পাঠাও" };
  } catch (e) {
    if ((e as { code?: number })?.code === 11000) {
      return { ok: false, error: "এই email আগেই অন্য account-এ verify করা হয়েছে" };
    }
    console.error("verify claim error:", e);
    return { ok: false, error: "Verify করা যায়নি, আবার চেষ্টা করো" };
  }

  const done = await setUniversity(user.id, pending.university);
  if (!done) {
    await UniversityVerification.updateOne(
      { _id: pending._id },
      { status: "pending", $unset: { verifiedAt: "" } }
    );
    return { ok: false, error: "Account আপডেট করা যায়নি, আবার চেষ্টা করো" };
  }

  try {
    await grantVerificationBonus(user.id);
  } catch (e) {
    console.error("verification bonus error:", e);
  }

  revalidatePath("/verify-university");
  revalidatePath("/dashboard");
  revalidatePath("/jobs");
  return { ok: true, universityName: uni.name as string };
}