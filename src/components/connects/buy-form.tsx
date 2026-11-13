"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { createPurchaseRequest } from "@/app/actions/purchase";
import { Button } from "@/components/ui/button";
import { IconCheck, IconCopy, IconMedal, IconShield, IconZap } from "@/components/icons";
import {
  CONNECTS_PER_SILVER_CREDIT,
  CONNECT_PACKS,
  PAYMENT_METHOD_LABEL,
  type PaymentMethod,
} from "@/lib/constants";

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200";

function Section({
  step,
  title,
  hint,
  children,
}: {
  step: number;
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-5 rounded-2xl border bg-white p-6 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-sm font-semibold text-indigo-700">
          {step}
        </span>
        <div>
          <h2 className="font-semibold">{title}</h2>
          {hint && <p className="text-sm text-slate-500">{hint}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

export default function BuyForm({ numbers }: { numbers: Partial<Record<PaymentMethod, string>> }) {
  const router = useRouter();
  const methods = (Object.keys(numbers) as PaymentMethod[]).filter((m) => numbers[m]);

  const [packId, setPackId] = useState<string>(CONNECT_PACKS[1].id);
  const [method, setMethod] = useState<PaymentMethod>(methods[0] ?? "bkash");
  const [senderNumber, setSenderNumber] = useState("");
  const [trxId, setTrxId] = useState("");
  const [loading, setLoading] = useState(false);

  const pack = CONNECT_PACKS.find((p) => p.id === packId) ?? CONNECT_PACKS[0];
  const silverGain = Math.floor(pack.connects / CONNECTS_PER_SILVER_CREDIT);
  const bestId = [...CONNECT_PACKS].sort((a, b) => a.price / a.connects - b.price / b.connects)[0].id;

  if (methods.length === 0) {
    return (
      <p className="rounded-2xl border bg-white p-6 text-sm text-slate-600 shadow-sm">
        এখন payment নম্বর সেট করা নেই। পরে আবার চেষ্টা করো।
      </p>
    );
  }

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("নম্বর কপি হয়েছে");
    } catch {
      toast.error("কপি করা যায়নি, হাতে লিখে নাও");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await createPurchaseRequest({ packId, method, senderNumber, trxId });
    setLoading(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success("Request জমা হয়েছে, admin যাচাই করবেন");
    setTrxId("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[1fr_21rem]">
      <div className="min-w-0 space-y-6">
        {/* ১. Pack */}
        <Section step={1} title="Pack বেছে নাও" hint="বড় pack-এ প্রতি connect সস্তা পড়ে">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {CONNECT_PACKS.map((p) => {
              const active = p.id === packId;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPackId(p.id)}
                  className={`relative rounded-xl border p-4 text-left transition ${
                    active
                      ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  {p.id === bestId && (
                    <span className="absolute -top-2.5 right-3 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-semibold text-white">
                      সেরা মূল্য
                    </span>
                  )}
                  <div className="flex items-center gap-1.5 font-semibold">
                    <IconZap className="h-4 w-4 text-amber-600" /> {p.connects} connect
                  </div>
                  <p className="mt-2 text-2xl font-bold tracking-tight">৳{p.price}</p>
                  <p className="text-xs text-slate-400">৳{(p.price / p.connects).toFixed(1)} / connect</p>
                  <p className="mt-2 flex items-center gap-1 text-xs text-slate-500">
                    <IconMedal className="h-3 w-3" /> +{Math.floor(p.connects / CONNECTS_PER_SILVER_CREDIT)} Silver
                    post
                  </p>
                </button>
              );
            })}
          </div>
        </Section>

        {/* ২. টাকা পাঠানো */}
        <Section step={2} title="টাকা পাঠাও" hint="নিচের নম্বরে Send Money করো">
          <div className="grid gap-3 sm:grid-cols-2">
            {methods.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMethod(m)}
                className={`rounded-xl border p-4 text-left transition ${
                  method === m
                    ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{PAYMENT_METHOD_LABEL[m]}</span>
                  {method === m && <IconCheck className="h-4 w-4 text-indigo-600" />}
                </div>
                <p className="mt-1 select-all text-lg font-bold tracking-wide">{numbers[m]}</p>
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
            <p>
              <b>{PAYMENT_METHOD_LABEL[method]}</b>-এ <b>Send Money</b> করো, ঠিক <b>৳{pack.price}</b>
            </p>
            <button
              type="button"
              onClick={() => copy(numbers[method] ?? "")}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-medium text-amber-900 hover:bg-amber-100"
            >
              <IconCopy className="h-3.5 w-3.5" /> নম্বর কপি
            </button>
          </div>

          <p className="flex items-start gap-2 text-xs text-slate-500">
            <IconShield className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            কারো সাথে তোমার bKash/Nagad PIN বা OTP শেয়ার করবে না। আমরা কখনো ওগুলো চাই না।
          </p>
        </Section>

        {/* ৩. TrxID */}
        <Section step={3} title="Transaction ID জমা দাও" hint="টাকা পাঠানোর পর যে মেসেজ পাবে সেখান থেকে">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">যে নম্বর থেকে পাঠিয়েছ</label>
              <input
                className={inputClass}
                required
                value={senderNumber}
                onChange={(e) => setSenderNumber(e.target.value)}
                placeholder="01XXXXXXXXX"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Transaction ID</label>
              <input
                className={`${inputClass} uppercase`}
                required
                maxLength={14}
                value={trxId}
                onChange={(e) => setTrxId(e.target.value)}
                placeholder="যেমন 8N7A6D5EFG"
              />
            </div>
          </div>
        </Section>
      </div>

      {/* ডানের সারসংক্ষেপ */}
      <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        <div className="space-y-5 rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="font-semibold">সারসংক্ষেপ</h2>
          <dl className="space-y-3.5 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-slate-500">Connect</dt>
              <dd className="inline-flex items-center gap-1 font-semibold">
                <IconZap className="h-4 w-4 text-amber-600" /> {pack.connects}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-slate-500">Silver post</dt>
              <dd className="inline-flex items-center gap-1 font-semibold">
                <IconMedal className="h-4 w-4" /> +{silverGain}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-slate-500">Payment</dt>
              <dd className="font-medium">{PAYMENT_METHOD_LABEL[method]}</dd>
            </div>
            <div className="flex items-center justify-between border-t pt-3.5">
              <dt className="font-medium">মোট</dt>
              <dd className="text-2xl font-bold tracking-tight">৳{pack.price}</dd>
            </div>
          </dl>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "জমা হচ্ছে..." : `৳${pack.price} পাঠিয়েছি, জমা দাও`}
          </Button>
          <p className="text-xs text-slate-500">
            Admin টাকা এসেছে কিনা মিলিয়ে দেখে connect যোগ করবেন। সাধারণত কয়েক ঘণ্টা লাগে।
          </p>
        </div>
      </aside>
    </form>
  );
}