"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import {
  addUniversity,
  seedBangladeshUniversities,
  setUniversityActive,
  updateUniversityDomains,
} from "@/app/actions/admin-university";
import { Button } from "@/components/ui/button";
import { IconUniversity } from "@/components/icons";

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200";

export function SeedUniversitiesButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function run() {
    if (!confirm("বাংলাদেশের সরকারি-বেসরকারি university-র তালিকা ঢোকাবে? যা আছে তা বদলাবে না।")) return;
    setBusy(true);
    const res = await seedBangladeshUniversities();
    setBusy(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success(`${res.added}টা নতুন যোগ হয়েছে, ${res.existing}টা আগেই ছিল`);
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-white p-5 shadow-sm">
      <div className="space-y-1">
        <p className="flex items-center gap-2 font-semibold">
          <IconUniversity className="h-4 w-4" /> বাংলাদেশের university তালিকা
        </p>
        <p className="text-sm text-slate-500">
          সরকারি ও বেসরকারি মিলিয়ে ৭০+। যোগ করার পর Student ID ফর্মে খুঁজে বেছে নেওয়া যাবে।
        </p>
      </div>
      <Button onClick={run} disabled={busy}>
        {busy ? "ঢোকানো হচ্ছে..." : "তালিকা ঢোকাও"}
      </Button>
    </div>
  );
}

export function AddUniversityForm() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", shortName: "", type: "private", slug: "", domains: "" });
  const [loading, setLoading] = useState(false);

  const update =
    (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm({ ...form, [k]: e.target.value });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await addUniversity(form);
    setLoading(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success("University যোগ হয়েছে");
    setForm({ name: "", shortName: "", type: "private", slug: "", domains: "" });
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-2xl border bg-white p-5 shadow-sm">
      <h2 className="font-semibold">+ তালিকার বাইরের university যোগ করো</h2>
      <input className={inputClass} required value={form.name} onChange={update("name")}
        placeholder="পুরো নাম (যেমন: Bangladesh University of Engineering and Technology)" />
      <div className="grid gap-3 sm:grid-cols-3">
        <input className={inputClass} value={form.shortName} onChange={update("shortName")}
          placeholder="সংক্ষিপ্ত নাম (BUET)" />
        <select className={inputClass} value={form.type} onChange={update("type")}>
          <option value="public">সরকারি</option>
          <option value="private">বেসরকারি</option>
          <option value="other">অন্যান্য</option>
        </select>
        <input className={inputClass} required value={form.slug} onChange={update("slug")}
          placeholder="slug (buet)" />
      </div>
      <input className={inputClass} value={form.domains} onChange={update("domains")}
        placeholder="Email domain, কমা দিয়ে (ঐচ্ছিক, নিশ্চিত না হলে খালি রাখো)" />
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

  async function run(fn: () => Promise<{ ok: true } | { ok: false; error: string }>, success: string) {
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

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        size="sm"
        variant="outline"
        disabled={busy}
        onClick={() => run(() => setUniversityActive(id, !active), active ? "বন্ধ করা হয়েছে" : "চালু করা হয়েছে")}
      >
        {active ? "বন্ধ করো" : "চালু করো"}
      </Button>
      <Button
        size="sm"
        variant="outline"
        disabled={busy}
        onClick={() => {
          const next = prompt("Email domain তালিকা (কমা দিয়ে, খালি রাখলে শুধু Student ID চলবে):", domains);
          if (next !== null) run(() => updateUniversityDomains(id, next), "Domain বদলানো হয়েছে");
        }}
      >
        Domain বদলাও
      </Button>
    </div>
  );
}