"use client";

import { useMemo, useState } from "react";
import { IconCheck, IconSearch, IconUniversity } from "@/components/icons";

export type PickerUni = { slug: string; name: string; shortName: string; type: string };

const TYPE_LABEL: Record<string, string> = { public: "সরকারি", private: "বেসরকারি", other: "অন্যান্য" };

export default function UniversityPicker({
  universities,
  value,
  onChange,
  supportEmail,
}: {
  universities: PickerUni[];
  value: string;
  onChange: (slug: string) => void;
  supportEmail: string;
}) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "public" | "private">("all");
  const [active, setActive] = useState(0);

  const selected = universities.find((u) => u.slug === value);

  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    const rank = (u: PickerUni) =>
      s && u.shortName.toLowerCase() === s ? 0 : s && u.shortName.toLowerCase().startsWith(s) ? 1 : 2;
    return universities
      .filter(
        (u) =>
          (filter === "all" || u.type === filter) &&
          (!s ||
            u.name.toLowerCase().includes(s) ||
            u.shortName.toLowerCase().includes(s) ||
            u.slug.includes(s))
      )
      .sort((a, b) => rank(a) - rank(b));
  }, [universities, q, filter]);

  function pick(u: PickerUni) {
    onChange(u.slug);
    setQ("");
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (results[active]) pick(results[active]);
    }
  }

  if (selected) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-lg border border-indigo-300 bg-indigo-50 px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-indigo-600">
            <IconUniversity className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{selected.name}</p>
            <p className="text-xs text-slate-500">
              {selected.shortName ? `${selected.shortName} · ` : ""}
              {TYPE_LABEL[selected.type] ?? ""}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onChange("")}
          className="shrink-0 text-sm font-medium text-indigo-600 hover:underline"
        >
          বদলাও
        </button>
      </div>
    );
  }

  const chip = (key: typeof filter, label: string) => (
    <button
      key={key}
      type="button"
      onClick={() => {
        setFilter(key);
        setActive(0);
      }}
      className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
        filter === key
          ? "border-indigo-500 bg-indigo-50 text-indigo-700"
          : "text-slate-600 hover:bg-slate-50"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-2">
      <div className="relative">
        <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setActive(0);
          }}
          onKeyDown={onKeyDown}
          placeholder="নাম বা সংক্ষিপ্ত নাম লিখে খোঁজো (যেমন BUET, DU, UGV)"
          className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
          role="combobox"
          aria-expanded="true"
          aria-controls="uni-list"
        />
      </div>

      <div className="flex gap-2">
        {chip("all", "সব")}
        {chip("public", "সরকারি")}
        {chip("private", "বেসরকারি")}
      </div>

      <ul
        id="uni-list"
        role="listbox"
        className="max-h-64 divide-y overflow-y-auto rounded-lg border bg-white"
      >
        {results.map((u, i) => (
          <li key={u.slug} role="option" aria-selected={i === active}>
            <button
              type="button"
              onClick={() => pick(u)}
              onMouseEnter={() => setActive(i)}
              className={`flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-sm ${
                i === active ? "bg-slate-100" : ""
              }`}
            >
              <span className="min-w-0 truncate">{u.name}</span>
              <span className="flex shrink-0 items-center gap-1.5 text-xs text-slate-400">
                {u.shortName && <b className="font-semibold text-slate-600">{u.shortName}</b>}
                {TYPE_LABEL[u.type]}
              </span>
            </button>
          </li>
        ))}
        {results.length === 0 && (
          <li className="px-3 py-6 text-center text-sm text-slate-500">
            পাওয়া যায়নি। তালিকায় না থাকলে{" "}
            <a
              href={`mailto:${supportEmail}?subject=${encodeURIComponent("University যোগ করার অনুরোধ")}`}
              className="font-medium text-indigo-600 underline"
            >
              আমাদের জানাও
            </a>
            ।
          </li>
        )}
      </ul>
    </div>
  );
}