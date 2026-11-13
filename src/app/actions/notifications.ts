"use server";

import { isValidObjectId } from "mongoose";
import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db";
import { getSession } from "@/lib/session";
import NotificationModel from "@/models/Notification";

export async function markNotificationRead(id: string) {
  const session = await getSession();
  if (!session || !isValidObjectId(id)) return;
  await connectDB();
  await NotificationModel.updateOne(
    { _id: id, userId: session.user.id, readAt: null },
    { readAt: new Date() }
  );
  revalidatePath("/notifications");
}

export async function markAllNotificationsRead() {
  const session = await getSession();
  if (!session) return;
  await connectDB();
  await NotificationModel.updateMany({ userId: session.user.id, readAt: null }, { readAt: new Date() });
  revalidatePath("/notifications");
}