import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { createMessage, getChatAccess, listMessages } from "@/lib/chat";

const noStore = { "Cache-Control": "no-store" };

// /api/chat/<jobId> থেকে শেষ অংশটা
function jobIdFrom(req: Request) {
  return new URL(req.url).pathname.split("/").filter(Boolean).pop() ?? "";
}

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "আগে login করো" }, { status: 401, headers: noStore });
  }

  const access = await getChatAccess(jobIdFrom(req), session.user.id);
  if (!access) {
    return NextResponse.json({ error: "Chat পাওয়া যায়নি" }, { status: 403, headers: noStore });
  }

  const after = new URL(req.url).searchParams.get("after") ?? undefined;
  const messages = await listMessages(access, after);
  return NextResponse.json({ messages }, { headers: noStore });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "আগে login করো" }, { status: 401, headers: noStore });
  }

  const access = await getChatAccess(jobIdFrom(req), session.user.id);
  if (!access) {
    return NextResponse.json({ error: "Chat পাওয়া যায়নি" }, { status: 403, headers: noStore });
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "ভুল অনুরোধ" }, { status: 400, headers: noStore });
  }

  const res = await createMessage(access, session.user.name, body);
  if (!res.ok) {
    return NextResponse.json({ error: res.error }, { status: 400, headers: noStore });
  }
  return NextResponse.json({ message: res.message }, { headers: noStore });
}