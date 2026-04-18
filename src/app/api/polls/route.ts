import { NextResponse } from "next/server";
import { createPoll } from "@/lib/polls";

export const dynamic = "force-dynamic";

function unwrapPg(e: unknown): { message: string; code?: string } {
  let cur: unknown = e;
  const seen = new Set<unknown>();
  while (cur && typeof cur === "object" && !seen.has(cur)) {
    seen.add(cur);
    const o = cur as { code?: unknown; message?: unknown; cause?: unknown };
    if (typeof o.code === "string") {
      return {
        code: o.code,
        message: typeof o.message === "string" ? o.message : String(e),
      };
    }
    cur = o.cause;
  }
  if (e instanceof Error) return { message: e.message };
  return { message: String(e) };
}

function pollPostErrorResponse(e: unknown) {
  const { message, code } = unwrapPg(e);
  const lower = message.toLowerCase();

  if (
    message.includes("DATABASE_URL is not set") ||
    lower.includes("password authentication failed") ||
    code === "28P01"
  ) {
    return NextResponse.json(
      {
        error: "数据库连接未配置或认证失败",
        hint: "在部署环境设置 DATABASE_URL（或 Vercel Postgres 的 POSTGRES_URL），并确保与本地 db:push 使用的是同一数据库。",
      },
      { status: 500 },
    );
  }

  if (
    code === "42P01" ||
    lower.includes("relation") ||
    lower.includes("does not exist")
  ) {
    return NextResponse.json(
      {
        error: "数据库表尚未创建",
        hint: "在已配置 DATABASE_URL 的机器上运行：npm run db:push",
      },
      { status: 500 },
    );
  }

  console.error(e);
  const devHint =
    process.env.NODE_ENV !== "production" ? message || undefined : undefined;
  return NextResponse.json(
    { error: "创建失败", ...(devHint ? { hint: devHint } : {}) },
    { status: 500 },
  );
}

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
    return pollPostErrorResponse(e);
  }
}
