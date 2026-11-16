"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { startStudentVerification } from "@/app/actions/student-verification";
import { Button } from "@/components/ui/button";
import { IconCamera, IconCheck, IconLock } from "@/components/icons";
import UniversityPicker, { type PickerUni } from "@/components/university/university-picker";

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200";

async function compressImage(file: File, maxSide = 1400, quality = 0.78): Promise<Blob> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bmp.width, bmp.height));
  const w = Math.round(bmp.width * scale);
  const h = Math.round(bmp.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");
  ctx.drawImage(bmp, 0, 0, w, h);
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("compress"))), "image/jpeg", quality)
  );
}

export default function StudentCardForm({
  universities,
  supportEmail,
}: {
  universities: PickerUni[];
  supportEmail: string;
}) {
  const router = useRouter();
  const [uni, setUni] = useState("");
  const [department, setDepartment] = useState("");
  const [studentId, setStudentId] = useState("");
  const [draft, setDraft] = useState<{ id: string; code: string } | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview]
  );

  if (universities.length === 0) {
    return (
      <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
        এখনো কোনো university যোগ করা হয়নি। Admin যোগ করলে এখানে বেছে নিতে পারবে।
      </p>
    );
  }

  async function start(e: React.FormEvent) {
    e.preventDefault();
    if (!uni) {
      toast.error("University বেছে নাও");
      return;
    }
    setBusy(true);
    const res = await startStudentVerification({ university: uni, department, studentId });
    setBusy(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    setDraft({ id: res.id, code: res.code });
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      toast.error("শুধু ছবি (JPG/PNG) দাও");
      return;
    }
    setBusy(true);
    try {
      const b = await compressImage(f);
      setBlob(b);
      setPreview(URL.createObjectURL(b));
    } catch {
      toast.error("ছবিটা পড়া যায়নি, অন্য একটা চেষ্টা করো");
    } finally {
      setBusy(false);
    }
  }

  async function submit() {
    if (!draft || !blob) return;
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("id", draft.id);
      fd.append("image", blob, "card.jpg");
      const res = await fetch("/api/verification/student", { method: "POST", body: fd });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!data.ok) {
        toast.error(data.error ?? "জমা দেওয়া যায়নি");
        return;
      }
      toast.success("ছবি জমা হয়েছে। Admin যাচাই করলে জানতে পারবে");
      router.refresh();
    } catch {
      toast.error("নেটওয়ার্ক সমস্যা, আবার চেষ্টা করো");
    } finally {
      setBusy(false);
    }
  }

  const stepBadge = (n: number, active: boolean) => (
    <span
      className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
        active ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-400"
      }`}
    >
      {n}
    </span>
  );

  return (
    <div className="space-y-6 rounded-2xl border bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3 text-sm">
        {stepBadge(1, !draft)} <span className={draft ? "text-slate-400" : "font-medium"}>তথ্য</span>
        <span className="h-px flex-1 bg-slate-200" />
        {stepBadge(2, !!draft)} <span className={draft ? "font-medium" : "text-slate-400"}>Card-এর ছবি</span>
      </div>

      {!draft ? (
        <form onSubmit={start} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">University</label>
            <UniversityPicker
              universities={universities}
              value={uni}
              onChange={setUni}
              supportEmail={supportEmail}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">বিভাগ</label>
              <input
                className={inputClass}
                required
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="যেমন: CSE"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Student ID</label>
              <input
                className={inputClass}
                required
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="Card-এ যেভাবে লেখা"
              />
            </div>
          </div>
          <p className="flex items-start gap-2 text-xs text-slate-500">
            <IconLock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>
              Card-এর ছবি শুধু যাচাইয়ের জন্য, শুধু admin দেখেন, আর সিদ্ধান্তের পরেই মুছে যায়।{" "}
              <Link href="/privacy" className="underline">
                গোপনীয়তা নীতি
              </Link>
            </span>
          </p>
          <Button type="submit" className="w-full" disabled={busy || !uni}>
            {busy ? "অপেক্ষা করো..." : "পরের ধাপ: ছবি তোলো"}
          </Button>
        </form>
      ) : (
        <div className="space-y-5">
          <div className="rounded-xl bg-indigo-50 p-5 text-center">
            <p className="text-sm text-slate-600">এই কোডটা একটা কাগজে লিখো</p>
            <p className="mt-1 select-all font-mono text-4xl font-bold tracking-widest text-indigo-700">
              {draft.code}
            </p>
          </div>

          <ul className="space-y-2 text-sm text-slate-600">
            {[
              "Card ও কাগজটা পাশাপাশি রেখে একটাই ছবিতে তোলো",
              "নাম, ছবি ও Student ID পরিষ্কার পড়া যেতে হবে",
              "আলোর ঝলক বা আঙুলে ঢাকা পড়া এড়াও",
              "কাগজের কোড ও উপরের কোড হুবহু এক হতে হবে",
            ].map((t) => (
              <li key={t} className="flex items-start gap-2">
                <IconCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> {t}
              </li>
            ))}
          </ul>

          <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed p-6 text-center text-sm text-slate-500 transition hover:bg-slate-50">
            <IconCamera className="h-6 w-6" />
            {blob ? "অন্য ছবি বেছে নাও" : "ছবি তোলো বা গ্যালারি থেকে বেছে নাও"}
            <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={onFile} />
          </label>

          {preview && (
            <div className="space-y-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview}
                alt="যাচাইয়ের ছবির প্রিভিউ"
                className="max-h-80 w-full rounded-xl bg-slate-100 object-contain"
              />
              {blob && (
                <p className="text-xs text-slate-400">ছবির আকার: {Math.round(blob.size / 1024)} KB</p>
              )}
            </div>
          )}

          <div className="flex gap-2">
            <Button type="button" className="flex-1" disabled={!blob || busy} onClick={submit}>
              {busy ? "অপেক্ষা করো..." : "যাচাইয়ের জন্য পাঠাও"}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => {
                setDraft(null);
                setBlob(null);
                setPreview(null);
              }}
            >
              নতুন করে শুরু
            </Button>
          </div>
          <p className="text-xs text-slate-400">এই কোড ২ ঘণ্টা পর্যন্ত কাজ করবে।</p>
        </div>
      )}
    </div>
  );
}