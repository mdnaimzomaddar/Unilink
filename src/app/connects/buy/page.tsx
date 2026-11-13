import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import BuyForm from "@/components/connects/buy-form";
import { Container, PageHeader } from "@/components/layout-kit";
import { ListSkeleton } from "@/components/skeletons";
import { IconBack } from "@/components/icons";
import { getSession } from "@/lib/session";
import { getMyPurchaseRequests } from "@/lib/requests";
import { PAYMENT_METHOD_LABEL, type PaymentMethod } from "@/lib/constants";

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

const STATUS: Record<string, { label: string; style: string }> = {
  pending: { label: "যাচাই চলছে", style: "bg-amber-50 text-amber-700" },
  approved: { label: "Approved", style: "bg-emerald-100 text-emerald-800" },
  rejected: { label: "Reject", style: "bg-red-50 text-red-600" },
};

async function BuyContent() {
  const session = await getSession();
  if (!session) redirect("/login");

  const numbers: Partial<Record<PaymentMethod, string>> = {
    bkash: process.env.BKASH_NUMBER || undefined,
    nagad: process.env.NAGAD_NUMBER || undefined,
  };
  const requests = await getMyPurchaseRequests(session.user.id);

  return (
    <>
      <BuyForm numbers={numbers} />

      <section className="mt-10 space-y-4">
        <h2 className="text-lg font-semibold">আমার request</h2>
        {requests.length === 0 ? (
          <div className="rounded-2xl border border-dashed bg-white p-8 text-center text-sm text-slate-500">
            এখনো কোনো request নেই।
          </div>
        ) : (
          <ul className="divide-y overflow-hidden rounded-2xl border bg-white shadow-sm">
            {requests.map((r) => {
              const s = STATUS[r.status];
              return (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div className="space-y-0.5">
                    <p className="font-medium">
                      {r.connects} connect · ৳{r.amount} ·{" "}
                      {PAYMENT_METHOD_LABEL[r.method as PaymentMethod] ?? r.method}
                    </p>
                    <p className="text-xs text-slate-500">
                      TrxID {r.trxId} · {fmtDate(r.createdAt)}
                    </p>
                    {r.status === "rejected" && r.adminNote && (
                      <p className="text-xs text-red-600">কারণ: {r.adminNote}</p>
                    )}
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${s.style}`}>{s.label}</span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </>
  );
}

export default function BuyPage() {
  return (
    <main>
      <PageHeader
        title="Connect কেনো"
        description="Golden ও Premium job-এ apply করতে connect লাগে। প্রতি ৫ connect-এ ১টা Silver post ফ্রি।"
        actions={
          <Link
            href="/dashboard?tab=wallet"
            className="inline-flex items-center gap-1.5 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-slate-50"
          >
            <IconBack className="h-4 w-4" /> Wallet
          </Link>
        }
      />
      <Container className="py-8">
        <Suspense fallback={<ListSkeleton rows={3} />}>
          <BuyContent />
        </Suspense>
      </Container>
    </main>
  );
}