import mongoose, { Schema } from "mongoose";

const ApplicationSchema = new Schema(
  {
    jobId: { type: String, required: true, index: true },
    applicantId: { type: String, required: true, index: true },
    applicantName: { type: String, required: true },
    applicantEmail: { type: String, required: true, select: false },
    applicantContact: { type: String, default: "", select: false },
    coverNote: { type: String, required: true, maxlength: 1000 },
    connectsSpent: { type: Number, default: 0 },
    status: { type: String, enum: ["pending", "hired", "rejected"], default: "pending" },
    refunded: { type: Boolean, default: false },
  },
  { timestamps: true }
);

ApplicationSchema.index({ jobId: 1, applicantId: 1 }, { unique: true });

if (process.env.NODE_ENV !== "production" && mongoose.models.Application) {
  mongoose.deleteModel("Application");
}

export default mongoose.models.Application || mongoose.model("Application", ApplicationSchema);