"use client";

import QRCode from "react-qr-code";
import { useCallback, useEffect, useState } from "react";

type OptionRow = { id: string; label: string; count: number };

type ResultsPayload = { title: string; options: OptionRow[] };

export function HostLive({
  slug,
  voteUrl,
}: {
  slug: string;
  voteUrl: string;
}) {
  const [data, setData] = useState<ResultsPayload | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);

  const fetchResults = useCallback(async () => {
    try {
      const res = await fetch(`/api/polls/${slug}/results`, {
        cache: "no-store",
      });
      if (!res.ok) {
        setErr("加载结果失败");
        return;
      }
      const json = (await res.json()) as ResultsPayload;
      setData(json);
      setErr(null);
      setLastFetch(new Date());
    } catch {
      setErr("网络错误");
    }
  }, [slug]);

  useEffect(() => {
    const boot = window.setTimeout(() => void fetchResults(), 0);
    const id = window.setInterval(() => void fetchResults(), 1500);
    return () => {
      window.clearTimeout(boot);
      window.clearInterval(id);
    };
  }, [fetchResults]);

  const total =
    data?.options.reduce((s, o) => s + o.count, 0) ?? 0;

  return (
    <main className="mx-auto flex min-h-full max-w-2xl flex-col gap-10 px-4 py-10">
      <header>
        <p className="text-sm font-medium text-zinc-500">主持页 · 请勿投屏给投票人此完整页面（含地址栏）</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          {data?.title ?? "加载中…"}
        </h1>
        {lastFetch ? (
          <p className="mt-1 text-xs text-zinc-500">
            上次刷新：{lastFetch.toLocaleTimeString("zh-CN")}
          </p>
        ) : null}
      </header>

      {err ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {err}
        </p>
      ) : null}

      <section className="flex flex-col items-center gap-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-8 dark:border-zinc-800 dark:bg-zinc-900/40">
        <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
          扫码投票
        </p>
        <div className="rounded-xl bg-white p-4 shadow-sm dark:bg-white">
          <QRCode value={voteUrl} size={220} />
        </div>
        <p className="break-all text-center text-xs text-zinc-500">{voteUrl}</p>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">实时得票</h2>
        <div className="flex flex-col gap-4">
          {(data?.options ?? []).map((o) => {
            const pct = total > 0 ? Math.round((o.count / total) * 1000) / 10 : 0;
            return (
              <div key={o.id} className="flex flex-col gap-1">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{o.label}</span>
                  <span className="tabular-nums text-zinc-600 dark:text-zinc-400">
                    {o.count} 票 · {pct}%
                  </span>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                  <div
                    className="h-full rounded-full bg-foreground transition-[width] duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        <p className="text-sm text-zinc-500">共 {total} 票</p>
      </section>
    </main>
  );
}
