"use client";
import { toast } from "react-toastify";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  addUniversity,
  setUniversityActive,
  updateUniversityDomains,
} from "@/app/actions/admin-university";
import { Button } from "@/components/ui/button";

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200";

export function AddUniversityForm() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", slug: "", domains: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [k]: e.target.value });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await addUniversity(form);
    setLoading(false);
    if (!res.ok) return toast.error(res.error);
    toast.success("University যোগ হয়েছে ✅");
    setForm({ name: "", slug: "", domains: "" });
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-2xl border bg-white p-5 shadow-sm">
      <h2 className="font-semibold">+ নতুন University</h2>
      <input className={inputClass} required value={form.name} onChange={update("name")}
        placeholder="নাম (যেমন: Bangladesh University of Engineering and Technology)" />
      <input className={inputClass} required value={form.slug} onChange={update("slug")}
        placeholder="slug (যেমন: buet), ভবিষ্যতে buet.unilink.com হবে" />
      <input className={inputClass} required value={form.domains} onChange={update("domains")}
        placeholder="Email domain, কমা দিয়ে (যেমন: buet.ac.bd, me.buet.ac.bd)" />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" disabled={loading}>
        {loading ? "যোগ হচ্ছে..." : "যোগ করো"}
      </Button>
    </form>
  );
}

export function UniversityRowActions({
  id,
  active,
  domains,
}: {
  id: string;
  active: boolean;
  domains: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function run(fn: () => Promise<{ ok: true } | { ok: false; error: string }>, success: string) {
    setBusy(true);
    const res = await fn();
    setBusy(false);
    if (!res.ok) return toast.error(res.error);
    toast.success(success);
    router.refresh();
  }

  return (
    <div className="space-y-1">
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" disabled={busy} onClick={() => run(() => setUniversityActive(id, !active),active ? "University বন্ধ করা হয়েছে" : "University চালু করা হয়েছে" )}>
          {active ? "বন্ধ করো" : "চালু করো"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={busy}
          onClick={() => {
            const next = prompt("নতুন domain তালিকা (কমা দিয়ে):", domains);
            if (next !== null) run(() => updateUniversityDomains(id, next), "Domain আপডেট হয়েছে");
          }}
        >
          Domain বদলাও
        </Button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}