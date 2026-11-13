import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import FacultyForm from "@/components/faculty/faculty-form";
import { getSession } from "@/lib/session";
import { getMyLatestFacultyRequest } from "@/lib/requests";
import { ListSkeleton } from "@/components/skeletons";

const noteClass = "rounded-2xl border bg-white p-6 text-center text-sm text-slate-700 shadow-sm";

async function FacultyContent() {
  const session = await getSession();
  if (!session) redirect("/login");
  const { user } = session;

  if (user.role === "admin" || (user.role === "faculty" && user.isFacultyApproved)) {
    return (
      <div className={`${noteClass} border-emerald-200 bg-emerald-50 text-emerald-800`}>
        ✅ তুমি verified faculty। Premium job post করতে পারবে।
      </div>
    );
  }

  const last = await getMyLatestFacultyRequest(user.id);

  if (last?.status === "pending") {
    return <div className={noteClass}>⏳ তোমার আবেদন যাচাই হচ্ছে। Admin দেখলে এখানে জানতে পারবে।</div>;
  }

  return (
    <div className="space-y-4">
      {last?.status === "rejected" && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          আগের আবেদন গৃহীত হয়নি{last.adminNote ? `: ${last.adminNote}` : "।"} সঠিক তথ্য দিয়ে আবার আবেদন করতে পারো।
        </div>
      )}
      <FacultyForm />
    </div>
  );
}

export default function FacultyApplyPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-xl space-y-6 px-4 py-8">
        <Link href="/dashboard" className="inline-block text-sm text-slate-500 hover:text-slate-800">
          ← Dashboard
        </Link>
        <div>
          <h1 className="text-2xl font-bold">🎓 Faculty verify</h1>
          <p className="text-sm text-slate-500">
            Verified faculty-রা 💎 Premium job post করতে পারেন (সবাই apply করতে পারে)।
          </p>
        </div>
        <Suspense fallback={< ListSkeleton />}>
          <FacultyContent />
        </Suspense>
      </div>
    </main>
  );
}