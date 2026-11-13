import { Schema } from "mongoose";
import { PAYMENT_METHODS } from "@/lib/constants";
import { defineModel } from "@/lib/define-model";

const PurchaseSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    userName: { type: String, required: true },
    userEmail: { type: String, required: true },
    packId: { type: String, required: true },
    connects: { type: Number, required: true },
    amount: { type: Number, required: true }, // ৳ (server থেকে বসানো)
    method: { type: String, enum: [...PAYMENT_METHODS], required: true },
    senderNumber: { type: String, required: true },
    // একই TrxID দুবার জমা দেওয়া যাবে না
    trxId: { type: String, required: true, unique: true },
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

export default defineModel("PurchaseRequest", PurchaseSchema);