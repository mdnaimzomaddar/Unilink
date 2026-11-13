"use server";

import { isValidObjectId } from "mongoose";
import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
import University from "@/models/University";

type Result = { ok: true } | { ok: false; error: string };

const DENIED: Result = { ok: false, error: "এই কাজের অনুমতি তোমার নেই" };

// subdomain-এর জন্য ভবিষ্যতে এগুলো দরকার হবে
const RESERVED_SLUGS = ["www", "admin", "api", "app", "default", "mail", "static", "assets", "dashboard"];
// এগুলো যেকোনো মানুষ বানাতে পারে, তাই university domain হিসেবে গ্রহণযোগ্য না
const PUBLIC_DOMAINS = [
  "gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "live.com",
  "icloud.com", "proton.me", "protonmail.com", "aol.com",
];

function parseDomains(raw: string): string[] | null {
  const list = [
    ...new Set(
      String(raw ?? "")
        .split(/[\s,]+/)
        .map((s) => s.trim().toLowerCase().replace(/^@/, ""))
        .filter(Boolean)
    ),
  ];
  if (list.length === 0 || list.length > 10) return null;
  const ok = list.every((d) => /^([a-z0-9-]+\.)+[a-z]{2,}$/.test(d) && !PUBLIC_DOMAINS.includes(d));
  return ok ? list : null;
}

const DOMAIN_ERROR =
  "Domain ঠিক নেই। কমা দিয়ে লেখো (যেমন buet.ac.bd)। gmail.com-এর মতো সাধারণ domain চলবে না";

export async function addUniversity(input: {
  name: string;
  slug: string;
  domains: string;
}): Promise<Result> {
  const admin = await requireAdmin();
  if (!admin) return DENIED;

  const name = String(input?.name ?? "").trim();
  const slug = String(input?.slug ?? "").trim().toLowerCase();
  if (name.length < 2 || name.length > 120) return { ok: false, error: "University-র নাম লেখো" };
  if (!/^[a-z0-9-]{2,30}$/.test(slug) || RESERVED_SLUGS.includes(slug)) {
    return { ok: false, error: "Slug শুধু ছোট হাতের ইংরেজি অক্ষর, সংখ্যা ও হাইফেন (২–৩০ অক্ষর), আর সংরক্ষিত নাম চলবে না" };
  }
  const domains = parseDomains(input?.domains);
  if (!domains) return { ok: false, error: DOMAIN_ERROR };

  await connectDB();
  try {
    await University.create({ name, slug, domains });
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