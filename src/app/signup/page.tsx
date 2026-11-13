"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { signUp } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import AuthShell from "@/components/auth/auth-shell";
import SocialButtons from "@/components/auth/social-buttons";

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [k]: e.target.value });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password.length < 8) {
      toast.error("Password কমপক্ষে ৮ অক্ষরের হতে হবে");
      return;
    }
    setLoading(true);
    const { error } = await signUp.email({
      name: form.name,
      email: form.email,
      password: form.password,
    });
    setLoading(false);

    if (error) {
      toast.error(error.message || "Signup করা যায়নি, আবার চেষ্টা করো");
      return;
    }
    router.push("/dashboard?flash=signup");
    router.refresh();
  }

  return (
    <AuthShell
      title="Unilink-এ যোগ দাও"
      subtitle="কাজ খোঁজো, কাজ দাও, কমিউনিটির অংশ হও"
      footer={
        <>
          আগে থেকেই account আছে?{" "}
          <Link href="/login" className="font-medium text-indigo-600 hover:underline">
            Login করো
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">পুরো নাম</label>
          <input className={inputClass} required value={form.name} onChange={update("name")}
            placeholder="তোমার নাম" />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Email</label>
          <input className={inputClass} type="email" required value={form.email}
            onChange={update("email")} placeholder="you@example.com" />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Password</label>
          <input className={inputClass} type="password" required value={form.password}
            onChange={update("password")} placeholder="কমপক্ষে ৮ অক্ষর" />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "অপেক্ষা করো..." : "Account খোলো"}
        </Button>
      </form>

      <div className="my-6 flex items-center gap-3 text-xs text-slate-400">
        <div className="h-px flex-1 bg-slate-200" /> অথবা <div className="h-px flex-1 bg-slate-200" />
      </div>

      <SocialButtons />
    </AuthShell>
  );
}