import { connection } from "next/server";
import { connectDB } from "@/lib/db";
import PurchaseRequest from "@/models/PurchaseRequest";
import FacultyRequest from "@/models/FacultyRequest";

export type MyPurchaseDTO = {
  id: string;
  connects: number;
  amount: number;
  method: string;
  trxId: string;
  status: "pending" | "approved" | "rejected";
  adminNote: string;
  createdAt: string;
};

export async function getMyPurchaseRequests(userId: string): Promise<MyPurchaseDTO[]> {
  await connection();
  await connectDB();
  const rows = await PurchaseRequest.find({ userId }).sort({ createdAt: -1 }).limit(20).lean();
  return rows.map((r) => ({
    id: String(r._id),
    connects: r.connects,
    amount: r.amount,
    method: r.method,
    trxId: r.trxId,
    status: r.status,
    adminNote: r.adminNote ?? "",
    createdAt: new Date(r.createdAt).toISOString(),
  }));
}

export type MyFacultyRequestDTO = {
  status: "pending" | "approved" | "rejected";
  adminNote: string;
  createdAt: string;
};

export async function getMyLatestFacultyRequest(userId: string): Promise<MyFacultyRequestDTO | null> {
  await connection();
  await connectDB();
  const r = await FacultyRequest.findOne({ userId }).sort({ createdAt: -1 }).lean();
  return r
    ? {
        status: r.status,
        adminNote: r.adminNote ?? "",
        createdAt: new Date(r.createdAt).toISOString(),
      }
    : null;
}