import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getDb, votes } from "@/db";
import { assertOptionBelongsToPoll } from "@/lib/polls";
import { VOTE_COOKIE_MAX_AGE, votedCookieName } from "@/lib/vote-cookie";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const cookieStore = await cookies();
  if (cookieStore.get(votedCookieName(slug))?.value) {
    return NextResponse.json({ error: "您已投过票" }, { status: 409 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const optionId = String((body as { optionId?: unknown }).optionId ?? "");
  if (!optionId) {
    return NextResponse.json({ error: "缺少选项" }, { status: 400 });
  }

  const ok = await assertOptionBelongsToPoll(slug, optionId);
  if (!ok) {
    return NextResponse.json({ error: "无效选项" }, { status: 400 });
  }

  const db = getDb();
  await db.insert(votes).values({
    pollId: ok.pollId,
    pollOptionId: optionId,
  });

  const res = NextResponse.json({ ok: true });
  res.cookies.set({
    name: votedCookieName(slug),
    value: "1",
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: VOTE_COOKIE_MAX_AGE,
  });
  return res;
}
