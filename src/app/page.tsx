import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-full max-w-lg flex-col justify-center gap-8 px-4 py-20">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">现场投票</h1>
        <p className="mt-3 text-zinc-600 dark:text-zinc-400">
          创建投票、生成二维码、观众扫码实时投票与展示结果。部署在 Vercel，数据存放在 Postgres（如 Neon）。
        </p>
      </div>
      <Link
        href="/create"
        className="inline-flex items-center justify-center rounded-xl bg-foreground px-5 py-3 text-base font-medium text-background"
      >
        创建投票
      </Link>
    </main>
  );
}
