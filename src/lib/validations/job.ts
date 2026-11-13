import { z } from "zod";
import { CATEGORIES, JOB_TYPES, WORK_MODES } from "@/lib/constants";

export const jobSchema = z
  .object({
    mode: z.enum(WORK_MODES),
    contact: z
      .string()
      .trim()
      // .min(6, "Phone/WhatsApp নম্বর দাও (hire হলে শুধু selected জন দেখবে)")
      .max(60),
    title: z
      .string()
      .trim()
      .min(5, "Title কমপক্ষে ৫ অক্ষরের হতে হবে")
      .max(100, "Title সর্বোচ্চ ১০০ অক্ষরের হতে পারবে"),
    description: z
      .string()
      .trim()
      .min(20, "Description কমপক্ষে ২০ অক্ষরের হতে হবে")
      .max(5000, "Description সর্বোচ্চ ৫০০০ অক্ষরের হতে পারবে"),
    type: z.enum(JOB_TYPES),
    category: z.enum(CATEGORIES),
    budget: z.number().min(0, "Budget ঋণাত্মক হতে পারে না").max(10_000_000),
    skills: z
      .array(z.string().trim().min(1).max(30))
      .max(10, "সর্বোচ্চ ১০টা skill দেওয়া যাবে"),
    deadline: z.string().optional(),
  })
    .superRefine((d, ctx) => {
    if (d.mode !== "online" && d.contact.length < 6) {
      ctx.addIssue({
        code: "custom",
        path: ["contact"],
        message: "Offline job-এ Phone/WhatsApp নম্বর দাও (hire হলে শুধু selected জন দেখবে)",
      });
    }
    if (d.deadline) {
      const t = new Date(d.deadline);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (Number.isNaN(t.getTime()) || t < today) {
        ctx.addIssue({
          code: "custom",
          path: ["deadline"],
          message: "Deadline আজ বা ভবিষ্যতের তারিখ হতে হবে",
        });
      }
    }
  });

export type JobInput = z.infer<typeof jobSchema>;