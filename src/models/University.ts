import { Schema } from "mongoose";
import { defineModel } from "@/lib/define-model";

const UniversitySchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    shortName: { type: String, trim: true, maxlength: 20, default: "" },
    type: { type: String, enum: ["public", "private", "other"], default: "other" },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    domains: { type: [String], default: [] },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Email domain থাকলে সেটা একটাই university-র হবে।
// domain ছাড়া (খালি) university যত খুশি থাকতে পারে
UniversitySchema.index(
  { domains: 1 },
  {
    unique: true,
    partialFilterExpression: { "domains.0": { $exists: true } },
    name: "domains_unique_nonempty",
  }
);

export default defineModel("University", UniversitySchema);