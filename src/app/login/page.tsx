"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { signIn } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import AuthShell from "@/components/auth/auth-shell";
import SocialButtons from "@/components/auth/social-buttons";

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn.email({ email, password });
    setLoading(false);

    if (error) {
      toast.error(error.message || "Login করা যায়নি, email ও password ঠিক আছে কিনা দেখো");
      return;
    }
    router.push("/dashboard?flash=login");
    router.refresh();
  }

  return (
    <AuthShell
      title="আবার স্বাগতম"
      subtitle="Unilink-এ login করো"
      footer={
        <>
          নতুন?{" "}
          <Link href="/signup" className="font-medium text-indigo-600 hover:underline">
            Account খোলো
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Email</label>
          <input className={inputClass} type="email" required value={email}
            onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Password</label>
          <input className={inputClass} type="password" required value={password}
            onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "অপেক্ষা করো..." : "Login"}
        </Button>
      </form>

      <div className="my-6 flex items-center gap-3 text-xs text-slate-400">
        <div className="h-px flex-1 bg-slate-200" /> অথবা <div className="h-px flex-1 bg-slate-200" />
      </div>

      <SocialButtons />
    </AuthShell>
  );
}