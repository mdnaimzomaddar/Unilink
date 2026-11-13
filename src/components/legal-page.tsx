import Link from "next/link";
import { Children, cloneElement, isValidElement } from "react";
import { Container } from "@/components/layout-kit";
import {
  IconBook,
  IconChevronRight,
  IconCoins,
  IconMail,
  IconShield,
  IconWarning,
} from "@/components/icons";
import { SITE } from "@/lib/site";

const DOCS = [
  { href: "/terms", label: "শর্তাবলি", icon: IconBook },
  { href: "/privacy", label: "গোপনীয়তা নীতি", icon: IconShield },
  { href: "/refund-policy", label: "Refund ও বিরোধ নীতি", icon: IconCoins },
];

type SectionEl = React.ReactElement<{ title: string; id?: string }>;

export function LegalPage({ title, children }: { title: string; children: React.ReactNode }) {
  const sections = Children.toArray(children).filter(isValidElement) as SectionEl[];
  const toc = sections.map((s, i) => ({ id: `s${i + 1}`, title: s.props.title }));
  const body = sections.map((s, i) => cloneElement(s, { id: `s${i + 1}` }));

  return (
    <main>
      <div className="border-b bg-white">
        <Container className="space-y-5 py-10">
          <nav aria-label="breadcrumb" className="flex items-center gap-1.5 text-sm text-slate-500">
            <Link href="/" className="hover:text-slate-900">
              হোম
            </Link>
            <IconChevronRight className="h-3.5 w-3.5" />
            <span>নীতিমালা</span>
          </nav>

          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
            <p className="text-sm text-slate-500">সর্বশেষ হালনাগাদ: {SITE.legalUpdated}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            {DOCS.map((d) => {
              const Icon = d.icon;
              const active = title.includes(d.label);
              return (
                <Link
                  key={d.href}
                  href={d.href}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                    active
                      ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Icon className="h-4 w-4" /> {d.label}
                </Link>
              );
            })}
          </div>

          {SITE.legalIsDraft && (
            <div className="flex items-start gap-2 rounded-xl bg-amber-50 p-4 text-sm text-amber-800 ring-1 ring-amber-200">
              <IconWarning className="mt-0.5 h-4 w-4 shrink-0" />
              এটি খসড়া। আইনজীবীর যাচাই ছাড়া চূড়ান্ত বলে ধরা যাবে না।
            </div>
          )}
        </Container>
      </div>

      <Container className="grid gap-8 py-10 lg:grid-cols-[17rem_1fr]">
        {/* সূচিপত্র */}
        <aside className="hidden lg:block">
          <nav className="sticky top-24 space-y-1 rounded-2xl border bg-white p-3 shadow-sm">
            <p className="px-3 pb-2 pt-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
              এই পাতায়
            </p>
            {toc.map((t) => (
              <a
                key={t.id}
                href={`#${t.id}`}
                className="block rounded-lg px-3 py-1.5 text-sm text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
              >
                {t.title}
              </a>
            ))}
          </nav>
        </aside>

        <div className="min-w-0 space-y-4">
          <details className="rounded-xl border bg-white p-4 lg:hidden">
            <summary className="cursor-pointer text-sm font-medium">সূচিপত্র</summary>
            <div className="mt-3 space-y-1">
              {toc.map((t) => (
                <a
                  key={t.id}
                  href={`#${t.id}`}
                  className="block rounded-lg px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100"
                >
                  {t.title}
                </a>
              ))}
            </div>
          </details>

          <article className="divide-y rounded-2xl border bg-white px-6 shadow-sm sm:px-10">{body}</article>

          <div className="flex items-center gap-4 rounded-2xl border bg-white p-6 shadow-sm">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <IconMail className="h-5 w-5" />
            </span>
            <div className="text-sm">
              <p className="font-medium">প্রশ্ন বা আপত্তি থাকলে লেখো</p>
              <a href={`mailto:${SITE.supportEmail}`} className="text-indigo-600 underline">
                {SITE.supportEmail}
              </a>
            </div>
          </div>
        </div>
      </Container>
    </main>
  );
}

export function Section({
  title,
  id,
  children,
}: {
  title: string;
  id?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 space-y-3 py-8">
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      <div className="space-y-3 text-[15px] leading-7 text-slate-700">{children}</div>
    </section>
  );
}

export function List({ items }: { items: string[] }) {
  return (
    <ul className="list-disc space-y-2 pl-5 marker:text-indigo-500">
      {items.map((i) => (
        <li key={i}>{i}</li>
      ))}
    </ul>
  );
}