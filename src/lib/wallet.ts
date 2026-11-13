import { connection } from "next/server";
import { connectDB } from "@/lib/db";
import {
  CONNECTS_PER_SILVER_CREDIT,
  SILVER_STARTER,
  SILVER_VERIFIED,
} from "@/lib/constants";
import Wallet from "@/models/Wallet";
import ConnectTransaction from "@/models/ConnectTransaction";
import UniversityVerification from "@/models/UniversityVerification";
import { cache } from "react";

type Unit = "connect" | "silver";

// ব্যালেন্স বদলানোই আসল কাজ। Ledger লেখা ব্যর্থ হলে শুধু log হয়, কাজ উল্টে যায় না
async function logTx(entry: {
  userId: string;
  unit: Unit;
  amount: number;
  reason: string;
  balanceAfter?: number;
  jobId?: string;
  ref?: string;
}) {
  try {
    await ConnectTransaction.create(entry);
  } catch (e) {
    console.error("ledger error:", e);
  }
}

// পুরনো wallet-এ silverCredits ছিল না। একবার বসিয়ে দেয় (সাধারণ অবস্থায় কিছুই বদলায় না)
async function backfillSilver(userId: string) {
  const res = await Wallet.updateOne(
    { userId, silverCredits: { $exists: false } },
    { $set: { silverCredits: SILVER_STARTER.posts, bonusTier: "starter" } }
  );
  if (res.modifiedCount === 0) return;

  const verified = await UniversityVerification.exists({ userId, status: "verified" });
  if (verified) {
    await Wallet.updateOne(
      { userId, bonusTier: "starter" },
      { $set: { silverCredits: SILVER_VERIFIED.posts, bonusTier: "verified" } }
    );
  }
}

// প্রথমবার দেখলে wallet তৈরি করে শুরুর অংশ দেয়
export async function ensureWallet(userId: string) {
  await connectDB();
  try {
    const res = await Wallet.updateOne(
      { userId },
      {
        $setOnInsert: {
          balance: SILVER_STARTER.connects,
          silverCredits: SILVER_STARTER.posts,
          bonusTier: "starter",
        },
      },
      { upsert: true }
    );
    if (res.upsertedCount > 0) {
      await logTx({
        userId,
        unit: "connect",
        amount: SILVER_STARTER.connects,
        reason: "signup_bonus",
        balanceAfter: SILVER_STARTER.connects,
      });
      await logTx({
        userId,
        unit: "silver",
        amount: SILVER_STARTER.posts,
        reason: "signup_bonus",
        balanceAfter: SILVER_STARTER.posts,
      });
    }
  } catch (e) {
    // দুটো request একসাথে এলে duplicate key আসতে পারে, সেটা নিরাপদে উপেক্ষা
    if ((e as { code?: number })?.code !== 11000) throw e;
  }
  await backfillSilver(userId);
}

export const getWalletSummary = cache(async (userId: string) => {
  await connection();
  await connectDB();

  let w = await Wallet.findOne({ userId }).lean();
  if (!w || w.silverCredits === undefined) {
    await ensureWallet(userId);
    w = await Wallet.findOne({ userId }).lean();
  }

  return {
    balance: (w?.balance ?? 0) as number,
    silverCredits: (w?.silverCredits ?? 0) as number,
  };
});

export async function getBalance(userId: string): Promise<number> {
  return (await getWalletSummary(userId)).balance;
}

// ---------- Connect ----------

// atomic কাটা: ব্যালেন্স কম থাকলে null, কখনো minus হবে না
export async function spendConnects(userId: string, amount: number, jobId: string) {
  await ensureWallet(userId);
  const w = await Wallet.findOneAndUpdate(
    { userId, balance: { $gte: amount } },
    { $inc: { balance: -amount } },
    { new: true }
  );
  if (!w) return null;
  await logTx({ userId, unit: "connect", amount: -amount, reason: "apply", jobId, balanceAfter: w.balance });
  return w.balance as number;
}

// Job বন্ধ বা কাজ সম্পন্ন হলে ফেরত
export async function refundConnects(
  userId: string,
  amount: number,
  jobId: string,
  reason: "refund" | "completion_refund" = "refund"
) {
  if (amount <= 0) return;
  await ensureWallet(userId);
  const w = await Wallet.findOneAndUpdate({ userId }, { $inc: { balance: amount } }, { new: true });
  if (!w) return;
  await logTx({ userId, unit: "connect", amount, reason, jobId, balanceAfter: w.balance });
}

// Admin-এর হাতে connect যোগ
export async function creditConnects(
  userId: string,
  amount: number,
  reason: "purchase" | "admin_adjust",
  ref?: string
) {
  if (amount <= 0) throw new Error("amount ধনাত্মক হতে হবে");
  await ensureWallet(userId);
  const w = await Wallet.findOneAndUpdate({ userId }, { $inc: { balance: amount } }, { new: true });
  if (!w) throw new Error("wallet পাওয়া যায়নি");
  await logTx({ userId, unit: "connect", amount, reason, ref, balanceAfter: w.balance });
}

// Connect কেনা approve: connect ও Silver post একসাথে, একটাই atomic বদল
export async function creditPurchase(userId: string, connects: number, ref: string) {
  if (connects <= 0) throw new Error("connects ধনাত্মক হতে হবে");
  const credits = Math.floor(connects / CONNECTS_PER_SILVER_CREDIT);

  await ensureWallet(userId);
  const w = await Wallet.findOneAndUpdate(
    { userId },
    { $inc: { balance: connects, silverCredits: credits } },
    { new: true }
  );
  if (!w) throw new Error("wallet পাওয়া যায়নি");

  // এখান থেকে আর কিছু throw হবে না, নইলে approve উল্টে গিয়ে দুবার credit হয়ে যেত
  await logTx({ userId, unit: "connect", amount: connects, reason: "purchase", ref, balanceAfter: w.balance });
  if (credits > 0) {
    await logTx({ userId, unit: "silver", amount: credits, reason: "purchase", ref, balanceAfter: w.silverCredits });
  }
}

// ---------- University verify বোনাস ----------

// শুরুর অংশ থেকে মোট ১০/১০-এ তোলা। একবারই কাজ করে
export async function grantVerificationBonus(userId: string) {
  await ensureWallet(userId);
  const addConnects = SILVER_VERIFIED.connects - SILVER_STARTER.connects;
  const addPosts = SILVER_VERIFIED.posts - SILVER_STARTER.posts;

  const w = await Wallet.findOneAndUpdate(
    { userId, bonusTier: { $ne: "verified" } },
    { $inc: { balance: addConnects, silverCredits: addPosts }, $set: { bonusTier: "verified" } },
    { new: true }
  );
  if (!w) return; // আগেই পেয়েছে

  await logTx({ userId, unit: "connect", amount: addConnects, reason: "verify_bonus", balanceAfter: w.balance });
  await logTx({ userId, unit: "silver", amount: addPosts, reason: "verify_bonus", balanceAfter: w.silverCredits });
}

// ---------- Silver post ----------

// atomic: credit না থাকলে null, minus হবে না
export async function spendSilverCredit(userId: string): Promise<number | null> {
  await ensureWallet(userId);
  const w = await Wallet.findOneAndUpdate(
    { userId, silverCredits: { $gte: 1 } },
    { $inc: { silverCredits: -1 } },
    { new: true }
  );
  if (!w) return null;
  await logTx({ userId, unit: "silver", amount: -1, reason: "silver_post", balanceAfter: w.silverCredits });
  return w.silverCredits as number;
}

// Job save ব্যর্থ হলে credit ফেরত
export async function refundSilverCredit(userId: string) {
  const w = await Wallet.findOneAndUpdate({ userId }, { $inc: { silverCredits: 1 } }, { new: true });
  if (w) {
    await logTx({ userId, unit: "silver", amount: 1, reason: "silver_refund", balanceAfter: w.silverCredits });
  }
}

// ---------- ইতিহাস ----------

export type TransactionDTO = {
  id: string;
  unit: Unit;
  amount: number;
  reason: string;
  jobId?: string;
  balanceAfter?: number;
  createdAt: string;
};

export async function getRecentTransactions(userId: string, limit = 30): Promise<TransactionDTO[]> {
  await connection();
  await connectDB();
  const rows = await ConnectTransaction.find({ userId }).sort({ createdAt: -1 }).limit(limit).lean();
  return rows.map((t) => ({
    id: String(t._id),
    unit: (t.unit ?? "connect") as Unit,
    amount: t.amount,
    reason: t.reason,
    jobId: t.jobId,
    balanceAfter: t.balanceAfter,
    createdAt: new Date(t.createdAt).toISOString(),
  }));
}