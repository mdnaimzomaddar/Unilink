import mongoose, { Schema } from "mongoose";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function defineModel(name: string, schema: Schema): mongoose.Model<any> {
  if (process.env.NODE_ENV !== "production" && mongoose.models[name]) {
    mongoose.deleteModel(name);
  }
  return mongoose.models[name] || mongoose.model(name, schema);
}