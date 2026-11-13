import { isValidObjectId } from "mongoose";
import { connectDB } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
import StudentVerification from "@/models/StudentVerification";

export async function GET(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return new Response("Not found", { status: 404 });

  const id = new URL(req.url).pathname.split("/").filter(Boolean).pop() ?? "";
  if (!isValidObjectId(id)) return new Response("Not found", { status: 404 });

  await connectDB();
  const doc = await StudentVerification.findOne({ _id: id, status: "pending" }).select("+imageData imageType");
  if (!doc?.imageData) return new Response("Not found", { status: 404 });

  return new Response(new Uint8Array(Buffer.from(doc.imageData)), {
    headers: {
      "Content-Type": doc.imageType ?? "image/jpeg",
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "Content-Disposition": "inline",
    },
  });
}