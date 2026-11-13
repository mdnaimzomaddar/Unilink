import { MongoClient } from "mongodb";
import { readFileSync } from "node:fs";

const uri = readFileSync(".env.local", "utf8").match(/^MONGODB_URI=(.*)$/m)[1].trim();
const client = new MongoClient(uri, { serverSelectionTimeoutMS: 10000 });

await client.connect();
const db = client.db("unlink");

const times = [];
for (let i = 0; i < 8; i++) {
  const t = performance.now();
  await db.command({ ping: 1 });
  times.push(performance.now() - t);
}

console.log("প্রতিটা ping (ms):", times.map((t) => Math.round(t)).join(", "));
const warm = times.slice(1);
console.log("গড় (প্রথমটা বাদে):", Math.round(warm.reduce((a, b) => a + b) / warm.length), "ms");
await client.close();