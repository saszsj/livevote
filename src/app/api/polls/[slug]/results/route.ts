import { NextResponse } from "next/server";
import { getPollResultsBySlug } from "@/lib/polls";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const data = await getPollResultsBySlug(slug);
  if (!data) {
    return NextResponse.json({ error: "投票不存在" }, { status: 404 });
  }
  return NextResponse.json(data);
}
