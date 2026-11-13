import { Schema } from "mongoose";
import { defineModel } from "@/lib/define-model";

const NotificationSchema = new Schema(
  {
    userId: { type: String, required: true },
    type: { type: String, required: true },
    text: { type: String, required: true, maxlength: 200 },
    link: { type: String, required: true },
    readAt: { type: Date, default: null },
  },
  { timestamps: true }
);

NotificationSchema.index({ userId: 1, readAt: 1, createdAt: -1 });
// ৯০ দিন পর নিজে মুছে যাবে
NotificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });

export default defineModel("Notification", NotificationSchema);