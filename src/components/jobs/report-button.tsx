"use client";

import { useState } from "react";
import { createReport } from "@/app/actions/report";
import { Button } from "@/components/ui/button";
import { REPORT_REASONS, REPORT_REASON_LABEL, type ReportReason } from "@/lib/constants";
import { toast } from "react-toastify";


const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200";

export default function ReportButton({ jobId }: { jobId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason>("spam");
  const [details, setDetails] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await createReport({ jobId, reason, details });
    setLoading(false);
    if (!res.ok) return toast.error(res.error);
    toast.success("Report পাঠানো হয়েছে");
    setDone(true);
  }

  if (done) {
    return <p className="text-center text-sm text-emerald-700">✅ Report পাঠানো হয়েছে। Admin দেখবেন।</p>;
  }

  if (!open) {
    return (
      <div className="text-center">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-sm text-slate-500 underline hover:text-red-600"
        >
          🚩 এই job-এ সমস্যা আছে? Report করো
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-2xl border bg-white p-5 shadow-sm">
      <h3 className="font-semibold">Report করো</h3>
      <select className={inputClass} value={reason} onChange={(e) => setReason(e.target.value as ReportReason)}>
        {REPORT_REASONS.map((r) => (
          <option key={r} value={r}>
            {REPORT_REASON_LABEL[r]}
          </option>
        ))}
      </select>
      <textarea className={inputClass} rows={3} maxLength={500} value={details}
        onChange={(e) => setDetails(e.target.value)} placeholder="কী সমস্যা? (ঐচ্ছিক)" />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" disabled={loading}>
          {loading ? "পাঠানো হচ্ছে..." : "Report পাঠাও"}
        </Button>
        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
          বাতিল
        </Button>
      </div>
    </form>
  );
}