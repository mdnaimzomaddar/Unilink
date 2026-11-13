import { Schema } from "mongoose";
import { defineModel } from "@/lib/define-model";

const VerificationSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    email: { type: String, required: true, lowercase: true, index: true },
    university: { type: String, required: true }, // slug
    codeHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    attempts: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["pending", "verified", "superseded"],
      default: "pending",
      index: true,
    },
    verifiedAt: { type: Date },
    purgeAt: { type: Date }, // verified হলে মুছে ফেলা হয় (স্থায়ী থাকে), বাকিগুলো ৭ দিন পর নিজে মুছে যায়
  },
  { timestamps: true }
);

// একটা university email শুধু একটা account-এ verified থাকতে পারবে
VerificationSchema.index(
  { email: 1 },
  { unique: true, partialFilterExpression: { status: "verified" }, name: "email_verified_unique" }
);
VerificationSchema.index({ purgeAt: 1 }, { expireAfterSeconds: 0 });

export default defineModel("UniversityVerification", VerificationSchema);