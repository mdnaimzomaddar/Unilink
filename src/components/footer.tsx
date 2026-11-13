import Link from "next/link";
import Logo from "@/components/logo";
import { Container } from "@/components/layout-kit";
import { SITE } from "@/lib/site";

const COLS = [
  {
    title: "প্ল্যাটফর্ম",
    links: [
      { href: "/jobs", label: "Jobs" },
      { href: "/jobs/new", label: "Job post করো" },
      { href: "/dashboard", label: "Dashboard" },
      { href: "/about", label: "আমাদের সম্পর্কে" },
    ],
  },
  {
    title: "নীতিমালা",
    links: [
      { href: "/terms", label: "শর্তাবলি" },
      { href: "/privacy", label: "গোপনীয়তা নীতি" },
      { href: "/refund-policy", label: "Refund ও বিরোধ নীতি" },
    ],
  },
];

const link = "text-slate-500 transition hover:text-indigo-600";

export default function Footer() {
  return (
    <footer className="border-t bg-white">
      <Container className="grid gap-10 py-12 md:grid-cols-4">
        <div className="space-y-4 md:col-span-2">
          <Logo className="h-12" />
          <p className="max-w-sm text-sm text-slate-500">
            University-কেন্দ্রিক micro-job প্ল্যাটফর্ম। কাজ খোঁজো, কাজ দাও, আর নিজের কমিউনিটির
            সাথে বেড়ে ওঠো।
          </p>
        </div>

        {COLS.map((c) => (
          <div key={c.title} className="space-y-3 text-sm">
            <p className="font-semibold">{c.title}</p>
            <ul className="space-y-2">
              {c.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className={link}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </Container>

      <div className="border-t">
        <Container className="flex flex-wrap items-center justify-between gap-2 py-5 text-xs text-slate-500">
          <p>© 2026 {SITE.name}. সর্বস্বত্ব সংরক্ষিত।</p>
          <a href={`mailto:${SITE.supportEmail}`} className={link}>
            {SITE.supportEmail}
          </a>
        </Container>
      </div>
    </footer>
  );
}