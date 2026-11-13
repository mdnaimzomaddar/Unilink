import { connectDB } from "@/lib/db";
import NotificationModel from "@/models/Notification";

export async function notify(userId: string, n: { type: string; text: string; link: string }) {
  try {
    await connectDB();
    await NotificationModel.create({
      userId,
      type: n.type,
      text: n.text.slice(0, 200),
      link: n.link,
    });
  } catch (e) {
    console.error("notify error:", e);
  }
}