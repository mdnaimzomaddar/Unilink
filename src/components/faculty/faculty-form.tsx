"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { requestFaculty } from "@/app/actions/faculty";
import { Button } from "@/components/ui/button";
import { toast } from "react-toastify";


const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200";

export default function FacultyForm() {
  const router = useRouter();
  const [form, setForm] = useState({ designation: "", department: "", proof: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [k]: e.target.value });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await requestFaculty(form);
    setLoading(false);
    if (!res.ok) return toast.error(res.error);
    toast.success("Request জমা হয়েছে, admin যাচাই করবেন");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border bg-white p-6 shadow-sm">
      <input className={inputClass} required value={form.designation} onChange={update("designation")}
        placeholder="পদবি (যেমন: Lecturer, Assistant Professor)" />
      <input className={inputClass} required value={form.department} onChange={update("department")}
        placeholder="বিভাগ (যেমন: CSE)" />
      <div className="space-y-1">
        <input className={inputClass} required value={form.proof} onChange={update("proof")}
          placeholder="প্রমাণ: university-র official profile link বা staff ID" />
        <p className="text-xs text-slate-500">
          Admin এই তথ্য দেখে যাচাই করবেন। শুধু university-র official পেজের link বা ID দাও।
        </p>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "পাঠানো হচ্ছে..." : "যাচাইয়ের জন্য পাঠাও"}
      </Button>
    </form>
  );
}