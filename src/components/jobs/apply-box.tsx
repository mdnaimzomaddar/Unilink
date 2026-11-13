"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { applyToJob } from "@/app/actions/application";
import { Button } from "@/components/ui/button";
import type { WorkMode } from "@/lib/constants";
import Link from "next/link";
import { toast } from "react-toastify";
const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200";


export default function ApplyBox({
  jobId,
  cost,
  balance,
  mode,
}: {
  jobId: string;
  cost: number;
  balance: number;
  mode: WorkMode;
}) {
  const router = useRouter();
  const [coverNote, setCoverNote] = useState("");
  const [contact, setContact] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const insufficient = cost > balance;

async function handleSubmit(e: React.FormEvent) {
  e.preventDefault();
  setLoading(true);
  const res = await applyToJob({ jobId, coverNote, contact });
  setLoading(false);
  if (!res.ok) return toast.error(res.error);
  toast.success("আবেদন পাঠানো হয়েছে ✅");
  router.refresh();
}

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Apply করো</h2>
        <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 ring-1 ring-amber-200">
          {cost === 0 ? "ফ্রি apply" : `⚡ ${cost} connect · ব্যালেন্স ${balance}`}
        </span>
      </div>

      <textarea className={inputClass} rows={4} required value={coverNote}
        onChange={(e) => setCoverNote(e.target.value)}
        placeholder="কেন তুমি এই কাজের জন্য উপযুক্ত? আগের অভিজ্ঞতা, কী সাহায্য করতে পারবে..." />

      <div className="space-y-1">
        <input className={inputClass} required={mode !== "online"} value={contact}
          onChange={(e) => setContact(e.target.value)}
          placeholder={mode === "online" ? "Phone / WhatsApp (ঐচ্ছিক)" : "তোমার Phone / WhatsApp"} />
        <p className="text-xs text-slate-500">🔒 শুধু hire হলে poster এটা দেখতে পাবে।</p>
        <p className="text-xs text-slate-500">🔒 শুধু hire হলে poster এটা দেখতে পাবে।</p>
      </div>

      {insufficient && (
        <p className="text-sm text-red-600">
          তোমার connect যথেষ্ট নেই।{" "}
          <Link href="/connects/buy" className="font-medium underline">
            Connect কেনো →
          </Link>
        </p>
      )}
      <Button type="submit" className="w-full" disabled={loading || insufficient}>
        {loading ? "পাঠানো হচ্ছে..." : "আবেদন পাঠাও"}
      </Button>
    </form>
  );
}