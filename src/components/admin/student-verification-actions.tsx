"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { decideStudentVerification } from "@/app/actions/student-verification";
import { Button } from "@/components/ui/button";
import { IconCheck, IconCross } from "@/components/icons";

export default function StudentVerificationActions({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function run(decision: "approve" | "reject") {
    let note = "";
    if (decision === "reject") {
      note = (prompt("Reject-এর কারণ (user দেখতে পাবে):") ?? "").trim();
      if (!note) {
        toast.info("কারণ লিখতে হবে");
        return;
      }
    } else if (
      !confirm("Card-এর নাম, Student ID ও ছবির কোড মিলিয়েছ? Approve করলে user verified হবে ও বোনাস পাবে।")
    ) {
      return;
    }

    setBusy(true);
    const res = await decideStudentVerification(id, decision, note);
    setBusy(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success(decision === "approve" ? "Verify করা হয়েছে" : "আবেদন reject করা হয়েছে");
    router.refresh();
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button size="sm" className="gap-1.5" disabled={busy} onClick={() => run("approve")}>
        <IconCheck className="h-4 w-4" /> Approve
      </Button>
      <Button size="sm" variant="outline" className="gap-1.5" disabled={busy} onClick={() => run("reject")}>
        <IconCross className="h-4 w-4" /> Reject
      </Button>
    </div>
  );
}