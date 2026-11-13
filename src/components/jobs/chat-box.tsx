"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import type { MessageDTO } from "@/lib/chat";
import type { WorkMode } from "@/lib/constants";
import { toast } from "react-toastify";
import { Spinner } from "@/components/skeletons";
const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200";

const linkBtn =
  "rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100";

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

export default function ChatBox({
  jobId,
  myId,
  otherName,
  mode,
  canSend,
}: {
  jobId: string;
  myId: string;
  otherName: string;
  mode: WorkMode;
  canSend: boolean;
}) {
  const [messages, setMessages] = useState<MessageDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [meetingUrl, setMeetingUrl] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  const lastRef = useRef<string | undefined>(undefined);
  const boxRef = useRef<HTMLDivElement>(null);

  // advance = true শুধু poll-এর ফলাফলে। নিজের পাঠানো message-এ সময় এগোলে
  // অন্যের আগের message বাদ পড়ে যেত
  const merge = useCallback((incoming: MessageDTO[], advance: boolean) => {
    if (incoming.length === 0) return;
    setMessages((prev) => {
      const seen = new Set(prev.map((m) => m.id));
      const fresh = incoming.filter((m) => !seen.has(m.id));
      if (fresh.length === 0) return prev;
      return [...prev, ...fresh].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    });
    if (advance) lastRef.current = incoming[incoming.length - 1].createdAt;
  }, []);

  const poll = useCallback(async () => {
    try {
      const qs = lastRef.current ? `?after=${encodeURIComponent(lastRef.current)}` : "";
      const res = await fetch(`/api/chat/${jobId}${qs}`, { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as { messages: MessageDTO[] };
      merge(data.messages, true);
    } catch {
      // নেটওয়ার্ক সমস্যা হলে পরের poll-এ আবার চেষ্টা হবে
    } finally {
      setLoading(false);
    }
  }, [jobId, merge]);

  useEffect(() => {
    poll();
    const t = setInterval(() => {
      if (document.visibilityState === "visible") poll();
    }, 4000);
    return () => clearInterval(t);
  }, [poll]);

  // নতুন message এলে chat box নিজে নিচে নামবে (পুরো পেজ না)
  useEffect(() => {
    const el = boxRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  async function post(payload: { text?: string; meetingUrl?: string }) {
    setError("");
    setSending(true);
    try {
      const res = await fetch(`/api/chat/${jobId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "পাঠানো যায়নি");
        return false;
      }
      merge([data.message as MessageDTO], false);
      return true;
      } catch {
        toast.error("নেটওয়ার্ক সমস্যা, আবার চেষ্টা করো");
        return false;
      } finally {
      setSending(false);
    }
  }

  async function sendText(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    if (await post({ text })) setText("");
  }

  async function sendMeeting(e: React.FormEvent) {
    e.preventDefault();
    if (!meetingUrl.trim()) return;
    if (await post({ meetingUrl })) setMeetingUrl("");
  }

  const latestMeeting = [...messages].reverse().find((m) => m.kind === "meeting");
  const showMeetingTools = canSend && mode !== "offline";

  return (
    <section className="space-y-3 rounded-2xl border bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold">💬 {otherName}-এর সাথে chat</h2>

      {latestMeeting?.meetingUrl && (
        <div className="flex items-center justify-between gap-3 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900">
          <span>📹 সর্বশেষ meeting link</span>
          <a
            href={latestMeeting.meetingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
          >
            Join করো
          </a>
        </div>
      )}

      <div ref={boxRef} className="h-80 space-y-3 overflow-y-auto rounded-xl bg-slate-50 p-3">
        {loading ? (
          <div className="flex justify-center py-6"><Spinner /></div>
        ) : messages.length === 0 ? (
          <p className="text-sm text-slate-500">
            এখনো কোনো message নেই। প্রথম message-টা তুমিই পাঠাও 👋
          </p>
        ) : (
          messages.map((m) => {
            const mine = m.senderId === myId;
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                    mine ? "bg-indigo-600 text-white" : "bg-white text-slate-800 ring-1 ring-slate-200"
                  }`}
                >
                  {m.kind === "meeting" && m.meetingUrl ? (
                    <div className="space-y-1">
                      <p className="font-medium">📹 Meeting link</p>
                      <a
                        href={m.meetingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`break-all underline ${mine ? "text-indigo-100" : "text-indigo-600"}`}
                      >
                        {m.meetingUrl}
                      </a>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap break-words">{m.text}</p>
                  )}
                  <p className={`mt-1 text-[10px] ${mine ? "text-indigo-200" : "text-slate-400"}`}>
                    {fmtTime(m.createdAt)}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {showMeetingTools && (
        <div className="space-y-2 rounded-xl bg-slate-50 p-3">
          <p className="text-sm font-medium">📹 Online meeting</p>
          <div className="flex flex-wrap gap-2">
            <a href="https://meet.new" target="_blank" rel="noopener noreferrer" className={linkBtn}>
              Google Meet তৈরি করো
            </a>
            <a
              href="https://zoom.us/start/videomeeting"
              target="_blank"
              rel="noopener noreferrer"
              className={linkBtn}
            >
              Zoom শুরু করো
            </a>
          </div>
          <form onSubmit={sendMeeting} className="flex gap-2">
            <input
              className={inputClass}
              value={meetingUrl}
              onChange={(e) => setMeetingUrl(e.target.value)}
              placeholder="তৈরি করা meeting link এখানে paste করো"
            />
            <Button type="submit" variant="outline" disabled={sending || !meetingUrl.trim()}>
              পাঠাও
            </Button>
          </form>
          <p className="text-xs text-slate-500">শুধু Google Meet ও Zoom-এর link গ্রহণযোগ্য।</p>
        </div>
      )}

      {canSend ? (
        <form onSubmit={sendText} className="flex gap-2">
          <input
            className={inputClass}
            value={text}
            maxLength={1000}
            onChange={(e) => setText(e.target.value)}
            placeholder="Message লেখো..."
          />
          <Button type="submit" disabled={sending || !text.trim()}>
            পাঠাও
          </Button>
        </form>
      ) : (
        <p className="text-sm text-slate-500">কাজ শেষ হয়েছে, তাই chat এখন শুধু পড়ার জন্য।</p>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
    </section>
  );
}