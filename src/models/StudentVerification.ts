import { Schema } from "mongoose";
import { defineModel } from "@/lib/define-model";

const StudentVerificationSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    userName: { type: String, required: true },
    userEmail: { type: String, required: true },
    university: { type: String, required: true }, // slug
    department: { type: String, required: true, trim: true, maxlength: 80 },
    studentId: { type: String, trim: true, maxlength: 40 }, // সিদ্ধান্তের পর মুছে যায়
    studentIdHash: { type: String }, // approve হলে থাকে
    code: { type: String, required: true }, // কাগজে লিখে ছবিতে দেখাতে হয়
    status: {
      type: String,
      enum: ["draft", "pending", "approved", "rejected"],
      default: "draft",
      index: true,
    },
    imageData: { type: Buffer, select: false }, // সিদ্ধান্তের পর মুছে যায়
    imageType: { type: String },
    adminNote: { type: String, default: "" },
    reviewedBy: { type: String },
    reviewedAt: { type: Date },
    purgeAt: { type: Date }, // শুধু draft-এ: ২ ঘণ্টা পর নিজে মুছে যায়
  },
  { timestamps: true }
);

StudentVerificationSchema.index({ purgeAt: 1 }, { expireAfterSeconds: 0 });
// একই student ID দিয়ে একাধিক account verified হতে পারবে না
StudentVerificationSchema.index(
  { studentIdHash: 1 },
  {
    unique: true,
    partialFilterExpression: { status: "approved" },
    name: "student_id_approved_unique",
  }
);

export default defineModel("StudentVerification", StudentVerificationSchema);