"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function CreatePollPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function setOption(i: number, v: string) {
    setOptions((prev) => prev.map((x, j) => (j === i ? v : x)));
  }

  function addOption() {
    setOptions((prev) => [...prev, ""]);
  }

  function removeOption(i: number) {
    setOptions((prev) => (prev.length <= 2 ? prev : prev.filter((_, j) => j !== i)));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/polls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, options }),
      });
      const data = (await res.json()) as {
        slug?: string;
        adminToken?: string;
        error?: string;
      };
      if (!res.ok) {
        setError(data.error ?? "创建失败");
        return;
      }
      if (data.slug && data.adminToken) {
        router.push(
          `/p/${data.slug}/host?t=${encodeURIComponent(data.adminToken)}`,
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-full max-w-lg flex-col gap-8 px-4 py-12">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">创建现场投票</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          填写标题与选项，创建后将进入主持页（含二维码与实时结果）。请勿把主持链接发给投票人。
        </p>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-6">
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium">投票标题</span>
          <input
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-base dark:border-zinc-700 dark:bg-zinc-900"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="例如：今晚最佳节目"
            required
          />
        </label>

        <div className="flex flex-col gap-3">
          <span className="text-sm font-medium">选项（至少两项）</span>
          {options.map((opt, i) => (
            <div key={i} className="flex gap-2">
              <input
                className="min-w-0 flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-base dark:border-zinc-700 dark:bg-zinc-900"
                value={opt}
                onChange={(e) => setOption(i, e.target.value)}
                placeholder={`选项 ${i + 1}`}
              />
              <button
                type="button"
                className="shrink-0 rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700"
                onClick={() => removeOption(i)}
                disabled={options.length <= 2}
              >
                删除
              </button>
            </div>
          ))}
          <button
            type="button"
            className="self-start rounded-lg border border-dashed border-zinc-400 px-3 py-2 text-sm dark:border-zinc-600"
            onClick={addOption}
          >
            + 添加选项
          </button>
        </div>

        {error ? (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-foreground px-4 py-3 text-base font-medium text-background disabled:opacity-60"
        >
          {loading ? "创建中…" : "创建并开始"}
        </button>
      </form>

      <p className="text-sm text-zinc-500">
        <Link href="/" className="underline">
          返回首页
        </Link>
      </p>
    </main>
  );
}
