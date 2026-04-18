# 现场投票（Vercel + Postgres）

创建投票 → 主持页二维码 → 观众扫码投票 → 主持页与投票页轮询展示实时得票。

## 本地开发

1. 复制环境变量：`cp .env.example .env.local`，填写 `DATABASE_URL`（推荐 [Neon](https://neon.tech)）。
2. 同步表结构：`npm run db:push`
3. 启动：`npm run dev`，打开 [http://localhost:3000](http://localhost:3000)

## 部署到 Vercel

1. 在 Neon（或 Vercel Postgres）创建数据库，将连接串设为 Vercel 环境变量 **`DATABASE_URL`**。
2. 设置 **`NEXT_PUBLIC_APP_URL`** 为你的生产地址（例如 `https://xxx.vercel.app`，无末尾斜杠），用于二维码中的链接。若不设置，将使用 `https://$VERCEL_URL`。
3. 连接 Git 仓库并部署；首次部署后在本地（或 CI）对同一数据库执行一次 `npm run db:push`，或在 Vercel 构建命令前加入 push（需将 `DATABASE_URL` 注入构建环境）。

技术栈：Next.js App Router、Drizzle ORM、`@neondatabase/serverless`、短轮询刷新结果。
