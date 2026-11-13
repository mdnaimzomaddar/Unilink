"use server";

import { isValidObjectId } from "mongoose";
import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
import { setFacultyStatus } from "@/lib/users";
import { creditPurchase, refundConnects } from "@/lib/wallet";
import Job from "@/models/Job";
import Application from "@/models/Application";
import PurchaseRequest from "@/models/PurchaseRequest";
import FacultyRequest from "@/models/FacultyRequest";
import Report from "@/models/Report";


type Result = { ok: true } | { ok: false; error: string };

const DENIED: Result = { ok: false, error: "এই কাজের অনুমতি তোমার নেই" };
const note = (s?: string) => (s ?? "").trim().slice(0, 300);

function refresh() {
  revalidatePath("/admin");
  revalidatePath("/jobs");
  revalidatePath("/dashboard");
  revalidatePath("/connects/buy");
}

// ---------- Connect কেনা ----------
export async function approvePurchase(id: string): Promise<Result> {
  const admin = await requireAdmin();
  if (!admin) return DENIED;
  if (!isValidObjectId(id)) return { ok: false, error: "Request পাওয়া যায়নি" };

  await connectDB();
  // আগে "দাবি" করি (pending → approved), তারপর connect যোগ। দুবার যোগ হবে না
  const req = await PurchaseRequest.findOneAndUpdate(
    { _id: id, status: "pending" },
    { status: "approved", reviewedBy: admin.user.id, reviewedAt: new Date() }
  );
  if (!req) return { ok: false, error: "এই request আর pending নেই" };

  try {
    await creditPurchase(req.userId, req.connects, String(req._id));
  } catch (e) {
    console.error("credit error:", e);
    await PurchaseRequest.updateOne(
      { _id: req._id },
      { status: "pending", $unset: { reviewedBy: "", reviewedAt: "" } }
    );
    return { ok: false, error: "Connect যোগ করা যায়নি, আবার চেষ্টা করো" };
  }

  refresh();
  return { ok: true };
}

export async function rejectPurchase(id: string, reason?: string): Promise<Result> {
  const admin = await requireAdmin();
  if (!admin) return DENIED;
  if (!isValidObjectId(id)) return { ok: false, error: "Request পাওয়া যায়নি" };

  await connectDB();
  const req = await PurchaseRequest.findOneAndUpdate(
    { _id: id, status: "pending" },
    { status: "rejected", adminNote: note(reason), reviewedBy: admin.user.id, reviewedAt: new Date() }
  );
  if (!req) return { ok: false, error: "এই request আর pending নেই" };

  refresh();
  return { ok: true };
}

// ---------- Faculty ----------
export async function approveFaculty(id: string): Promise<Result> {
  const admin = await requireAdmin();
  if (!admin) return DENIED;
  if (!isValidObjectId(id)) return { ok: false, error: "আবেদন পাওয়া যায়নি" };

  await connectDB();
  const req = await FacultyRequest.findOneAndUpdate(
    { _id: id, status: "pending" },
    { status: "approved", reviewedBy: admin.user.id, reviewedAt: new Date() }
  );
  if (!req) return { ok: false, error: "এই আবেদন আর pending নেই" };

  const done = await setFacultyStatus(req.userId, true);
  if (!done) {
    await FacultyRequest.updateOne(
      { _id: req._id },
      { status: "pending", $unset: { reviewedBy: "", reviewedAt: "" } }
    );
    return { ok: false, error: "User-এর role বদলানো যায়নি (user নেই বা admin)" };
  }

  refresh();
  return { ok: true };
}

export async function rejectFaculty(id: string, reason?: string): Promise<Result> {
  const admin = await requireAdmin();
  if (!admin) return DENIED;
  if (!isValidObjectId(id)) return { ok: false, error: "আবেদন পাওয়া যায়নি" };

  await connectDB();
  const req = await FacultyRequest.findOneAndUpdate(
    { _id: id, status: "pending" },
    { status: "rejected", adminNote: note(reason), reviewedBy: admin.user.id, reviewedAt: new Date() }
  );
  if (!req) return { ok: false, error: "এই আবেদন আর pending নেই" };

  refresh();
  return { ok: true };
}

export async function revokeFaculty(userId: string): Promise<Result> {
  const admin = await requireAdmin();
  if (!admin) return DENIED;

  const done = await setFacultyStatus(userId, false);
  if (!done) return { ok: false, error: "Role বদলানো যায়নি" };

  refresh();
  return { ok: true };
}

// ---------- Report ও Job moderation ----------
export async function resolveReport(
  id: string,
  status: "resolved" | "dismissed",
  reason?: string
): Promise<Result> {
  const admin = await requireAdmin();
  if (!admin) return DENIED;
  if (!isValidObjectId(id)) return { ok: false, error: "Report পাওয়া যায়নি" };

  await connectDB();
  const r = await Report.findOneAndUpdate(
    { _id: id, status: "open" },
    { status, adminNote: note(reason), reviewedBy: admin.user.id, reviewedAt: new Date() }
  );
  if (!r) return { ok: false, error: "এই report আর open নেই" };

  refresh();
  return { ok: true };
}

// Admin job বন্ধ করলে অপেক্ষমান ও hired সবার connect ফেরত যায়
export async function adminCloseJob(jobId: string): Promise<Result> {
  const admin = await requireAdmin();
  if (!admin) return DENIED;
  if (!isValidObjectId(jobId)) return { ok: false, error: "Job পাওয়া যায়নি" };

  await connectDB();
  const job = await Job.findOneAndUpdate(
    { _id: jobId, status: { $in: ["open", "in_progress"] } },
    { status: "closed" },
    { new: true }
  );
  if (!job) return { ok: false, error: "এই job বন্ধ করা যাবে না (আগেই বন্ধ বা সম্পন্ন)" };

  const apps = await Application.find({
    jobId,
    status: { $in: ["pending", "hired"] },
    refunded: { $ne: true },
  }).lean();

  for (const a of apps) {
    try {
      const cost = a.connectsSpent ?? 0;
      const claimed = await Application.findOneAndUpdate(
        { _id: a._id, status: { $in: ["pending", "hired"] }, refunded: { $ne: true } },
        { status: "rejected", refunded: cost > 0 }
      );
      if (claimed && cost > 0) await refundConnects(claimed.applicantId, cost, jobId);
    } catch (e) {
      console.error("admin refund error:", e);
    }
  }

  revalidatePath(`/jobs/${jobId}`);
  refresh();
  return { ok: true };
}