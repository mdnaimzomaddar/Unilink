import { MongoClient } from "mongodb";
import { readFileSync } from "node:fs";

const uri = readFileSync(".env.local", "utf8").match(/^MONGODB_URI=(.*)$/m)[1].trim();
const client = new MongoClient(uri, { serverSelectionTimeoutMS: 10000 });

try {
  await client.connect();
  const col = client.db("unilink").collection("universities");
  const idx = await col.indexes();
  console.log("এখনকার index:", idx.map((i) => i.name).join(", "));

  if (idx.some((i) => i.name === "domains_1")) {
    await col.dropIndex("domains_1");
    console.log("পুরনো domains_1 index মুছে ফেলা হয়েছে");
  } else {
    console.log("পুরনো index নেই, কিছু করার দরকার নেই");
  }
} catch (e) {
  console.error("সমস্যা:", e.message);
} finally {
  await client.close();
}