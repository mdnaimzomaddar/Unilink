import { NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import { connectDB } from "@/lib/db";
import { getSession } from "@/lib/session";
import { MAX_IMAGE_BYTES, detectImage } from "@/lib/student-verification";
import StudentVerification from "@/models/StudentVerification";

const noStore = { "Cache-Control": "no-store" };
const fail = (error: string, status = 400) =>
  NextResponse.json({ ok: false, error }, { status, headers: noStore });

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return fail("আগে login করো", 401);

  const form = await req.formData().catch(() => null);
  if (!form) return fail("ভুল অনুরোধ");

  const id = String(form.get("id") ?? "");
  const file = form.get("image");
  if (!isValidObjectId(id) || !(file instanceof File)) return fail("ভুল অনুরোধ");
  if (file.size === 0 || file.size > MAX_IMAGE_BYTES) return fail("ছবি সর্বোচ্চ ১.৫ MB হতে পারবে");

  const buf = Buffer.from(await file.arrayBuffer());
  const type = detectImage(buf);
  if (!type) return fail("শুধু JPG, PNG বা WebP ছবি গ্রহণযোগ্য");

  await connectDB();
  // শুধু নিজের, মেয়াদ থাকা draft-ই pending হতে পারে
  const doc = await StudentVerification.findOneAndUpdate(
    { _id: id, userId: session.user.id, status: "draft", purgeAt: { $gt: new Date() } },
    { status: "pending", imageData: buf, imageType: type, $unset: { purgeAt: "" } }
  );
  if (!doc) return fail("সময় শেষ হয়ে গেছে বা আগেই জমা হয়েছে। নতুন করে শুরু করো");

  return NextResponse.json({ ok: true }, { headers: noStore });
}