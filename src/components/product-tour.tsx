"use client";

import type { IconType } from "react-icons";
import {
  IconBack,
  IconCheck,
  IconChat,
  IconLock,
  IconMedal,
  IconNext,
  IconPause,
  IconPlay,
  IconSend,
  IconStar,
  IconUniversity,
  IconVideo,
  IconZap,
  IconEdit,
  IconUsers,
} from "@/components/icons";
import { JobTypeIcon } from "@/components/type-icons";
import { useEffect, useState, useSyncExternalStore } from "react";

const DURATION = 5000;

function useReducedMotion() {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false
  );
}

const style = (delay: number, extra: Record<string, string | number> = {}) =>
  ({ animationDelay: `${delay}s`, ...extra }) as React.CSSProperties;

/* ───────── ছোট অংশ ───────── */

function Typed({ text, delay, dur = 1 }: { text: string; delay: number; dur?: number }) {
  return (
    <span
      className="tour-type"
      style={style(delay, { "--n": Array.from(text).length, "--d": `${dur}s` })}
    >
      {text}
    </span>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] font-medium text-slate-500 sm:text-xs">{label}</p>
      <div className="flex h-8 items-center rounded-md border bg-white px-2.5 text-[11px] sm:h-9 sm:text-sm">
        {children}
      </div>
    </div>
  );
}

function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`mx-auto w-full max-w-sm space-y-3 rounded-xl border bg-white p-4 shadow-lg sm:p-5 ${className}`}
    >
      {children}
    </div>
  );
}

function Cta({ children, delay }: { children: React.ReactNode; delay: number }) {
  return (
    <div className="tour-up" style={style(delay - 0.3)}>
      <div
        className="tour-press flex h-8 items-center justify-center rounded-md bg-indigo-600 text-[11px] font-medium text-white sm:h-9 sm:text-sm"
        style={style(delay)}
      >
        {children}
      </div>
    </div>
  );
}

function Toast({
  children,
  delay,
  bottom = false,
}: {
  children: React.ReactNode;
  delay: number;
  bottom?: boolean;
}) {
  return (
    <div
      className={`tour-pop absolute right-3 flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-[11px] font-medium text-white shadow-lg sm:text-xs ${
        bottom ? "bottom-3" : "top-3"
      }`}
      style={style(delay)}
    >
      <IconCheck className="h-3.5 w-3.5" /> {children}
    </div>
  );
}

function Bubble({ children, delay, me = false }: { children: React.ReactNode; delay: number; me?: boolean }) {
  return (
    <div className={`tour-pop flex ${me ? "justify-end" : "justify-start"}`} style={style(delay)}>
      <div
        className={`max-w-[75%] rounded-2xl px-3 py-1.5 text-[11px] sm:text-sm ${
          me ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-800"
        }`}
      >
        {children}
      </div>
    </div>
  );
}

/* ───────── ছয়টা দৃশ্য ───────── */

function SceneSignup() {
  return (
    <>
      <Panel>
        <p className="text-sm font-bold sm:text-base">Unilink-এ যোগ দাও</p>
        <Field label="পুরো নাম">
          <Typed text="রহিম উদ্দিন" delay={0.3} dur={0.9} />
        </Field>
        <Field label="Email">
          <Typed text="rahim@gmail.com" delay={1.3} dur={1.1} />
        </Field>
        <Field label="Password">
          <Typed text="••••••••" delay={2.5} dur={0.6} />
        </Field>
        <Cta delay={3.4}>Account খোলো</Cta>
      </Panel>
      <Toast delay={3.9}>Account তৈরি হয়েছে</Toast>
    </>
  );
}

const CODE = ["4", "8", "2", "9", "1", "7"];

function SceneVerify() {
  return (
    <Panel>
      <p className="text-sm font-bold sm:text-base">University verify</p>
      <Field label="University email">
        <Typed text="rahim@student.ugv.edu.bd" delay={0.2} dur={1.2} />
      </Field>
      <div className="flex justify-between gap-1.5">
        {CODE.map((c, i) => (
          <span
            key={i}
            className="tour-pop flex h-8 w-8 items-center justify-center rounded-md border-2 border-indigo-500 text-sm font-bold sm:h-10 sm:w-10 sm:text-base"
            style={style(1.8 + i * 0.2)}
          >
            {c}
          </span>
        ))}
      </div>
      <div
        className="tour-pop flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-[11px] font-medium text-emerald-700 sm:text-sm"
        style={style(3.4)}
      >
        <IconUniversity className="h-4 w-4" /> University of Global Village
        <IconCheck className="ml-auto h-4 w-4" />
      </div>
      <div className="flex gap-2 text-[11px] sm:text-xs">
        <span
          className="tour-up inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 font-medium text-amber-700"
          style={style(3.9)}
        >
          <IconMedal className="h-3 w-3" /> +১০ Silver post
        </span>
        <span
          className="tour-up inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 font-medium text-amber-700"
          style={style(4.1)}
        >
          <IconZap className="h-3 w-3" /> +১০ connect
        </span>
      </div>
    </Panel>
  );
}

function SceneJob() {
  return (
    <>
      <Panel>
        <p className="text-sm font-bold sm:text-base">নতুন job post</p>
        <div className="grid grid-cols-3 gap-1.5 text-[10px] font-medium sm:text-xs">
          <span className="flex items-center justify-center gap-1 rounded-md border py-1.5 text-slate-500">
            <JobTypeIcon type="silver" className="h-3 w-3" /> Silver
          </span>
          <span
            className="tour-select flex items-center justify-center gap-1 rounded-md border py-1.5"
            style={style(0.5)}
          >
            <JobTypeIcon type="golden" className="h-3 w-3" /> Golden
          </span>
          <span className="flex items-center justify-center gap-1 rounded-md border py-1.5 text-slate-500">
            <JobTypeIcon type="premium" className="h-3 w-3" /> Premium
          </span>
        </div>
        <Field label="Title">
          <Typed text="Data Structures-এর tutoring" delay={1.2} dur={1.3} />
        </Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Budget">
            <Typed text="৳৫০০" delay={2.6} dur={0.5} />
          </Field>
          <Field label="কীভাবে">
            <span className="tour-up inline-flex items-center gap-1" style={style(3.1)}>
              <IconVideo className="h-3 w-3" /> Online
            </span>
          </Field>
        </div>
        <Cta delay={3.6}>Job post করো</Cta>
      </Panel>
      <Toast delay={4.1}>Job post হয়েছে</Toast>
    </>
  );
}

function SceneApply() {
  return (
    <>
      <div className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full border bg-white px-2.5 py-1 text-[11px] font-medium shadow sm:text-xs">
        <IconZap className="h-3.5 w-3.5 text-amber-600" />
        <span className="relative inline-block w-4 text-center">
          <span className="tour-out absolute inset-0" style={style(2.6)}>
            ১০
          </span>
          <span className="tour-up absolute inset-0" style={style(2.8)}>
            ৭
          </span>
        </span>
      </div>
      <Panel className="mt-6">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-800 sm:text-xs">
            <JobTypeIcon type="golden" className="h-3 w-3" /> Golden
          </span>
          <span className="text-sm font-bold">৳৫০০</span>
        </div>
        <p className="text-sm font-semibold sm:text-base">Data Structures-এর tutoring</p>
        <Field label="Cover note">
          <Typed text="আমি এটা সহজভাবে বুঝিয়ে দিতে পারব" delay={0.4} dur={1.6} />
        </Field>
        <p
          className="tour-up flex items-center gap-1 text-[11px] text-amber-700 sm:text-xs"
          style={style(2.0)}
        >
          <IconZap className="h-3 w-3" /> এই আবেদনে ৩ connect খরচ
        </p>
        <Cta delay={2.5}>আবেদন পাঠাও</Cta>
      </Panel>
      <Toast delay={3.2} bottom>
        আবেদন পাঠানো হয়েছে
      </Toast>
    </>
  );
}

function SceneChat() {
  return (
    <Panel className="space-y-2">
      <div className="flex items-center gap-2 border-b pb-2 text-[11px] font-semibold sm:text-sm">
        <IconChat className="h-4 w-4" /> সুমি আক্তার-এর সাথে chat
      </div>
      <Bubble delay={0.4}>হ্যালো! কখন বসা যাবে?</Bubble>
      <Bubble me delay={1.4}>
        আজ রাত ৮টায়
      </Bubble>
      <Bubble delay={2.4}>ঠিক আছে, Meet link দিচ্ছি</Bubble>
      <div
        className="tour-pop flex items-center gap-2 rounded-xl bg-emerald-50 p-2 text-[11px] text-emerald-800 sm:text-xs"
        style={style(3.4)}
      >
        <IconVideo className="h-4 w-4" />
        <span className="font-medium">Google Meet link</span>
        <span className="ml-auto rounded-md bg-emerald-600 px-2 py-1 text-white">Join করো</span>
      </div>
    </Panel>
  );
}

function SceneReview() {
  return (
    <>
      <Panel className="text-center">
        <div
          className="tour-pop mx-auto flex w-fit items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-medium text-emerald-700 sm:text-xs"
          style={style(0.2)}
        >
          <IconCheck className="h-3.5 w-3.5" /> কাজ সম্পন্ন
        </div>
        <p className="text-sm font-semibold sm:text-base">কাজটা কেমন হলো?</p>
        <div className="flex justify-center gap-1 text-amber-400">
          {[0, 1, 2, 3, 4].map((i) => (
            <IconStar
              key={i}
              className="tour-pop h-5 w-5 fill-current sm:h-6 sm:w-6"
              style={style(0.9 + i * 0.25)}
            />
          ))}
        </div>
        <Field label="মন্তব্য">
          <Typed text="খুব সুন্দর করে বুঝিয়েছেন!" delay={2.3} dur={1.2} />
        </Field>
        <Cta delay={3.7}>Review পাঠাও</Cta>
      </Panel>
      <div
        className="tour-pop absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-[11px] font-medium text-amber-700 shadow sm:text-xs"
        style={style(4.2)}
      >
        <IconZap className="h-3.5 w-3.5" /> +৩ connect ফেরত
      </div>
    </>
  );
}

const SCENES: { title: string; text: string; icon: IconType; view: () => React.JSX.Element }[] = [
  { title: "Account খোলো", text: "Email, Google বা GitHub দিয়ে কয়েক সেকেন্ডেই।", icon: IconUsers, view: SceneSignup },
  { title: "University verify করো", text: "Email-এ কোড আসে। verify করলে বোনাস।", icon: IconUniversity, view: SceneVerify },
  { title: "Job post করো", text: "ধরন, বিবরণ, budget আর কীভাবে কাজ হবে লেখো।", icon: IconEdit, view: SceneJob },
  { title: "Apply করো", text: "পছন্দের job-এ cover note দিয়ে আবেদন করো।", icon: IconSend, view: SceneApply },
  { title: "Chat ও Meet", text: "Hire-এর পর platform-এই কথা ও meeting link।", icon: IconChat, view: SceneChat },
  { title: "কাজ শেষ, review", text: "দুজনেই review দেয়, আর connect ফেরত আসে।", icon: IconStar, view: SceneReview },
];

/* ───────── মূল কম্পোনেন্ট ───────── */

export default function ProductTour() {
  const reduced = useReducedMotion();
  const [i, setI] = useState(0);
  const [run, setRun] = useState(0);
  const [manual, setManual] = useState<boolean | null>(null);
  const playing = manual ?? !reduced;

  useEffect(() => {
    if (!playing) return;
    const t = setTimeout(() => setI((v) => (v + 1) % SCENES.length), DURATION);
    return () => clearTimeout(t);
  }, [i, playing, run]);

  function go(idx: number) {
    setI((idx + SCENES.length) % SCENES.length);
    setRun((r) => r + 1);
  }

  function toggle() {
    if (!playing) setRun((r) => r + 1); // আবার চালালে দৃশ্য ও বার একসাথে শুরু থেকে
    setManual(!playing);
  }

  const scene = SCENES[i];
  const View = scene.view;
  const SceneIcon = scene.icon;
  const btn =
    "flex h-9 w-9 items-center justify-center rounded-full border text-slate-600 transition hover:bg-slate-100";

  return (
    <div>
      <div className="overflow-hidden rounded-2xl border bg-white shadow-xl">
        <div className="flex items-center gap-2 border-b bg-slate-50 px-4 py-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          <span className="ml-3 flex items-center gap-1.5 rounded-md bg-white px-3 py-0.5 text-[11px] text-slate-400 ring-1 ring-slate-200">
            <IconLock className="h-3 w-3" /> unilink
          </span>
        </div>

        <div className="relative flex h-92 items-center justify-center overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-violet-50 p-4 sm:aspect-video sm:h-auto sm:p-8">
          <View key={`${i}-${run}`} />
        </div>
      </div>

      <div className="mt-5 space-y-4">
        <div className="flex gap-2">
          {SCENES.map((s, idx) => (
            <button
              key={s.title}
              type="button"
              onClick={() => go(idx)}
              aria-label={`ধাপ ${idx + 1}: ${s.title}`}
              className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200"
            >
              <span
                key={idx === i ? `${i}-${run}` : idx}
                className={`block h-full rounded-full bg-indigo-600 ${
                  idx < i ? "w-full" : idx === i ? "tour-bar" : "w-0"
                }`}
                style={
                  idx === i
                    ? { animationDuration: `${DURATION}ms`, animationPlayState: playing ? "running" : "paused" }
                    : undefined
                }
              />
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <SceneIcon className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs text-slate-400">
                ধাপ {i + 1}/{SCENES.length}
              </p>
              <h3 className="font-semibold">{scene.title}</h3>
              <p className="text-sm text-slate-500">{scene.text}</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button type="button" onClick={() => go(i - 1)} aria-label="আগের ধাপ" className={btn}>
              <IconBack className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={toggle}
              aria-label={playing ? "থামাও" : "চালাও"}
              className={btn}
            >
              {playing ? <IconPause className="h-4 w-4" /> : <IconPlay className="h-4 w-4" />}
            </button>
            <button type="button" onClick={() => go(i + 1)} aria-label="পরের ধাপ" className={btn}>
              <IconNext className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}