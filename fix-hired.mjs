import { MongoClient } from "mongodb";
import { readFileSync } from "node:fs";

const env = readFileSync(".env.local", "utf8");
const uri = env.match(/^MONGODB_URI=(.*)$/m)[1].trim();

const client = new MongoClient(uri, { serverSelectionTimeoutMS: 8000 });
try {
  await client.connect();
  const db = client.db("unlink");
  const jobs = db.collection("jobs");
  const apps = db.collection("applications");

  const broken = await jobs
    .find({
      status: { $in: ["in_progress", "completed"] },
      $or: [
        { hiredApplicantId: { $exists: false } },
        { hiredApplicationId: { $exists: false } },
      ],
    })
    .toArray();

  for (const job of broken) {
    const app = await apps.findOne({ jobId: String(job._id), status: "hired" });
    if (!app) {
      console.log("⚠️ hired application পাওয়া যায়নি:", job.title);
      continue;
    }
    await jobs.updateOne(
      { _id: job._id },
      { $set: { hiredApplicantId: app.applicantId, hiredApplicationId: String(app._id) } }
    );
    console.log("✅ ঠিক করা হলো:", job.title);
  }
  console.log(`মোট ${broken.length}টা job দেখা হয়েছে`);
} catch (e) {
  console.error("❌", e.message);
} finally {
  await client.close();
}