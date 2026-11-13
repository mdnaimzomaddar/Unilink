export const JOB_TYPES = ["silver", "golden", "premium"] as const;
export type JobType = (typeof JOB_TYPES)[number];

export const CATEGORIES = [
  "Course Help",
  "Assignment & Project",
  "Thesis & Research",
  "Coding & Tech",
  "Design & Creative",
  "Writing & Presentation",
  "Career & Admission Guidance",
  "Club & Event Work",
  "Other",
] as const;
export type Category = (typeof CATEGORIES)[number];

export const WORK_MODES = ["online", "offline", "both"] as const;
export type WorkMode = (typeof WORK_MODES)[number];

export const WORK_MODE_META: Record<WorkMode, { label: string; emoji: string; desc: string }> = {
  online: { label: "Online", emoji: "💻", desc: "Meet/Zoom/Chat-এ" },
  offline: { label: "Offline", emoji: "🏫", desc: "ক্যাম্পাসে সরাসরি (একই university)" },
  both: { label: "Online/Offline", emoji: "🔁", desc: "যেকোনোটা চলবে" },
};

// ---------- Connects ----------
export const SILVER_STARTER = { posts: 2, connects: 3 } as const;
export const SILVER_VERIFIED = { posts: 10, connects: 10 } as const;
export const CONNECTS_PER_SILVER_CREDIT = 5;

// category অনুযায়ী মূল খরচ
export const CATEGORY_CONNECT_BASE: Record<Category, number> = {
  "Course Help": 2,
  "Assignment & Project": 3,
  "Thesis & Research": 4,
  "Coding & Tech": 3,
  "Design & Creative": 2,
  "Writing & Presentation": 2,
  "Career & Admission Guidance": 2,
  "Club & Event Work": 1,
  Other: 1,
};

// Silver = ফ্রি। Golden/Premium = category base + budget অনুযায়ী বাড়তি
export function connectCost(type: JobType, category: string, budget: number) {
  if (type === "silver") return 0;
  const base = CATEGORY_CONNECT_BASE[category as Category] ?? 2;
  const tier = budget >= 5000 ? 2 : budget >= 1000 ? 1 : 0;
  return base + tier;
}

export const JOB_TYPE_META: Record<
  JobType,
  { label: string; emoji: string; desc: string; badge: string }
> = {
  silver: {
    label: "Silver",
    emoji: "🥈",
    desc: "ফ্রি কাজ, কোনো টাকা-পয়সা নেই",
    badge: "bg-slate-100 text-slate-700 ring-slate-300",
  },
  golden: {
    label: "Golden",
    emoji: "🥇",
    desc: "পেইড কাজ, budget দিতে হবে",
    badge: "bg-amber-100 text-amber-800 ring-amber-300",
  },
  premium: {
    label: "Premium",
    emoji: "💎",
    desc: "শুধু faculty post করতে পারবেন, সবাই apply করতে পারবে",
    badge: "bg-violet-100 text-violet-800 ring-violet-300",
  },
};

export function formatBudget(type: JobType, budget: number) {
  if (type === "silver") return "ফ্রি";
  if (!budget) return "আলোচনা সাপেক্ষে";
  return `৳${budget.toLocaleString("en-US")}`;
}

// ---------- Connect কেনা ----------
export const CONNECT_PACKS = [
  {id: "c5", connects: 5, price: 25 },
  { id: "c10", connects: 10, price: 50 },
  { id: "c20", connects: 20, price: 100 },
  { id: "c50", connects: 50, price: 225 },
] as const;

export const PAYMENT_METHODS = ["bkash", "nagad"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  bkash: "bKash",
  nagad: "Nagad",
};

// ---------- Report ----------
export const REPORT_REASONS = ["spam", "scam", "abuse", "inappropriate", "other"] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];
export const REPORT_REASON_LABEL: Record<ReportReason, string> = {
  spam: "Spam",
  scam: "প্রতারণা / স্ক্যাম",
  abuse: "অশালীন আচরণ / হয়রানি",
  inappropriate: "অনুপযুক্ত কনটেন্ট",
  other: "অন্য কিছু",
};