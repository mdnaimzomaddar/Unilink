import { Schema } from "mongoose";
import { defineModel } from "@/lib/define-model";

const UniversitySchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    domains: { type: [String], default: [] }, // যেমন ["buet.ac.bd"]
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// একটা domain শুধু একটা university-র হবে
UniversitySchema.index({ domains: 1 }, { unique: true });

export default defineModel("University", UniversitySchema);