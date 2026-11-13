import { Schema } from "mongoose";
import { REPORT_REASONS } from "@/lib/constants";
import { defineModel } from "@/lib/define-model";

const ReportSchema = new Schema(
  {
    jobId: { type: String, required: true, index: true },
    reporterId: { type: String, required: true },
    reporterName: { type: String, required: true },
    reason: { type: String, enum: [...REPORT_REASONS], required: true },
    details: { type: String, trim: true, maxlength: 500, default: "" },
    status: {
      type: String,
      enum: ["open", "resolved", "dismissed"],
      default: "open",
      index: true,
    },
    adminNote: { type: String, default: "" },
    reviewedBy: { type: String },
    reviewedAt: { type: Date },
  },
  { timestamps: true }
);

// একই job-এ একজন একবারই report করতে পারবে
ReportSchema.index({ jobId: 1, reporterId: 1 }, { unique: true });

export default defineModel("Report", ReportSchema);