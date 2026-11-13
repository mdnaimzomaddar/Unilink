"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import {
  adminCloseJob,
  approveFaculty,
  approvePurchase,
  rejectFaculty,
  rejectPurchase,
  resolveReport,
  revokeFaculty,
} from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { IconBan, IconCheck, IconCross } from "@/components/icons";

type Result = { ok: true } | { ok: false; error: string };

function useRunner() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function run(fn: () => Promise<Result>, success: string, confirmMsg?: string) {
    if (confirmMsg && !confirm(confirmMsg)) return;
    setBusy(true);
    const res = await fn();
    setBusy(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success(success);
    router.refresh();
  }
  return { busy, run };
}

export function PurchaseActions({ id, amount, trxId }: { id: string; amount: number; trxId: string }) {
  const { busy, run } = useRunner();
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        size="sm"
        className="gap-1.5"
        disabled={busy}
        onClick={() =>
          run(
            () => approvePurchase(id),
            "Connect যোগ হয়েছে",
            `bKash/Nagad অ্যাপে TrxID ${trxId} ও ৳${amount} মিলিয়ে দেখেছ? Approve করলে connect যোগ হবে।`
          )
        }
      >
        <IconCheck className="h-4 w-4" /> Approve
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="gap-1.5"
        disabled={busy}
        onClick={() => {
          const reason = prompt("Reject-এর কারণ (user দেখতে পাবে):") ?? "";
          run(() => rejectPurchase(id, reason), "Request reject করা হয়েছে");
        }}
      >
        <IconCross className="h-4 w-4" /> Reject
      </Button>
    </div>
  );
}

export function FacultyActions({ id }: { id: string }) {
  const { busy, run } = useRunner();
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        size="sm"
        className="gap-1.5"
        disabled={busy}
        onClick={() =>
          run(() => approveFaculty(id), "Faculty approve করা হয়েছে", "প্রমাণ যাচাই করেছ? Approve করলে Premium job post আনলক হবে।")
        }
      >
        <IconCheck className="h-4 w-4" /> Approve
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="gap-1.5"
        disabled={busy}
        onClick={() => {
          const reason = prompt("Reject-এর কারণ (user দেখতে পাবে):") ?? "";
          run(() => rejectFaculty(id, reason), "আবেদন reject করা হয়েছে");
        }}
      >
        <IconCross className="h-4 w-4" /> Reject
      </Button>
    </div>
  );
}

export function RevokeButton({ userId }: { userId: string }) {
  const { busy, run } = useRunner();
  return (
    <Button
      size="sm"
      variant="outline"
      disabled={busy}
      onClick={() => run(() => revokeFaculty(userId), "অনুমতি বাতিল করা হয়েছে", "এই faculty-র অনুমতি বাতিল করবে?")}
    >
      অনুমতি বাতিল
    </Button>
  );
}

export function ReportActions({ id, jobId, canClose }: { id: string; jobId: string; canClose: boolean }) {
  const { busy, run } = useRunner();
  return (
    <div className="flex flex-wrap gap-2">
      {canClose && (
        <Button
          size="sm"
          className="gap-1.5"
          disabled={busy}
          onClick={() =>
            run(
              async () => {
                const r = await adminCloseJob(jobId);
                if (!r.ok) return r;
                return resolveReport(id, "resolved", "Job বন্ধ করা হয়েছে");
              },
              "Job বন্ধ হয়েছে, connect ফেরত গেছে",
              "Job বন্ধ করবে? সবার (আবেদনকারী ও hired) connect ফেরত যাবে।"
            )
          }
        >
          <IconBan className="h-4 w-4" /> Job বন্ধ করো
        </Button>
      )}
      <Button
        size="sm"
        variant="outline"
        disabled={busy}
        onClick={() => run(() => resolveReport(id, "resolved"), "Report resolved হয়েছে")}
      >
        Resolved
      </Button>
      <Button
        size="sm"
        variant="outline"
        disabled={busy}
        onClick={() => run(() => resolveReport(id, "dismissed"), "Report বাতিল করা হয়েছে")}
      >
        Dismiss
      </Button>
    </div>
  );
}