import { Schema } from "mongoose";
import { defineModel } from "@/lib/define-model";

const FacultyRequestSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    userName: { type: String, required: true },
    userEmail: { type: String, required: true },
    designation: { type: String, required: true, maxlength: 80 },
    department: { type: String, required: true, maxlength: 80 },
    proof: { type: String, required: true, maxlength: 300 }, // official profile link / staff ID
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    adminNote: { type: String, default: "" },
    reviewedBy: { type: String },
    reviewedAt: { type: Date },
  },
  { timestamps: true }
);

export default defineModel("FacultyRequest", FacultyRequestSchema);