import { connection } from "next/server";
import { connectDB } from "@/lib/db";
import University from "@/models/University";

export type UniversityDTO = {
  id: string;
  name: string;
  shortName: string;
  type: string;
  slug: string;
  domains: string[];
  active: boolean;
};

// Verified সদস্য: flag সত্যি এবং আসল university নির্ধারিত
export function isVerifiedMember(user: {
  university?: string | null;
  isUniversityVerified?: boolean | null;
}) {
  return (
    user.isUniversityVerified === true && !!user.university && user.university !== "default"
  );
}

export function parseEmail(raw: string) {
  const email = raw.trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  return { email, domain: email.slice(email.lastIndexOf("@") + 1) };
}

// Domain মেলানো: buet.ac.bd বা *.buet.ac.bd। evilbuet.ac.bd মিলবে না
export async function matchUniversity(domain: string) {
  await connectDB();
  const unis = await University.find({ active: true }).lean();

  let best: { slug: string; name: string } | null = null;
  let bestLen = 0;
  for (const u of unis) {
    for (const d of u.domains as string[]) {
      if ((domain === d || domain.endsWith("." + d)) && d.length > bestLen) {
        best = { slug: u.slug as string, name: u.name as string };
        bestLen = d.length;
      }
    }
  }
  return best;
}

export async function getUniversityNames(slugs: string[]): Promise<Record<string, string>> {
  const unique = [...new Set(slugs.filter((s) => s && s !== "default"))];
  if (unique.length === 0) return {};
  await connectDB();
  const rows = await University.find({ slug: { $in: unique } }).select("slug name").lean();
  return Object.fromEntries(rows.map((r) => [r.slug as string, r.name as string]));
}

export async function listActiveUniversities(): Promise<UniversityDTO[]> {
  await connection();
  await connectDB();
  const rows = await University.find({ active: true }).sort({ name: 1 }).lean();
  return rows.map((r) => ({
    id: String(r._id),
    name: r.name,
    slug: r.slug,
    domains: r.domains as string[],
    active: !!r.active,
    shortName: (r.shortName as string) ?? "",
    type: (r.type as string) ?? "other",
  }));
}