"use server";

import { isValidObjectId } from "mongoose";
import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
import { BD_UNIVERSITIES } from "@/lib/bd-universities";
import University from "@/models/University";

type Result = { ok: true } | { ok: false; error: string };

const DENIED = { ok: false, error: "এই কাজের অনুমতি তোমার নেই" } as const;

// subdomain-এর জন্য ভবিষ্যতে এগুলো দরকার হবে
const RESERVED_SLUGS = ["www", "admin", "api", "app", "default", "mail", "static", "assets", "dashboard"];
// এগুলো যেকোনো মানুষ বানাতে পারে, তাই university domain হিসেবে গ্রহণযোগ্য না
const PUBLIC_DOMAINS = [
  "gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "live.com",
  "icloud.com", "proton.me", "protonmail.com", "aol.com",
];

// খালি হলে [] (শুধু Student ID পদ্ধতি চলবে), ভুল হলে null
function parseDomains(raw: string): string[] | null {
  const list = [
    ...new Set(
      String(raw ?? "")
        .split(/[\s,]+/)
        .map((s) => s.trim().toLowerCase().replace(/^@/, ""))
        .filter(Boolean)
    ),
  ];
  if (list.length === 0) return [];
  if (list.length > 10) return null;
  const ok = list.every((d) => /^([a-z0-9-]+\.)+[a-z]{2,}$/.test(d) && !PUBLIC_DOMAINS.includes(d));
  return ok ? list : null;
}

const DOMAIN_ERROR =
  "Domain ঠিক নেই। কমা দিয়ে লেখো (যেমন buet.ac.bd), অথবা খালি রাখো। gmail.com-এর মতো সাধারণ domain চলবে না";

export async function addUniversity(input: {
  name: string;
  shortName?: string;
  type?: string;
  slug: string;
  domains: string;
}): Promise<Result> {
  const admin = await requireAdmin();
  if (!admin) return DENIED;

  const name = String(input?.name ?? "").trim();
  const shortName = String(input?.shortName ?? "").trim().slice(0, 20);
  const type = ["public", "private", "other"].includes(String(input?.type)) ? String(input.type) : "other";
  const slug = String(input?.slug ?? "").trim().toLowerCase();

  if (name.length < 2 || name.length > 120) return { ok: false, error: "University-র নাম লেখো" };
  if (!/^[a-z0-9-]{2,30}$/.test(slug) || RESERVED_SLUGS.includes(slug)) {
    return {
      ok: false,
      error: "Slug শুধু ছোট হাতের ইংরেজি অক্ষর, সংখ্যা ও হাইফেন (২–৩০ অক্ষর), আর সংরক্ষিত নাম চলবে না",
    };
  }
  const domains = parseDomains(input?.domains);
  if (!domains) return { ok: false, error: DOMAIN_ERROR };

  await connectDB();
  try {
    await University.create({ name, shortName, type, slug, domains });
  } catch (e) {
    if ((e as { code?: number })?.code === 11000) {
      return { ok: false, error: "এই slug বা domain আগেই অন্য university-তে আছে" };
    }
    console.error("addUniversity error:", e);
    return { ok: false, error: "University যোগ করা যায়নি" };
  }

  revalidatePath("/admin");
  return { ok: true };
}

export async function setUniversityActive(id: string, active: boolean): Promise<Result> {
  const admin = await requireAdmin();
  if (!admin) return DENIED;
  if (!isValidObjectId(id)) return { ok: false, error: "University পাওয়া যায়নি" };

  await connectDB();
  const res = await University.updateOne({ _id: id }, { active });
  if (res.matchedCount === 0) return { ok: false, error: "University পাওয়া যায়নি" };

  revalidatePath("/admin");
  return { ok: true };
}

export async function updateUniversityDomains(id: string, domains: string): Promise<Result> {
  const admin = await requireAdmin();
  if (!admin) return DENIED;
  if (!isValidObjectId(id)) return { ok: false, error: "University পাওয়া যায়নি" };

  const list = parseDomains(domains);
  if (!list) return { ok: false, error: DOMAIN_ERROR };

  await connectDB();
  try {
    const res = await University.updateOne({ _id: id }, { domains: list });
    if (res.matchedCount === 0) return { ok: false, error: "University পাওয়া যায়নি" };
  } catch (e) {
    if ((e as { code?: number })?.code === 11000) {
      return { ok: false, error: "এই domain অন্য university-তে আগেই আছে" };
    }
    return { ok: false, error: "Domain বদলানো যায়নি" };
  }

  revalidatePath("/admin");
  return { ok: true };
}

// বাংলাদেশের university-র তালিকা ঢোকানো। যা আছে তা বদলায় না, তাই বারবার চাপলেও নিরাপদ
export async function seedBangladeshUniversities(): Promise<
  { ok: true; added: number; existing: number } | { ok: false; error: string }
> {
  const admin = await requireAdmin();
  if (!admin) return DENIED;

  await connectDB();
  try {
    // ১) নতুনগুলো ঢোকানো
    const insertOps = BD_UNIVERSITIES.map((u) => ({
      updateOne: {
        filter: { slug: u.slug },
        update: {
          $setOnInsert: {
            name: u.name,
            shortName: u.shortName,
            type: u.type,
            slug: u.slug,
            domains: [],
            active: true,
          },
        },
        upsert: true,
      },
    }));
    const res = await University.bulkWrite(insertOps, { ordered: false });

    // ২) আগে থেকে থাকা (যেমন নিজে যোগ করা) university-তে সংক্ষিপ্ত নাম ও ধরন বসানো
    await University.bulkWrite(
      BD_UNIVERSITIES.map((u) => ({
        updateOne: {
          filter: { slug: u.slug, shortName: { $exists: false } },
          update: { $set: { shortName: u.shortName, type: u.type } },
        },
      })),
      { ordered: false }
    );

    revalidatePath("/admin");
    revalidatePath("/verify-university");
    const added = res.upsertedCount ?? 0;
    return { ok: true, added, existing: BD_UNIVERSITIES.length - added };
  } catch (e) {
    console.error("seed error:", e);
    if ((e as { code?: number })?.code === 11000 || /E11000/.test(String((e as Error)?.message))) {
      return {
        ok: false,
        error: "পুরনো domains index আটকাচ্ছে। আগে drop-old-index.mjs script চালিয়ে dev server restart করো",
      };
    }
    return { ok: false, error: "তালিকা ঢোকানো যায়নি" };
  }
}