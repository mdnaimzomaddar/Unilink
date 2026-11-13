import mongoose, { Schema } from "mongoose";
import { CATEGORIES, JOB_TYPES, WORK_MODES } from "@/lib/constants";

const JobSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, required: true, maxlength: 5000 },
    type: { type: String, enum: [...JOB_TYPES], required: true, index: true },
    budget: { type: Number, default: 0, min: 0 },
    category: { type: String, enum: [...CATEGORIES], required: true, index: true },
    mode: { type: String, enum: [...WORK_MODES], default: "online" },
    skills: { type: [String], default: [] },
    deadline: { type: Date },
    status: {
      type: String,
      enum: ["open", "in_progress", "completed", "closed"],
      default: "open",
      index: true,
    },
    postedBy: { type: String, required: true, index: true },
    posterName: { type: String, required: true },
    posterEmail: { type: String, required: true, select: false },
    posterContact: { type: String, default: "", select: false },
    hiredApplicantId: { type: String },
    hiredApplicationId: { type: String },
    completedAt: { type: Date },
    university: { type: String, default: "default", index: true },
  },
  { timestamps: true }
);

if (process.env.NODE_ENV !== "production" && mongoose.models.Job) {
  mongoose.deleteModel("Job");
}

export default mongoose.models.Job || mongoose.model("Job", JobSchema);