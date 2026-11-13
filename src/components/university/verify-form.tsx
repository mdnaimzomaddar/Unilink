"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { sendUniversityCode, verifyUniversityCode } from "@/app/actions/university";
import { Button } from "@/components/ui/button";
import { toast } from "react-toastify";

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200";

export default function VerifyForm({ universities }: { universities: string[] }) {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [verifiedName, setVerifiedName] = useState("");

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  async function send(e?: React.FormEvent) {
    e?.preventDefault();
    setLoading(true);
    const res = await sendUniversityCode(email);
    setLoading(false);
    if (!res.ok) return toast.error(res.error);
    toast.success("কোড পাঠানো হয়েছে 📧");
    setStep("code");
    setCode("");
    setCooldown(60);
  }

    async function verify(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await verifyUniversityCode(code);
    setLoading(false);
    if (!res.ok) return toast.error(res.error);
    toast.success("Verify হয়েছে 🎉");
    setVerifiedName(res.universityName);
    router.refresh();
  }

  if (verifiedName) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center text-emerald-900">
        <p className="text-lg font-semibold">🎉 Verify হয়েছে!</p>
        <p className="text-sm">তুমি এখন {verifiedName}-এর verified সদস্য।</p>
        <p className="mt-2 text-sm">
          🎁 বোনাস যোগ হয়েছে: মোট ১০ ফ্রি Silver post ও ১০ connect (Dashboard → Connects-এ দেখো)।
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-2xl border bg-white p-6 shadow-sm">
      {step === "email" ? (
        <form onSubmit={send} className="space-y-3">
          <label className="text-sm font-medium">তোমার University email</label>
          <input
            className={inputClass}
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@student.university.ac.bd"
          />
          <p className="text-xs text-slate-500">
            Login-এর email থেকে আলাদা হতে পারে। এই email-এ একটা ৬ সংখ্যার কোড যাবে।
          </p>
          <p className="text-xs text-emerald-700">
            🎁 Verify করলে মোট ১০টা ফ্রি Silver post ও ১০ connect পাবে।
          </p>
          {universities.length > 0 && (
            <p className="text-xs text-slate-500">সমর্থিত university: {universities.join(", ")}</p>
          )}
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "পাঠানো হচ্ছে..." : "কোড পাঠাও"}
          </Button>
          <button
            type="button"
            onClick={() => setStep("code")}
            className="w-full text-center text-sm text-slate-500 underline"
          >
            আমার কাছে কোড আছে
          </button>
        </form>
      ) : (
        <form onSubmit={verify} className="space-y-3">
          <label className="text-sm font-medium">৬ সংখ্যার কোড</label>
          <input
            className={`${inputClass} text-center text-xl tracking-[0.5em]`}
            inputMode="numeric"
            maxLength={6}
            required
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            placeholder="••••••"
          />
          <p className="text-xs text-slate-500">
            কোড ১০ মিনিট কাজ করবে। Inbox-এ না পেলে Spam ফোল্ডার দেখো।
          </p>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading || code.length !== 6}>
            {loading ? "যাচাই হচ্ছে..." : "Verify করো"}
          </Button>
          <div className="flex items-center justify-between text-sm">
            <button
              type="button"
              onClick={() => { setStep("email"); setError(""); }}
              className="text-slate-500 underline"
            >
              ← email বদলাও
            </button>
            <button
              type="button"
              disabled={cooldown > 0 || loading || !email}
              onClick={() => send()}
              className="text-indigo-600 underline disabled:text-slate-400 disabled:no-underline"
            >
              {cooldown > 0 ? `আবার পাঠাও (${cooldown}s)` : "আবার পাঠাও"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}