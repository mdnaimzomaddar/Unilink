"use client";

import { useState } from "react";
import { IconPlay } from "@/components/icons";

export default function TutorialVideo({ youtubeId }: { youtubeId?: string }) {
  const [playing, setPlaying] = useState(false);
  const valid = !!youtubeId && /^[\w-]{11}$/.test(youtubeId);

  if (!valid) {
    return (
      <div className="flex aspect-video w-full flex-col items-center justify-center gap-3 rounded-2xl border border-dashed bg-white text-center text-slate-500">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
          <IconPlay className="h-6 w-6" />
        </span>
        <p className="text-sm">Tutorial ভিডিও শীঘ্রই আসছে</p>
      </div>
    );
  }

  if (!playing) {
    return (
      <button
        type="button"
        onClick={() => setPlaying(true)}
        aria-label="Tutorial ভিডিও চালাও"
        className="group relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 shadow-lg"
      >
        <span className="flex h-20 w-20 items-center justify-center rounded-full bg-white/95 text-indigo-600 shadow-xl transition group-hover:scale-110">
          <IconPlay className="ml-1 h-8 w-8" />
        </span>
        <span className="absolute bottom-4 left-4 rounded-lg bg-black/40 px-3 py-1 text-sm text-white">
          Unilink কীভাবে ব্যবহার করবে
        </span>
      </button>
    );
  }

  return (
    <iframe
      className="aspect-video w-full rounded-2xl shadow-lg"
      src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&rel=0`}
      title="Unilink tutorial"
      allow="accelerometer; autoplay; encrypted-media; picture-in-picture"
      allowFullScreen
    />
  );
}