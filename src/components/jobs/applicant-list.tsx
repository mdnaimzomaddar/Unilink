"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { hireApplicant } from "@/app/actions/application";
import { Button } from "@/components/ui/button";
import { Stars } from "@/components/stars";
import type { ApplicationDTO } from "@/lib/applications";
import { toast } from "react-toastify";

const statusStyle: Record<ApplicationDTO["status"], string> = {
  pending: "bg-slate-100 text-slate-700",
  hired: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-50 text-red-600",
};

export default function ApplicantList({
  applications,
  jobOpen,
  showContact,
}: {
  applications: ApplicationDTO[];
  jobOpen: boolean;
  showContact: boolean;
}) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

async function hire(id: string) {
  if (!confirm("এই ব্যক্তিকে hire করবে? বাকি সবার আবেদন reject হয়ে যাবে।")) return;
  setBusyId(id);
  const res = await hireApplicant(id);
  setBusyId(null);
  if (!res.ok) return toast.error(res.error);
  toast.success("Hire করা হয়েছে ");
  router.refresh();
}

  if (applications.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed bg-white p-8 text-center text-sm text-slate-500">
        এখনো কেউ apply করেনি।
      </div>
    );
  }

  return (
    <div className="space-y-3">
      
      {applications.map((a) => (
        <div key={a.id} className="space-y-3 rounded-2xl border bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-semibold">{a.applicantName}</p>
              {a.rating ? (
                <p className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Stars value={a.rating.avg} className="text-sm" />
                  {a.rating.avg} ({a.rating.count} review)
                </p>
              ) : (
                <p className="text-xs text-slate-400">এখনো কোনো review নেই</p>
              )}
            </div>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyle[a.status]}`}>
              {a.status}
            </span>
          </div>

          <p className="whitespace-pre-wrap text-sm text-slate-700">{a.coverNote}</p>

          {a.status === "pending" && jobOpen && (
            <Button size="sm" disabled={busyId === a.id} onClick={() => hire(a.id)}>
              {busyId === a.id ? "অপেক্ষা করো..." : "✅ Hire করো"}
            </Button>
          )}

          {a.status === "hired" && a.contact && showContact && (
            <div className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-900">
              <p className="mb-1 font-semibold">📞 যোগাযোগ</p>
              <p>Phone/WhatsApp: <b>{a.contact.phone}</b></p>
              <p>Email: <b>{a.contact.email}</b></p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}