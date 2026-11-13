import { connection } from "next/server";
import { connectDB } from "@/lib/db";
import Review from "@/models/Review";

export type ReviewDTO = {
  id: string;
  jobId: string;
  reviewerId: string;
  reviewerName: string;
  revieweeId: string;
  rating: number;
  comment: string;
  createdAt: string;
};

export type RatingSummary = { avg: number; count: number };

export async function getReviewsForJob(jobId: string): Promise<ReviewDTO[]> {
  await connection();
  await connectDB();
  const rs = await Review.find({ jobId }).sort({ createdAt: 1 }).lean();
  return rs.map((r) => ({
    id: String(r._id),
    jobId: r.jobId,
    reviewerId: r.reviewerId,
    reviewerName: r.reviewerName,
    revieweeId: r.revieweeId,
    rating: r.rating,
    comment: r.comment ?? "",
    createdAt: new Date(r.createdAt).toISOString(),
  }));
}

// একাধিক user-এর গড় রেটিং একবারে
export async function getRatings(userIds: string[]): Promise<Record<string, RatingSummary>> {
  if (userIds.length === 0) return {};
  await connection();
  await connectDB();
  const rows = await Review.aggregate([
    { $match: { revieweeId: { $in: userIds } } },
    { $group: { _id: "$revieweeId", avg: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);
  const out: Record<string, RatingSummary> = {};
  for (const r of rows) out[r._id] = { avg: Math.round(r.avg * 10) / 10, count: r.count };
  return out;
}