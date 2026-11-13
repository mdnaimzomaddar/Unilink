import { Schema, model, models } from "mongoose";

const UserSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ["student", "faculty", "admin"], default: "student" },
    isVerified: { type: Boolean, default: false },      // university email verified
    isFacultyApproved: { type: Boolean, default: false }, // Premium post করার অনুমতি
    university: { type: String, default: "default", index: true }, // future subdomain
    department: String,
    skills: [String],
    bio: String,
  },
  { timestamps: true }
);

export default models.User || model("User", UserSchema);