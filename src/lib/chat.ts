import { connection } from "next/server";
import { isValidObjectId } from "mongoose";
import { connectDB } from "@/lib/db";
import type { WorkMode } from "@/lib/constants";
import Job from "@/models/Job";
import Application from "@/models/Application";
import Message from "@/models/Message";

export type MessageDTO = {
  id: string;
  senderId: string;
  senderName: string;
  kind: "text" | "meeting";
  text: string;
  meetingUrl?: string;
  createdAt: string;
};

export type ChatAccess = {
  jobId: string;
  mode: WorkMode;
  me: string;
  otherId: string;
  otherName: string;
  canSend: boolean; // কাজ চলাকালীন শুধু
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const toDTO = (m: any): MessageDTO => ({
  id: String(m._id),
  senderId: m.senderId,
  senderName: m.senderName,
  kind: m.kind ?? "text",
  text: m.text ?? "",
  meetingUrl: m.meetingUrl ?? undefined,
  createdAt: new Date(m.createdAt).toISOString(),
});

// শুধু Google Meet ও Zoom (https) link গ্রহণযোগ্য, ফিশিং ঠেকাতে
export function parseMeetingUrl(raw: string): string | null {
  try {
    const u = new URL(raw.trim());
    if (u.protocol !== "https:") return null;
    const h = u.hostname.toLowerCase();
    const ok = h === "meet.google.com" || h === "zoom.us" || h.endsWith(".zoom.us");
    return ok ? u.toString() : null;
  } catch {
    return null;
  }
}

// Chat-এ ঢোকার অনুমতি: শুধু ওই job-এর poster ও hired ব্যক্তি
function deny(reason: string): null {
  if (process.env.NODE_ENV !== "production") {
    console.warn(`[chat] access denied: ${reason}`);
  }
  return null;
}

export async function getChatAccess(jobId: string, userId: string): Promise<ChatAccess | null> {
  if (!isValidObjectId(jobId)) return deny(`jobId ঠিক নয়: ${jobId}`);
  await connectDB();

  const job = await Job.findById(jobId).lean();
  if (!job) return deny("job পাওয়া যায়নি");
  if (!["in_progress", "completed"].includes(job.status)) {
    return deny(`job-এর status ${job.status}`);
  }

  // hired application-ই সত্যের উৎস, Job-এর hired* field-এর উপর নির্ভর না করে
  const hired = await Application.findOne({ jobId, status: "hired" })
    .select("applicantId applicantName")
    .lean();
  if (!hired) return deny("এই job-এ hired application নেই");

  let otherId: string;
  let otherName: string;

  if (job.postedBy === userId) {
    otherId = hired.applicantId;
    otherName = hired.applicantName ?? "Applicant";
  } else if (hired.applicantId === userId) {
    otherId = job.postedBy;
    otherName = job.posterName;
  } else {
    return deny("এই user poster-ও না, hired ব্যক্তিও না");
  }

  return {
    jobId,
    mode: (job.mode ?? "online") as WorkMode,
    me: userId,
    otherId,
    otherName,
    canSend: job.status === "in_progress",
  };
}

export async function listMessages(access: ChatAccess, after?: string): Promise<MessageDTO[]> {
  await connectDB();

  const q: Record<string, unknown> = { jobId: access.jobId };
  if (after) {
    const d = new Date(after);
    if (!Number.isNaN(d.getTime())) q.createdAt = { $gte: d }; // client নিজে duplicate বাদ দেয়
  }

  const rows = await Message.find(q).sort({ createdAt: -1 }).limit(200).lean();
  rows.reverse();

  // আমার জন্য আসা অপঠিত message গুলো পঠিত করা
  const unreadIds = rows.filter((m) => m.recipientId === access.me && !m.readAt).map((m) => m._id);
  if (unreadIds.length > 0) {
    await Message.updateMany({ _id: { $in: unreadIds } }, { readAt: new Date() });
  }
  return rows.map(toDTO);
}

export async function createMessage(
  access: ChatAccess,
  senderName: string,
  input: { text?: unknown; meetingUrl?: unknown }
): Promise<{ ok: true; message: MessageDTO } | { ok: false; error: string }> {
  if (!access.canSend) {
    return { ok: false, error: "কাজ শেষ হয়ে গেছে, এখন আর message পাঠানো যায় না" };
  }

  let kind: "text" | "meeting" = "text";
  let text = "";
  let meetingUrl: string | undefined;

  if (typeof input.meetingUrl === "string" && input.meetingUrl.trim()) {
    if (access.mode === "offline") {
      return { ok: false, error: "Offline job-এ meeting link লাগে না" };
    }
    const safe = parseMeetingUrl(input.meetingUrl);
    if (!safe) return { ok: false, error: "শুধু Google Meet ও Zoom-এর (https) link গ্রহণযোগ্য" };
    kind = "meeting";
    meetingUrl = safe;
  } else if (typeof input.text === "string") {
    text = input.text.trim();
    if (!text) return { ok: false, error: "খালি message পাঠানো যায় না" };
    if (text.length > 1000) return { ok: false, error: "Message সর্বোচ্চ ১০০০ অক্ষরের হতে পারবে" };
  } else {
    return { ok: false, error: "ভুল অনুরোধ" };
  }

  await connectDB();

  // Spam ঠেকাতে: ১০ সেকেন্ডে সর্বোচ্চ ৫টা
  const recent = await Message.countDocuments({
    jobId: access.jobId,
    senderId: access.me,
    createdAt: { $gte: new Date(Date.now() - 10_000) },
  });
  if (recent >= 5) return { ok: false, error: "একটু ধীরে পাঠাও" };

  const m = await Message.create({
    jobId: access.jobId,
    senderId: access.me,
    senderName,
    recipientId: access.otherId,
    kind,
    text,
    meetingUrl,
  });
  return { ok: true, message: toDTO(m) };
}

export async function getUnreadCount(userId: string): Promise<number> {
  await connection();
  await connectDB();
  return Message.countDocuments({ recipientId: userId, readAt: null });
}

export type ChatSummaryDTO = {
  jobId: string;
  title: string;
  otherName: string;
  status: string;
  unread: number;
  lastText: string | null;
};

export async function getMyChats(userId: string): Promise<ChatSummaryDTO[]> {
  await connection();
  await connectDB();

  const jobs = await Job.find({
    status: { $in: ["in_progress", "completed"] },
    $or: [{ postedBy: userId }, { hiredApplicantId: userId }],
  })
    .sort({ updatedAt: -1 })
    .limit(50)
    .lean();
  if (jobs.length === 0) return [];

  const ids = jobs.map((j) => String(j._id));

  // আমি poster হলে অপর পক্ষের নাম Application থেকে আনতে হয়
  const appIds = jobs
    .filter((j) => j.postedBy === userId && j.hiredApplicationId)
    .map((j) => j.hiredApplicationId as string);
  const apps = appIds.length
    ? await Application.find({ _id: { $in: appIds } }).select("applicantName").lean()
    : [];
  const nameByApp = new Map(apps.map((a) => [String(a._id), a.applicantName as string]));

  const stats = await Message.aggregate([
    { $match: { jobId: { $in: ids } } },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: "$jobId",
        last: { $first: "$$ROOT" },
        unread: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ["$recipientId", userId] },
                  { $eq: [{ $ifNull: ["$readAt", null] }, null] },
                ],
              },
              1,
              0,
            ],
          },
        },
      },
    },
  ]);
  const sm = new Map(stats.map((s) => [s._id as string, s]));

  return jobs.map((j) => {
    const s = sm.get(String(j._id));
    const isPoster = j.postedBy === userId;
    return {
      jobId: String(j._id),
      title: j.title,
      otherName: isPoster ? nameByApp.get(j.hiredApplicationId) ?? "Applicant" : j.posterName,
      status: j.status,
      unread: s?.unread ?? 0,
      lastText: s ? (s.last.kind === "meeting" ? "📹 Meeting link" : s.last.text) : null,
    };
  });
}