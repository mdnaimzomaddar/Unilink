import { connection } from "next/server";
import { connectDB } from "@/lib/db";
import NotificationModel from "@/models/Notification";

export type NotificationDTO = {
  id: string;
  type: string;
  text: string;
  link: string;
  read: boolean;
  createdAt: string;
};

export async function getNotifications(userId: string, limit = 50): Promise<NotificationDTO[]> {
  await connection();
  await connectDB();
  const rows = await NotificationModel.find({ userId }).sort({ createdAt: -1 }).limit(limit).lean();
  return rows.map((n) => ({
    id: String(n._id),
    type: n.type,
    text: n.text,
    link: n.link,
    read: !!n.readAt,
    createdAt: new Date(n.createdAt).toISOString(),
  }));
}

export async function getUnreadNotificationCount(userId: string): Promise<number> {
  await connection();
  await connectDB();
  return NotificationModel.countDocuments({ userId, readAt: null });
}