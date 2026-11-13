import { Schema } from "mongoose";
import { defineModel } from "@/lib/define-model";

const WalletSchema = new Schema(
  {
    userId: { type: String, required: true, unique: true },
    balance: { type: Number, required: true, default: 0, min: 0 }, // connect
    silverCredits: { type: Number, default: 0, min: 0 }, // বাকি Silver post
    bonusTier: { type: String, enum: ["starter", "verified"], default: "starter" },
  },
  { timestamps: true }
);

export default defineModel("Wallet", WalletSchema);