import Image from "next/image";
import Link from "next/link";
import { SITE } from "@/lib/site";

export default function Logo({ className = "h-11 md:h-14" }: { className?: string }) {
  return (
    <Link href="/" aria-label={SITE.name} className="flex shrink-0 items-center">
      <Image
        src={SITE.logo}
        alt={SITE.name}
        width={420}
        height={126}
        priority
        className={`${className} w-auto dark:hue-rotate-180 dark:invert`}
      />
    </Link>
  );
}