import mongoose, { Schema } from "mongoose";

const ReviewSchema = new Schema(
  {
    jobId: { type: String, required: true, index: true },
    reviewerId: { type: String, required: true },
    reviewerName: { type: String, required: true },
    revieweeId: { type: String, required: true, index: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true, maxlength: 500, default: "" },
  },
  { timestamps: true }
);

// একটা job-এ একজন একবারই review দিতে পারবে
ReviewSchema.index({ jobId: 1, reviewerId: 1 }, { unique: true });

if (process.env.NODE_ENV !== "production" && mongoose.models.Review) {
  mongoose.deleteModel("Review");
}

export default mongoose.models.Review || mongoose.model("Review", ReviewSchema);