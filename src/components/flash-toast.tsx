"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-toastify";

const FLASH: Record<string, { type: "success" | "error"; text: string }> = {
  login: { type: "success", text: "সফলভাবে login হয়েছে 👋" },
  signup: { type: "success", text: "Account তৈরি হয়েছে, স্বাগতম! 🎉" },
  logout: { type: "success", text: "Logout হয়েছে" },
  oauth_error: {
    type: "error",
    text: "Login করা যায়নি। এই email আগে অন্য পদ্ধতিতে খোলা হয়ে থাকলে সেভাবে ঢোকো, অথবা আবার চেষ্টা করো",
  },
};

export default function FlashToast() {
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const key = sp.get("flash");
    const item = key ? FLASH[key] : undefined;
    if (!key || !item) return;

    toast[item.type](item.text, { toastId: `flash-${key}` });

    // URL পরিষ্কার করা, যেন refresh করলে বার্তা আবার না আসে
    const next = new URLSearchParams(sp.toString());
    next.delete("flash");
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  }, [sp, router, pathname]);

  return null;
}