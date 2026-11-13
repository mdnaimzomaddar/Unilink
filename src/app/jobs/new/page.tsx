import { Suspense } from "react";
import { redirect } from "next/navigation";
import JobForm from "@/components/jobs/job-form";
import { Container, PageHeader } from "@/components/layout-kit";
import { getSession } from "@/lib/session";
import { getWalletSummary } from "@/lib/wallet";
import { isVerifiedMember } from "@/lib/university";
import { ListSkeleton } from "@/components/skeletons";

async function NewJobContent() {
  const session = await getSession();
  if (!session) redirect("/login");

  const { user } = session;
  const canPostPremium =
    user.role === "admin" || (user.role === "faculty" && !!user.isFacultyApproved);
  const wallet = await getWalletSummary(user.id);

  return (
    <JobForm
      canPostPremium={canPostPremium}
      isVerified={isVerifiedMember(user)}
      silverCredits={wallet.silverCredits}
    />
  );
}

export default function NewJobPage() {
  return (
    <main>
      <PageHeader
        title="নতুন Job post করো"
        description="কাজের ধরন বেছে নাও, তথ্য দাও, বাকিটা কমিউনিটি দেখবে।"
      />
      <Container className="py-8">
        <Suspense fallback={<ListSkeleton rows={3} />}>
          <NewJobContent />
        </Suspense>
      </Container>
    </main>
  );
}