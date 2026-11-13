"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { submitReview } from "@/app/actions/lifecycle";
import { Button } from "@/components/ui/button";
import { toast } from "react-toastify";

export default function ReviewBox({
  jobId,
  revieweeName,
}: {
  jobId: string;
  revieweeName: string;
}) {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

async function handleSubmit(e: React.FormEvent) {
  e.preventDefault();
  setLoading(true);
  const res = await submitReview({ jobId, rating, comment });
  setLoading(false);
  if (!res.ok) return toast.error(res.error);
  toast.success("Review পাঠানো হয়েছে ⭐");
  router.refresh();
}

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-2xl border bg-white p-5 shadow-sm">
      <h3 className="font-semibold">{revieweeName}-কে review দাও</h3>

      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            aria-label={`${n} star`}
            className={`text-3xl leading-none transition ${
              n <= rating ? "text-amber-500" : "text-slate-300 hover:text-amber-300"
            }`}
          >
            ★
          </button>
        ))}
      </div>

      <textarea
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
        rows={3}
        maxLength={500}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="অভিজ্ঞতা কেমন ছিল? (ঐচ্ছিক)"
      />
      <p className="text-xs text-slate-500">
        দুজনেই review দেওয়ার পর একে অপরেরটা দেখতে পাবে।
      </p>

      <Button type="submit" disabled={loading || rating === 0}>
        {loading ? "পাঠানো হচ্ছে..." : "Review পাঠাও"}
      </Button>
    </form>
  );
}