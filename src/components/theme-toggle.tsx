"use client";

import { IconMoon, IconSun } from "@/components/icons";

export default function ThemeToggle() {
  function toggle() {
    const el = document.documentElement;
    const next = !el.classList.contains("dark");
    el.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      // ব্রাউজার সংরক্ষণ বন্ধ থাকলে শুধু এই পেজে কাজ করবে
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Dark/Light মোড বদলাও"
      title="Dark/Light মোড"
      className="relative flex h-9 w-9 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
    >
      <IconMoon className="h-[18px] w-[18px] dark:hidden" />
      <IconSun className="hidden h-[18px] w-[18px] dark:block" />
    </button>
  );
}