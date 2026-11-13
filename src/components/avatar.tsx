const TONES = [
  "bg-indigo-100 text-indigo-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-violet-100 text-violet-700",
  "bg-sky-100 text-sky-700",
  "bg-rose-100 text-rose-700",
];

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

export default function Avatar({
  name,
  size = "h-8 w-8",
  text = "text-xs",
}: {
  name: string;
  size?: string;
  text?: string;
}) {
  const initial = (Array.from(name.trim())[0] ?? "U").toUpperCase();
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full font-semibold ${size} ${text} ${
        TONES[hash(name) % TONES.length]
      }`}
    >
      {initial}
    </span>
  );
}