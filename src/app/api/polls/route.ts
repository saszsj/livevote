import { NextResponse } from "next/server";
import { createPoll } from "@/lib/polls";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const obj = body as { title?: unknown; options?: unknown };
  const title = String(obj.title ?? "").trim();
  const raw = Array.isArray(obj.options) ? obj.options : [];
  const labels = raw.map((o) => String(o).trim()).filter(Boolean);

  if (!title) {
    return NextResponse.json({ error: "需要填写投票标题" }, { status: 400 });
  }
  if (labels.length < 2) {
    return NextResponse.json(
      { error: "至少需要两个有效选项" },
      { status: 400 },
    );
  }

  try {
    const { slug, adminToken } = await createPoll(title, labels);
    return NextResponse.json({ slug, adminToken });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "创建失败" }, { status: 500 });
  }
}
