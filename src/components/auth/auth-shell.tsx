import { IconChat, IconCheck, IconStar } from "@/components/icons";
import { SITE } from "@/lib/site";

const POINTS = [
  { icon: IconCheck, text: "University email যাচাই করা সদস্যদের কমিউনিটি" },
  { icon: IconChat, text: "Hire-এর পর platform-এর ভেতরেই chat ও Meet link" },
  { icon: IconStar, text: "কাজ শেষে review ও রেটিং, সুনাম জমে" },
];

export default function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <main className="grid min-h-[calc(100vh-4.5rem)] lg:grid-cols-2">
      {/* বাঁ পাশ: ব্র্যান্ড */}
      <section className="relative hidden overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-indigo-900 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-white/5" />

        <div className="relative space-y-4">
          <p className="text-sm font-medium uppercase tracking-widest text-indigo-200">
            {SITE.tagline}
          </p>
          <h2 className="max-w-md text-4xl font-bold leading-tight">
            তোমার university-র কমিউনিটিতে কাজ খোঁজো, কাজ দাও
          </h2>
        </div>

        <ul className="relative space-y-4">
          {POINTS.map((p) => {
            const Icon = p.icon;
            return (
              <li key={p.text} className="flex items-center gap-3 text-indigo-50">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15">
                  <Icon className="h-4 w-4" />
                </span>
                {p.text}
              </li>
            );
          })}
        </ul>
      </section>

      {/* ডান পাশ: ফর্ম */}
      <section className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            <p className="text-sm text-slate-500">{subtitle}</p>
          </div>
          <div className="rounded-2xl border bg-white p-6 shadow-sm sm:p-8">{children}</div>
          {footer && <div className="text-center text-sm text-slate-500">{footer}</div>}
        </div>
      </section>
    </main>
  );
}