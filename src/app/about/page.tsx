import Link from "next/link";
import type { IconType } from "react-icons";
import {
  IconBook,
  IconCheck,
  IconChat,
  IconFlag,
  IconGraduation,
  IconHandshake,
  IconLock,
  IconMapPin,
  IconShield,
  IconStar,
  IconUsers,
} from "@/components/icons";
import { SITE } from "@/lib/site";

export const metadata = {
  title: "আমাদের সম্পর্কে | Unilink",
  description: "Unilink কেন তৈরি হয়েছে, কাদের জন্য, আর আমরা কীভাবে নিরাপদ রাখার চেষ্টা করি।",
};

type Item = { icon: IconType; title: string; text: string };

const PROBLEMS: Item[] = [
  {
    icon: IconUsers,
    title: "সাহায্য খুঁজে পাওয়া কঠিন",
    text: "Project, coding, design বা পড়ায় আটকে গেলে কার কাছে যাবে বোঝা যায় না। Unilink-এ নিজের university-তেই অভিজ্ঞ কাউকে খুঁজে পাওয়া যায়।",
  },
  {
    icon: IconBook,
    title: "দক্ষতা কাজে লাগানোর জায়গা কম",
    text: "শিক্ষার্থীদের হাতে ছোট ছোট কাজের সুযোগ কম। এখানে ছোট কাজ থেকে প্রথম আয় ও অভিজ্ঞতা, দুটোই আসে।",
  },
  {
    icon: IconShield,
    title: "অচেনা প্ল্যাটফর্মে আস্থা কম",
    text: "Verified university সদস্য, review ও report ব্যবস্থা দিয়ে আমরা আস্থার একটা ভিত্তি গড়ার চেষ্টা করছি।",
  },
];

const SAFETY: Item[] = [
  { icon: IconCheck, title: "University email যাচাই", text: "প্রাতিষ্ঠানিক email-এ কোড পাঠিয়ে যাচাই। একটি email শুধু একটি account-এ।" },
  { icon: IconMapPin, title: "Offline কাজে বাড়তি শর্ত", text: "Offline কাজ শুধু একই university-র verified সদস্যদের মধ্যে।" },
  { icon: IconLock, title: "যোগাযোগের তথ্য সুরক্ষিত", text: "Hire-এর আগে phone/email দেখা যায় না। কথা হয় platform-এর ভেতরের chat-এ।" },
  { icon: IconStar, title: "Review ও রেটিং", text: "কাজ শেষে দুজনেই review দেয়। অন্যজন review না দেওয়া পর্যন্ত দুটোই লুকানো থাকে, যেন প্রতিশোধমূলক রেটিং না হয়।" },
  { icon: IconFlag, title: "Report ও admin পর্যালোচনা", text: "সন্দেহজনক job বা আচরণ report করা যায়, admin দেখে ব্যবস্থা নেন।" },
  { icon: IconGraduation, title: "Faculty যাচাই", text: "Premium job শুধু admin-এর যাচাই করা faculty post করতে পারেন।" },
];

const AUDIENCE: Item[] = [
  { icon: IconBook, title: "শিক্ষার্থী", text: "সাহায্য চাও, বা ছোট কাজ করে অভিজ্ঞতা ও আয় করো।" },
  { icon: IconUsers, title: "সিনিয়র ও দক্ষরা", text: "নিজের জানা কাজে লাগাও, রেটিং ও সুনাম গড়ো।" },
  { icon: IconGraduation, title: "শিক্ষক (Faculty)", text: "গবেষণা বা প্রজেক্টের জন্য সহায়ক খুঁজে নাও, সবার কাছে পৌঁছাও।" },
];

const VALUES: Item[] = [
  { icon: IconCheck, title: "সততা", text: "আমরা শেখানো ও সহায়তার পক্ষে। একাডেমিক অসততা, মানে অন্যের নামে জমা দেওয়ার ব্যবস্থা, নিষিদ্ধ।" },
  { icon: IconChat, title: "স্বচ্ছতা", text: "Connect কীভাবে খরচ ও ফেরত হয়, আর কোন নীতি কী, সবই লিখিত ও সবার জন্য খোলা।" },
  { icon: IconHandshake, title: "পারস্পরিক সম্মান", text: "ভদ্র আচরণ, সময়মতো উত্তর, আর কাজ শেষে ন্যায্য মূল্যায়ন।" },
];

function Card({ item, small }: { item: Item; small?: boolean }) {
  const Icon = item.icon;
  return (
    <div className="space-y-3 rounded-2xl border bg-white p-5 shadow-sm">
      <span
        className={`flex ${small ? "h-10 w-10" : "h-12 w-12"} items-center justify-center rounded-xl bg-indigo-50 text-indigo-600`}
      >
        <Icon className={small ? "h-5 w-5" : "h-6 w-6"} />
      </span>
      <h3 className="font-semibold">{item.title}</h3>
      <p className="text-sm text-slate-600">{item.text}</p>
    </div>
  );
}

export default function AboutPage() {
  return (
    <main>
      {/* হিরো */}
      <section className="bg-gradient-to-br from-indigo-50 via-white to-violet-50">
        <div className="mx-auto max-w-3xl space-y-4 px-4 py-16 text-center md:py-20">
          <h1 className="text-4xl font-bold tracking-tight">Unilink সম্পর্কে</h1>
          <p className="text-lg text-slate-600">
            Unilink একটা university-কেন্দ্রিক micro-job প্ল্যাটফর্ম। আমরা চাই শিক্ষার্থী, সিনিয়র ও
            শিক্ষকরা নিজেদের কমিউনিটির ভেতরেই কাজ, সাহায্য আর শেখার সুযোগ খুঁজে পান।
          </p>
        </div>
      </section>

      {/* লক্ষ্য */}
      <section className="mx-auto max-w-3xl px-4 py-14 text-center">
        <h2 className="text-2xl font-bold">আমাদের লক্ষ্য</h2>
        <p className="mt-4 text-slate-600">
          University-র ভেতরে দক্ষতা আর প্রয়োজনের মধ্যে একটা সহজ, নিরাপদ ও আস্থাযোগ্য সেতু গড়ে তোলা,
          যেখানে সাহায্য চাওয়া ও সাহায্য করা দুটোই স্বাভাবিক।
        </p>
      </section>

      {/* গল্প: নিজের কথায় লেখো */}
      {/*
      <section className="mx-auto max-w-3xl px-4 pb-14">
        <h2 className="text-center text-2xl font-bold">আমাদের গল্প</h2>
        <p className="mt-4 text-slate-600">এখানে Unilink কেন শুরু করেছ সেই গল্পটা লেখো।</p>
      </section>
      */}

      {/* সমস্যা */}
      <section className="bg-slate-50">
        <div className="mx-auto max-w-5xl px-4 py-14">
          <h2 className="text-center text-2xl font-bold">যে সমস্যাগুলো সমাধান করতে চাই</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {PROBLEMS.map((p) => (
              <Card key={p.title} item={p} />
            ))}
          </div>
        </div>
      </section>

      {/* নিরাপত্তা */}
      <section className="mx-auto max-w-5xl px-4 py-14">
        <h2 className="text-center text-2xl font-bold">আমরা কীভাবে নিরাপদ রাখার চেষ্টা করি</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {SAFETY.map((s) => (
            <Card key={s.title} item={s} small />
          ))}
        </div>
      </section>

      {/* কাদের জন্য */}
      <section className="bg-slate-50">
        <div className="mx-auto max-w-5xl px-4 py-14">
          <h2 className="text-center text-2xl font-bold">কাদের জন্য</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {AUDIENCE.map((a) => (
              <Card key={a.title} item={a} />
            ))}
          </div>
        </div>
      </section>

      {/* মূল্যবোধ */}
      <section className="mx-auto max-w-5xl px-4 py-14">
        <h2 className="text-center text-2xl font-bold">আমাদের মূল্যবোধ</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {VALUES.map((v) => (
            <Card key={v.title} item={v} />
          ))}
        </div>
      </section>

      {/* এখন কোথায় */}
      <section className="bg-slate-50">
        <div className="mx-auto max-w-3xl space-y-4 px-4 py-14 text-center">
          <h2 className="text-2xl font-bold">আমরা এখন কোথায়</h2>
          <p className="text-slate-600">
            Unilink এখন প্রাথমিক পর্যায়ে। কিছু জিনিস এখনো তৈরি হচ্ছে, যেমন প্ল্যাটফর্মের ভেতরে
            নিরাপদ পেমেন্ট এবং আরও university-র জন্য আলাদা জায়গা। তোমার মতামত শুনেই আমরা এগোই।
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-indigo-600">
        <div className="mx-auto max-w-5xl space-y-4 px-4 py-14 text-center text-white">
          <h2 className="text-2xl font-bold">আমাদের সাথে যোগ দাও</h2>
          <p className="text-indigo-100">
            প্রশ্ন বা পরামর্শ থাকলে লেখো: {SITE.supportEmail}
          </p>
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
              Job দেখো
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}