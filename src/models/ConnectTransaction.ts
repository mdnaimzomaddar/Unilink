import { Schema } from "mongoose";
import { defineModel } from "@/lib/define-model";

const TxSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    unit: { type: String, enum: ["connect", "silver"], default: "connect" },
    amount: { type: Number, required: true }, // + বাড়লে, − কমলে
    reason: {
      type: String,
      enum: [
        "signup_bonus",
        "verify_bonus",
        "apply",
        "refund",
        "completion_refund",
        "purchase",
        "silver_post",
        "silver_refund",
        "admin_adjust",
      ],
      required: true,
    },
    jobId: String,
    ref: String, // কেনা request-এর id
    balanceAfter: Number,
  },
  { timestamps: true }
);

export default defineModel("ConnectTransaction", TxSchema);