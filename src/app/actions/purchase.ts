"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { getSession } from "@/lib/session";
import { CONNECT_PACKS, PAYMENT_METHODS } from "@/lib/constants";
import PurchaseRequest from "@/models/PurchaseRequest";

type Result = { ok: true } | { ok: false; error: string };

const schema = z.object({
  packId: z.string().min(1, "একটা pack বেছে নাও"),
  method: z.enum(PAYMENT_METHODS),
  senderNumber: z
    .string()
    .trim()
    .regex(/^01[3-9]\d{8}$/, "যে নম্বর থেকে টাকা পাঠিয়েছ সেটা দাও (01XXXXXXXXX)"),
  trxId: z.string().trim().min(8, "TrxID ঠিক নয়").max(14, "TrxID ঠিক নয়"),
});

export async function createPurchaseRequest(input: unknown): Promise<Result> {
  const session = await getSession();
  if (!session) return { ok: false, error: "আগে login করো" };

  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "ভুল তথ্য দেওয়া হয়েছে" };
  }
  const { packId, method, senderNumber } = parsed.data;
  const trxId = parsed.data.trxId.toUpperCase();
  if (!/^[A-Z0-9]{8,14}$/.test(trxId)) {
    return { ok: false, error: "TrxID-তে শুধু ইংরেজি অক্ষর ও সংখ্যা থাকবে" };
  }

  // দাম ও connect সংখ্যা সবসময় server থেকে, client-এর কথায় না
  const pack = CONNECT_PACKS.find((p) => p.id === packId);
  if (!pack) return { ok: false, error: "Pack পাওয়া যায়নি" };

  const { user } = session;
  await connectDB();

  const pending = await PurchaseRequest.countDocuments({ userId: user.id, status: "pending" });
  if (pending >= 3) {
    return { ok: false, error: "তোমার ৩টা request এখনো অপেক্ষায় আছে। আগে সেগুলো শেষ হোক" };
  }

  try {
    await PurchaseRequest.create({
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      packId: pack.id,
      connects: pack.connects,
      amount: pack.price,
      method,
      senderNumber,
      trxId,
    });
  } catch (e) {
    if ((e as { code?: number })?.code === 11000) {
      return { ok: false, error: "এই TrxID আগেই জমা দেওয়া হয়েছে" };
    }
    console.error("purchase error:", e);
    return { ok: false, error: "জমা দেওয়া যায়নি, আবার চেষ্টা করো" };
  }

  revalidatePath("/connects/buy");
  revalidatePath("/admin");
  return { ok: true };
}