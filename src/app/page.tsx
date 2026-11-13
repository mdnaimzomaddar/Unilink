import Link from "next/link";
import type { IconType } from "react-icons";
import TutorialVideo from "@/components/tutorial-video";
import { JobTypeIcon } from "@/components/type-icons";
import {
  IconCheck,
  IconChat,
  IconChevronDown,
  IconEdit,
  IconGraduation,
  IconHandshake,
  IconMapPin,
  IconOnline,
  IconShield,
  IconStar,
  IconZap,
} from "@/components/icons";
import { CATEGORIES, JOB_TYPES, JOB_TYPE_META } from "@/lib/constants";
import { SITE } from "@/lib/site";
import ProductTour from "@/components/product-tour";

export const metadata = {
  title: "Unilink | তোমার university-র কমিউনিটিতে কাজ খোঁজো ও দাও",
  description:
    "Assignment, project, coding, design, tutoring। সিনিয়রদের সাহায্য নাও বা নিজের দক্ষতায় আয় করো।",
};

type Item = { icon: IconType; title: string; text: string };

const STEPS: Item[] = [
  {
    icon: IconGraduation,
    title: "Account খোলো, university verify করো",
    text: "Email, Google বা GitHub দিয়ে ঢোকো। তোমার university-র email-এ একটা কোড পাঠিয়ে নিজের university-র সদস্য হও।",
  },
  {
    icon: IconEdit,
    title: "Job post করো বা apply করো",
    text: "সমস্যা বা কাজের কথা লেখো, অথবা অন্যের job-এ নিজের দক্ষতা দেখিয়ে আবেদন করো।",
  },
  {
    icon: IconHandshake,
    title: "Hire, কথা, কাজ, review",
    text: "Hire হলে chat ও Meet/Zoom-এ কথা বলে কাজ শেষ করো, তারপর একে অপরকে review দাও।",
  },
];

const TYPE_NOTE: Record<(typeof JOB_TYPES)[number], string> = {
  silver: "শেখা, সহযোগিতা বা স্বেচ্ছাসেবার কাজ। Apply করা ফ্রি।",
  golden: "টাকা দিয়ে কাজ করাও বা করো। Apply করতে Connect লাগে।",
  premium: "Verified faculty-দের কাজ, যেমন গবেষণা সহায়তা। সবাই apply করতে পারে।",
};

const FEATURES: Item[] = [
  { icon: IconCheck, title: "University verified সদস্য", text: "প্রাতিষ্ঠানিক email-এ কোড পাঠিয়ে যাচাই, তাই পরিচয়ে আস্থা বেশি।" },
  { icon: IconChat, title: "Platform-এর ভেতরেই chat", text: "Hire-এর পর সরাসরি কথা ও Google Meet/Zoom link। Online job-এ phone নম্বর দিতেই হয় না।" },
  { icon: IconMapPin, title: "Online ও Offline কাজ", text: "Offline কাজ শুধু একই university-র verified সদস্যদের মধ্যে।" },
  { icon: IconStar, title: "Review ও রেটিং", text: "কাজ শেষে দুজনেই review দেয়, তাই ভালো কাজের সুনাম জমে।" },
  { icon: IconZap, title: "স্বচ্ছ Connect ব্যবস্থা", text: "Job বন্ধ হলে বা কাজ সম্পন্ন হলে নির্দিষ্ট ক্ষেত্রে connect ফেরত যায়।" },
  { icon: IconShield, title: "Report ও moderation", text: "সমস্যা হলে report করো, admin পর্যালোচনা করে ব্যবস্থা নেন।" },
];

const FAQ = [
  {
    q: "Unilink কি ফ্রি?",
    a: "Account খোলা ফ্রি। Silver job ফ্রি, আর নতুন সদস্যরা কিছু ফ্রি Silver post ও connect পায় (university verify করলে বেশি)। Golden ও Premium job-এ apply করতে Connect লাগে।",
  },
  {
    q: "Connect কী?",
    a: "Golden ও Premium job-এ apply করার ক্রেডিট। কাজ সম্পন্ন হলে যিনি hired হয়েছেন তিনি খরচ হওয়া connect ফেরত পান। Job কাউকে না নিয়ে বন্ধ হলে সব আবেদনকারী ফেরত পান। বিস্তারিত Refund নীতিতে।",
  },
  {
    q: "আমার university-র email নেই, তাহলে?",
    a: "Verify ছাড়াই Online কাজ করা যায়। Offline কাজ ও নিজের university-র সুবিধার জন্য verify লাগে। প্রাতিষ্ঠানিক email ছাড়া যাচাইয়ের বিকল্প (student ID) আমরা আনার পরিকল্পনা করছি।",
  },
  {
    q: "কাজের টাকা কীভাবে দেওয়া হয়?",
    a: "এখন কাজের টাকা দুই পক্ষ নিজেদের মধ্যে লেনদেন করে। Unilink এই টাকা ধরে রাখে না, নিশ্চয়তাও দেয় না, তাই চেনা-জানা ও সতর্কতা জরুরি। Platform-এর মাধ্যমে নিরাপদ পেমেন্ট আমাদের পরিকল্পনায় আছে।",
  },
  {
    q: "Assignment বা thesis কি অন্য কেউ লিখে দেবে?",
    a: "না। আমরা শেখানো, গাইড করা, পর্যালোচনা ও সহায়তাকে উৎসাহ দিই। অন্যের নামে পরীক্ষা দেওয়া বা পুরো কাজ লিখে নিজের নামে জমা দেওয়ার মতো একাডেমিক অসততা নিষিদ্ধ।",
  },
  {
    q: "Offline দেখা করা কি নিরাপদ?",
    a: "Offline job শুধু একই university-র verified সদস্যদের মধ্যে। তবুও সবসময় প্রকাশ্য জায়গায় দেখা করো, আর অস্বস্তি হলে report করো।",
  },
];

function IconBox({ icon: Icon, size = "h-12 w-12", iconSize = "h-6 w-6" }: {
  icon: IconType;
  size?: string;
  iconSize?: string;
}) {
  return (
    <span className={`flex ${size} items-center justify-center rounded-xl bg-indigo-50 text-indigo-600`}>
      <Icon className={iconSize} />
    </span>
  );
}

export default function HomePage() {
  return (
    <main>
      {/* হিরো */}
      <section className="bg-gradient-to-br from-indigo-50 via-white to-violet-50">
        <div className="mx-auto grid max-w-5xl gap-10 px-4 py-16 md:grid-cols-2 md:items-center md:py-24">
          <div className="space-y-6">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-700">
              <IconGraduation className="h-3.5 w-3.5" /> University-কেন্দ্রিক micro-job কমিউনিটি
            </span>
            <h1 className="text-4xl font-bold leading-tight tracking-tight md:text-5xl">
              কাজ খোঁজো, কাজ দাও,
              <span className="text-indigo-600"> তোমার university-তেই</span>
            </h1>
            <p className="text-lg text-slate-600">
              Coding, design, tutoring, project-এর সাহায্য। সিনিয়রদের কাছ থেকে সমাধান নাও, অথবা
              নিজের দক্ষতা দিয়ে আয় করো।
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/jobs"
                className="rounded-lg bg-indigo-600 px-6 py-3 font-medium text-white shadow-sm hover:bg-indigo-700"
              >
                কাজ খোঁজো
              </Link>
              <Link
                href="/signup"
                className="rounded-lg border border-slate-300 bg-white px-6 py-3 font-medium text-slate-800 hover:bg-slate-50"
              >
                Account খোলো
              </Link>
            </div>
            <p className="text-xs text-slate-500">
              ফ্রিতে শুরু করো · Online ও Offline · Verified সদস্য
            </p>
          </div>

          {/* নমুনা কার্ড */}
          <div className="relative">
            <div className="absolute -inset-2 rounded-3xl bg-gradient-to-r from-indigo-200 to-violet-200 opacity-40 blur-xl" />
            <div className="relative space-y-3 rounded-2xl border bg-white p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800 ring-1 ring-inset ring-amber-300">
                  <JobTypeIcon type="golden" className="h-3.5 w-3.5" /> Golden
                </span>
                <span className="text-xs text-slate-400">নমুনা</span>
              </div>
              <h3 className="text-lg font-semibold">Data Structures-এর জন্য ১ ঘণ্টার tutoring</h3>
              <p className="text-sm text-slate-600">
                Linked list ও tree নিয়ে কিছু জায়গায় আটকে আছি। কেউ বুঝিয়ে দিতে পারলে ভালো হয়।
              </p>
              <div className="flex flex-wrap gap-1.5">
                {["C++", "Data Structures"].map((s) => (
                  <span key={s} className="rounded-md bg-indigo-50 px-2 py-0.5 text-xs text-indigo-700">
                    {s}
                  </span>
                ))}
              </div>
              <div className="flex items-center justify-between border-t pt-3 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1.5">
                  Course Help · <IconOnline className="h-3.5 w-3.5" /> Online
                </span>
                <span className="font-semibold text-slate-800">৳৫০০</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tutorial video */}
      {/* Walkthrough */}
      <section className="mx-auto max-w-4xl px-4 py-16">
        <h2 className="text-center text-2xl font-bold">৩০ সেকেন্ডে দেখে নাও কীভাবে কাজ করে</h2>
        <p className="mt-2 text-center text-sm text-slate-500">
          Account খোলা থেকে কাজ শেষ করা পর্যন্ত পুরো ধাপ
        </p>
        <div className="mt-8">
          {SITE.tutorialYoutubeId ? (
            <TutorialVideo youtubeId={SITE.tutorialYoutubeId} />
          ) : (
            <ProductTour />
          )}
        </div>
      </section>

      {/* কীভাবে কাজ করে */}
      <section className="bg-slate-50">
        <div className="mx-auto max-w-5xl px-4 py-16">
          <h2 className="text-center text-2xl font-bold">কীভাবে কাজ করে</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <div key={s.title} className="space-y-3 rounded-2xl border bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <IconBox icon={s.icon} />
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                    ধাপ {i + 1}
                  </span>
                </div>
                <h3 className="font-semibold">{s.title}</h3>
                <p className="text-sm text-slate-600">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* তিন ধরনের job */}
      <section className="mx-auto max-w-5xl px-4 py-16">
        <h2 className="text-center text-2xl font-bold">তিন ধরনের job</h2>
        <p className="mt-2 text-center text-sm text-slate-500">কাজের ধরন অনুযায়ী বেছে নাও</p>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {JOB_TYPES.map((t) => {
            const meta = JOB_TYPE_META[t];
            return (
              <div key={t} className="space-y-3 rounded-2xl border bg-white p-6 shadow-sm">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ring-1 ring-inset ${meta.badge}`}
                >
                  <JobTypeIcon type={t} className="h-4 w-4" /> {meta.label}
                </span>
                <p className="text-sm text-slate-600">{TYPE_NOTE[t]}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* কেন Unilink */}
      <section className="bg-slate-50">
        <div className="mx-auto max-w-5xl px-4 py-16">
          <h2 className="text-center text-2xl font-bold">কেন Unilink</h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="space-y-3 rounded-2xl border bg-white p-5 shadow-sm">
                <IconBox icon={f.icon} size="h-10 w-10" iconSize="h-5 w-5" />
                <h3 className="font-semibold">{f.title}</h3>
                <p className="text-sm text-slate-600">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Category */}
      <section className="mx-auto max-w-5xl px-4 py-14 text-center">
        <h2 className="text-2xl font-bold">কোন কোন কাজে সাহায্য পাবে</h2>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {CATEGORIES.map((c) => (
            <Link
              key={c}
              href={`/jobs?category=${encodeURIComponent(c)}`}
              className="rounded-full border bg-white px-4 py-1.5 text-sm text-slate-700 hover:border-indigo-300 hover:text-indigo-600"
            >
              {c}
            </Link>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-slate-50">
        <div className="mx-auto max-w-3xl px-4 py-16">
          <h2 className="text-center text-2xl font-bold">সাধারণ প্রশ্ন</h2>
          <div className="mt-8 space-y-3">
            {FAQ.map((f) => (
              <details key={f.q} className="group rounded-xl border bg-white p-4 shadow-sm">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-medium [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <IconChevronDown className="h-4 w-4 shrink-0 text-slate-400 transition group-open:rotate-180" />
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* শেষ CTA */}
      <section className="bg-indigo-600">
        <div className="mx-auto max-w-5xl space-y-4 px-4 py-14 text-center text-white">
          <h2 className="text-2xl font-bold md:text-3xl">তোমার প্রথম কাজটা আজই শুরু করো</h2>
          <p className="text-indigo-100">Account খোলা ফ্রি। University verify করলে বাড়তি বোনাস।</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/signup"
              className="rounded-lg bg-white px-6 py-3 font-medium text-indigo-700 hover:bg-indigo-50"
            >
              Account খোলো
            </Link>
            <Link
              href="/jobs"
              className="rounded-lg border border-indigo-300 px-6 py-3 font-medium text-white hover:bg-indigo-500"
            >
              আগে job দেখি
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}