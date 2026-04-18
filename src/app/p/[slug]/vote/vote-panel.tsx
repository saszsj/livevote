"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type OptionRow = { id: string; label: string; count: number };

type ResultsPayload = { title: string; options: OptionRow[] };

export function VotePanel({
  slug,
  hasVoted: initialHasVoted,
  initial,
}: {
  slug: string;
  hasVoted: boolean;
  initial: ResultsPayload;
}) {
  const [data, setData] = useState<ResultsPayload>(initial);
  const [hasVoted, setHasVoted] = useState(initialHasVoted);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const fetchResults = useCallback(async () => {
    try {
      const res = await fetch(`/api/polls/${slug}/results`, {
        cache: "no-store",
      });
      if (!res.ok) return;
      const json = (await res.json()) as ResultsPayload;
      setData(json);
    } catch {
      /* ignore */
    }
  }, [slug]);

  useEffect(() => {
    const boot = window.setTimeout(() => void fetchResults(), 0);
    const id = window.setInterval(() => void fetchResults(), 2000);
    return () => {
      window.clearTimeout(boot);
      window.clearInterval(id);
    };
  }, [fetchResults]);

  async function vote(optionId: string) {
    setErr(null);
    setMessage(null);
    setSubmitting(optionId);
    try {
      const res = await fetch(`/api/polls/${slug}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ optionId }),
      });
      const body = (await res.json()) as { error?: string };
      if (res.status === 409) {
        setHasVoted(true);
        setMessage("您已投过票");
        void fetchResults();
        return;
      }
      if (!res.ok) {
        setErr(body.error ?? "投票失败");
        return;
      }
      setHasVoted(true);
      setMessage("投票成功，感谢参与！");
      void fetchResults();
    } finally {
      setSubmitting(null);
    }
  }

  const total = data.options.reduce((s, o) => s + o.count, 0);

  return (
    <main className="mx-auto flex min-h-full max-w-lg flex-col gap-8 px-4 py-12">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">{data.title}</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          {hasVoted
            ? "您已完成投票，下方为当前结果（自动刷新）。"
            : "请选择一项提交（每人仅限一票）。"}
        </p>
      </header>

      {message ? (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
          {message}
        </p>
      ) : null}
      {err ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {err}
        </p>
      ) : null}

      {!hasVoted ? (
        <div className="flex flex-col gap-3">
          {data.options.map((o) => (
            <button
              key={o.id}
              type="button"
              disabled={Boolean(submitting)}
              onClick={() => vote(o.id)}
              className="rounded-2xl border-2 border-zinc-300 bg-white px-4 py-5 text-left text-lg font-medium transition hover:border-foreground hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800"
            >
              {submitting === o.id ? "提交中…" : o.label}
            </button>
          ))}
        </div>
      ) : null}

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          当前排行
        </h2>
        {[...data.options]
          .sort((a, b) => b.count - a.count)
          .map((o, i) => (
            <div
              key={o.id}
              className="flex items-center justify-between rounded-xl border border-zinc-200 px-4 py-3 dark:border-zinc-800"
            >
              <span className="font-medium">
                <span className="mr-2 tabular-nums text-zinc-400">{i + 1}.</span>
                {o.label}
              </span>
              <span className="tabular-nums text-zinc-600 dark:text-zinc-400">
                {o.count} 票
              </span>
            </div>
          ))}
        <p className="text-xs text-zinc-500">共 {total} 票 · 每 2 秒刷新</p>
      </section>

      <p className="text-sm text-zinc-500">
        <Link href="/create" className="underline">
          去创建新投票
        </Link>
      </p>
    </main>
  );
}
