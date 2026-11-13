import mongoose, { Types } from "mongoose";
import { connectDB } from "@/lib/db";

export async function userCollection() {
  await connectDB();
  const db = mongoose.connection.db;
  if (!db) throw new Error("DB connection নেই");
  return db.collection("user");
}

// admin-দের কখনো বদলানো হয় না ({ role: { $ne: "admin" } })
export async function setFacultyStatus(userId: string, approved: boolean): Promise<boolean> {
  if (!Types.ObjectId.isValid(userId)) return false;
  const col = await userCollection();
  const res = await col.updateOne(
    { _id: new Types.ObjectId(userId), role: { $ne: "admin" } },
    {
      $set: approved
        ? { role: "faculty", isFacultyApproved: true }
        : { role: "student", isFacultyApproved: false },
    }
  );
  return res.matchedCount > 0;
}



// OTP সফল হলে user-এর university ঠিক করা
export async function setUniversity(userId: string, slug: string): Promise<boolean> {
  if (!Types.ObjectId.isValid(userId)) return false;
  const col = await userCollection();
  const res = await col.updateOne(
    { _id: new Types.ObjectId(userId) },
    { $set: { university: slug, isUniversityVerified: true } }
  );
  return res.matchedCount > 0;
}

// Student ID approve-এর পর কিছু ভুল হলে ফিরিয়ে নেওয়ার জন্য
export async function unsetUniversity(userId: string): Promise<boolean> {
  if (!Types.ObjectId.isValid(userId)) return false;
  const col = await userCollection();
  const res = await col.updateOne(
    { _id: new Types.ObjectId(userId) },
    { $set: { university: "default", isUniversityVerified: false } }
  );
  return res.matchedCount > 0;
}