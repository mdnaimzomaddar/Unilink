import mongoose, { Schema } from "mongoose";

const MessageSchema = new Schema(
  {
    jobId: { type: String, required: true, index: true },
    senderId: { type: String, required: true },
    senderName: { type: String, required: true },
    recipientId: { type: String, required: true },
    kind: { type: String, enum: ["text", "meeting"], default: "text" },
    text: { type: String, trim: true, maxlength: 1000, default: "" },
    meetingUrl: { type: String },
    readAt: { type: Date, default: null },
  },
  { timestamps: true }
);

MessageSchema.index({ jobId: 1, createdAt: 1 });
MessageSchema.index({ recipientId: 1, readAt: 1 });

if (process.env.NODE_ENV !== "production" && mongoose.models.Message) {
  mongoose.deleteModel("Message");
}

export default mongoose.models.Message || mongoose.model("Message", MessageSchema);