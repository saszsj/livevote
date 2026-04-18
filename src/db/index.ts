import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

type Db = ReturnType<typeof drizzle<typeof schema>>;

let cached: Db | null = null;

export function getDb(): Db {
  const url =
    process.env.DATABASE_URL ??
    process.env.POSTGRES_URL ??
    process.env.POSTGRES_PRISMA_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set (also checked POSTGRES_URL / POSTGRES_PRISMA_URL)",
    );
  }
  if (!cached) {
    const sql = neon(url);
    cached = drizzle(sql, { schema });
  }
  return cached;
}

export * from "./schema";
