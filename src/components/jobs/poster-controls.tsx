"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { closeJob, completeJob } from "@/app/actions/lifecycle";
import { Button } from "@/components/ui/button";
import { toast } from "react-toastify";

export default function PosterControls({
  jobId,
  status,
  pendingCount,
}: {
  jobId: string;
  status: "open" | "in_progress";
  pendingCount: number;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onClose() {
    const msg =
      pendingCount > 0
        ? `Job বন্ধ করলে ${pendingCount} জন আবেদনকারী তাদের connect ফেরত পাবে। বন্ধ করবে?`
        : "Job বন্ধ করবে?";
    if (!confirm(msg)) return;
    setLoading(true);
    const res = await closeJob(jobId);
    setLoading(false);
    if (!res.ok) return toast.error(res.error);
    toast.success("Job বন্ধ হয়েছে");
    router.refresh();
  }

  async function onComplete() {
    if (!confirm("কাজটা কি সত্যিই শেষ হয়েছে?")) return;
    setLoading(true);
    const res = await completeJob(jobId);
    setLoading(false);
    if (!res.ok) return toast.error(res.error);
    toast.success("কাজ সম্পন্ন হয়েছে 🎉");
    router.refresh();
  }

  return (
    <div className="space-y-3 rounded-2xl border bg-white p-5 shadow-sm">
      {status === "open" ? (
        <>
          <p className="text-sm text-slate-600">
            কাউকে hire না করেই job বন্ধ করলে সব অপেক্ষমান আবেদনকারী তাদের connect ফেরত পাবে।
          </p>
          <Button variant="outline" disabled={loading} onClick={onClose}>
            {loading ? "অপেক্ষা করো..." : "🚫 Job বন্ধ করো"}
          </Button>
        </>
      ) : (
        <>
          <p className="text-sm text-slate-600">
            কাজ শেষ হলে নিচের বোতাম চাপো। এরপর দুজনেই একে অপরকে review দিতে পারবে।
          </p>
          <Button disabled={loading} onClick={onComplete}>
            {loading ? "অপেক্ষা করো..." : "✅ কাজ শেষ হয়েছে"}
          </Button>
        </>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}