import type { JobType, WorkMode } from "@/lib/constants";
import { IconBoth, IconGem, IconMapPin, IconMedal, IconOnline } from "@/components/icons";

export function JobTypeIcon({ type, className }: { type: JobType; className?: string }) {
  return type === "premium" ? <IconGem className={className} /> : <IconMedal className={className} />;
}

export function ModeIcon({ mode, className }: { mode: WorkMode; className?: string }) {
  if (mode === "offline") return <IconMapPin className={className} />;
  if (mode === "both") return <IconBoth className={className} />;
  return <IconOnline className={className} />;
}