"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

type State = "idle" | "loading" | "done";

export default function NavProgress() {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const key = `${pathname}?${search}`;

  const [state, setState] = useState<State>("idle");
  const [seenKey, setSeenKey] = useState(key);

  // নতুন পেজে এলে (render-এর সময়ই) বার শেষ করা
  if (key !== seenKey) {
    setSeenKey(key);
    if (state === "loading") setState("done");
  }

  // ভেতরের কোনো লিংকে চাপ দিলেই বার চালু
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as HTMLElement).closest("a");
      if (!a) return;
      const href = a.getAttribute("href");
      if (
        !href ||
        a.target === "_blank" ||
        a.hasAttribute("download") ||
        href.startsWith("#") ||
        /^(mailto:|tel:)/.test(href)
      ) {
        return;
      }
      const url = new URL(href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      setState("loading");
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  useEffect(() => {
    if (state !== "done") return;
    const t = setTimeout(() => setState("idle"), 500);
    return () => clearTimeout(t);
  }, [state]);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[3px]" aria-hidden>
      <div
        className={`h-full bg-indigo-500 shadow-[0_0_8px] shadow-indigo-400 ease-out ${
          state === "loading"
            ? "w-[85%] opacity-100 transition-[width] duration-[8000ms]"
            : state === "done"
              ? "w-full opacity-0 transition-[width,opacity] duration-300"
              : "w-0 opacity-0 transition-none"
        }`}
      />
    </div>
  );
}