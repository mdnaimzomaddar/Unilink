"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import type { IconType } from "react-icons";
import { createJob } from "@/app/actions/job";
import { Button } from "@/components/ui/button";
import { TypeBadge } from "@/components/jobs/job-card";
import { JobTypeIcon, ModeIcon } from "@/components/type-icons";
import { IconBulb, IconLock, IconMedal, IconWarning, IconZap } from "@/components/icons";
import {
  CATEGORIES, JOB_TYPES, JOB_TYPE_META, WORK_MODES, WORK_MODE_META,
  connectCost, type JobType, type WorkMode,
} from "@/lib/constants";

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200";

const TONES = {
  slate: "bg-slate-50 text-slate-600",
  amber: "bg-amber-50 text-amber-800",
  red: "bg-red-50 text-red-700",
};

function Hint({
  icon: Icon,
  tone = "slate",
  children,
}: {
  icon: IconType;
  tone?: keyof typeof TONES;
  children: React.ReactNode;
}) {
  return (
    <p className={`flex items-start gap-2 rounded-lg p-3 text-xs ${TONES[tone]}`}>
      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      <span>{children}</span>
    </p>
  );
}

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

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">{label}</label>
      {children}
    </div>
  );
}

export default function JobForm({
  canPostPremium,
  isVerified,
  silverCredits,
}: {
  canPostPremium: boolean;
  isVerified: boolean;
  silverCredits: number;
}) {
  const router = useRouter();
  const [type, setType] = useState<JobType>("silver");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [budget, setBudget] = useState("");
  const [skillsInput, setSkillsInput] = useState("");
  const [deadline, setDeadline] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<WorkMode>("online");
  const [contact, setContact] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const res = await createJob({
      title,
      description,
      type,
      category,
      budget: type === "silver" ? 0 : Number(budget) || 0,
      skills: skillsInput.split(",").map((s) => s.trim()).filter(Boolean),
      deadline: deadline || undefined,
      mode,
      contact,
    });

    setLoading(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success("Job post হয়েছে");
    router.push(`/jobs/${res.id}`);
  }

  const silverBlocked = type === "silver" && silverCredits <= 0;
  const applyCost = connectCost(type, category, Number(budget) || 0);
  const budgetText =
    type === "silver" ? "ফ্রি" : budget ? `৳${Number(budget).toLocaleString("en-US")}` : "—";

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[1fr_21rem]">
      <div className="min-w-0 space-y-6">
        {/* ১. ধরন */}
        <Section step={1} title="কাজের ধরন" hint="টাকার লেনদেন আছে কিনা, তার উপর ধরন ঠিক করো">
          <div className="grid gap-3 sm:grid-cols-3">
            {JOB_TYPES.map((t) => {
              const meta = JOB_TYPE_META[t];
              const locked = t === "premium" && !canPostPremium;
              const active = type === t;
              return (
                <button
                  key={t}
                  type="button"
                  disabled={locked}
                  onClick={() => setType(t)}
                  className={`rounded-xl border p-4 text-left transition ${
                    active
                      ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200"
                      : "border-slate-200 hover:border-slate-300"
                  } ${locked ? "cursor-not-allowed opacity-50" : ""}`}
                >
                  <div className="flex items-center gap-1.5 font-semibold">
                    <JobTypeIcon type={t} className="h-4 w-4" /> {meta.label}
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {locked ? "শুধু approved faculty" : meta.desc}
                  </p>
                </button>
              );
            })}
          </div>

          {type === "silver" && (
            <Hint icon={IconMedal} tone={silverCredits > 0 ? "slate" : "red"}>
              Silver post বাকি: <b>{silverCredits}</b>
              {silverCredits === 0 && (
                <>
                  {" "}
                  —{" "}
                  <Link href="/connects/buy" className="font-medium underline">
                    ৫ connect কিনলে ১টা Silver post পাবে
                  </Link>
                  , অথবা টাকা দিয়ে কাজ করাতে <b>Golden</b> বাছো।
                </>
              )}
            </Hint>
          )}
        </Section>

        {/* ২. বিবরণ */}
        <Section step={2} title="কাজের বিবরণ" hint="যত স্পষ্ট লিখবে, তত ভালো আবেদন পাবে">
          <Field label="Title">
            <input
              className={inputClass}
              required
              maxLength={100}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="যেমন: ক্লাব পেজের জন্য একটা লোগো ডিজাইন"
            />
          </Field>
          <Field label="বিস্তারিত বিবরণ">
            <textarea
              className={inputClass}
              rows={7}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="কাজটা কী, কী কী লাগবে, কতদিনে লাগবে..."
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Category">
              <select className={inputClass} value={category} onChange={(e) => setCategory(e.target.value)}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Skills (কমা দিয়ে লেখো)">
              <input
                className={inputClass}
                value={skillsInput}
                onChange={(e) => setSkillsInput(e.target.value)}
                placeholder="Figma, Photoshop, Logo Design"
              />
            </Field>
          </div>
        </Section>

        {/* ৩. বাজেট ও সময় */}
        <Section step={3} title="বাজেট ও সময়">
          <div className="grid gap-4 sm:grid-cols-2">
            {type !== "silver" ? (
              <Field label={`Budget (৳)${type === "golden" ? "" : " — ঐচ্ছিক"}`}>
                <input
                  className={inputClass}
                  type="number"
                  min={0}
                  value={budget}
                  required={type === "golden"}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder="যেমন: 1500"
                />
              </Field>
            ) : (
              <div className="flex items-center rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                Silver job ফ্রি, তাই budget দিতে হবে না
              </div>
            )}
            <Field label="Deadline (ঐচ্ছিক)">
              <input
                className={inputClass}
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </Field>
          </div>
        </Section>

        {/* ৪. মোড ও যোগাযোগ */}
        <Section step={4} title="কীভাবে কাজ হবে">
          <div className="grid gap-3 sm:grid-cols-3">
            {WORK_MODES.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`rounded-xl border p-4 text-left text-sm transition ${
                  mode === m
                    ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center gap-1.5 font-semibold">
                  <ModeIcon mode={m} className="h-4 w-4" /> {WORK_MODE_META[m].label}
                </div>
                <p className="mt-1 text-xs text-slate-500">{WORK_MODE_META[m].desc}</p>
              </button>
            ))}
          </div>

          {mode !== "online" && !isVerified && (
            <Hint icon={IconWarning} tone="amber">
              Offline/Both job post করতে আগে{" "}
              <Link href="/verify-university" className="font-medium underline">
                University verify
              </Link>{" "}
              করতে হবে।
            </Hint>
          )}

          <Field label={`তোমার Phone / WhatsApp${mode === "online" ? " (ঐচ্ছিক)" : ""}`}>
            <input
              className={inputClass}
              required={mode !== "online"}
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="01XXXXXXXXX"
            />
            <p className="flex items-start gap-1.5 pt-1 text-xs text-slate-500">
              <IconLock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              সবার সামনে দেখানো হবে না। Online job-এ chat-ই যথেষ্ট, Offline হলে hire-এর পর শুধু selected জন দেখবে।
            </p>
          </Field>
        </Section>
      </div>

      {/* ডানের লাইভ সারসংক্ষেপ */}
      <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        <div className="space-y-5 rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="font-semibold">সারসংক্ষেপ</h2>

          <dl className="space-y-3.5 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-slate-500">ধরন</dt>
              <dd>
                <TypeBadge type={type} />
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-slate-500">Budget</dt>
              <dd className="font-semibold">{budgetText}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-slate-500">Apply খরচ</dt>
              <dd className="inline-flex items-center gap-1 font-medium">
                {applyCost === 0 ? (
                  "ফ্রি"
                ) : (
                  <>
                    <IconZap className="h-4 w-4 text-amber-600" /> {applyCost} connect
                  </>
                )}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-slate-500">কীভাবে</dt>
              <dd className="inline-flex items-center gap-1.5 font-medium">
                <ModeIcon mode={mode} className="h-4 w-4" /> {WORK_MODE_META[mode].label}
              </dd>
            </div>
            {type === "silver" && (
              <div className="flex items-center justify-between border-t pt-3.5">
                <dt className="text-slate-500">Silver post বাকি</dt>
                <dd className="inline-flex items-center gap-1 font-medium">
                  <IconMedal className="h-4 w-4" /> {silverCredits} → {Math.max(0, silverCredits - 1)}
                </dd>
              </div>
            )}
          </dl>

          <Button type="submit" className="w-full" disabled={loading || silverBlocked}>
            {loading ? "Post হচ্ছে..." : "Job post করো"}
          </Button>
        </div>

        <Hint icon={IconBulb}>
          টাকা দিয়ে কাজ করাতে চাইলে <b>Golden</b> বাছো। কোনো টাকা-পয়সা না থাকলে <b>Silver</b>। স্পষ্ট বিবরণ ও ঠিক budget দিলে ভালো আবেদনকারী পাবে।
        </Hint>

        {type !== "silver" && (
          <Hint icon={IconZap} tone="amber">
            প্রত্যেক আবেদনকারীর <b>{applyCost} connect</b> খরচ হবে। Job কাউকে না নিয়ে বন্ধ করলে তারা ফেরত পাবে।
          </Hint>
        )}
      </aside>
    </form>
  );
}