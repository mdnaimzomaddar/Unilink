"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { signOut } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

export default function SignOutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    const { error } = await signOut();
    setLoading(false);

    if (error) {
      toast.error(error.message || "Logout করা যায়নি, আবার চেষ্টা করো");
      return;
    }
    router.push("/login?flash=logout");
    router.refresh();
  }

  return (
    <Button variant="outline" onClick={handleLogout} disabled={loading}>
      {loading ? "অপেক্ষা করো..." : "Logout"}
    </Button>
  );
}