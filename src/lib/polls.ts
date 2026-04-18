import { and, asc, count, eq } from "drizzle-orm";
import { customAlphabet } from "nanoid";
import { getDb, pollOptions, polls, votes } from "@/db";
import { randomAdminToken } from "@/lib/crypto";

const slugAlphabet = customAlphabet(
  "0123456789abcdefghijklmnopqrstuvwxyz",
  10,
);

export async function getPollBySlug(slug: string) {
  const db = getDb();
  const rows = await db
    .select()
    .from(polls)
    .where(eq(polls.slug, slug))
    .limit(1);
  return rows[0] ?? null;
}

export type PollOptionResult = {
  id: string;
  label: string;
  count: number;
};

export async function getPollResultsBySlug(
  slug: string,
): Promise<{ title: string; options: PollOptionResult[] } | null> {
  const poll = await getPollBySlug(slug);
  if (!poll) return null;

  const db = getDb();
  const options = await db
    .select()
    .from(pollOptions)
    .where(eq(pollOptions.pollId, poll.id))
    .orderBy(asc(pollOptions.sortOrder));

  const countRows = await db
    .select({
      pollOptionId: votes.pollOptionId,
      n: count(),
    })
    .from(votes)
    .where(eq(votes.pollId, poll.id))
    .groupBy(votes.pollOptionId);

  const map = new Map(
    countRows.map((r) => [r.pollOptionId, Number(r.n)] as const),
  );

  return {
    title: poll.title,
    options: options.map((o) => ({
      id: o.id,
      label: o.label,
      count: map.get(o.id) ?? 0,
    })),
  };
}

export async function createPoll(title: string, labels: string[]) {
  const db = getDb();
  const adminToken = randomAdminToken();

  for (let attempt = 0; attempt < 8; attempt++) {
    const slug = slugAlphabet();
    try {
      const [poll] = await db
        .insert(polls)
        .values({ slug, title, adminToken })
        .returning();

      await db.insert(pollOptions).values(
        labels.map((label, sortOrder) => ({
          pollId: poll.id,
          label,
          sortOrder,
        })),
      );

      return { slug, adminToken };
    } catch (e) {
      const err = e as { code?: unknown; message?: unknown; cause?: unknown };
      const code =
        typeof err?.code === "string"
          ? err.code
          : typeof (err?.cause as { code?: unknown } | undefined)?.code ===
              "string"
            ? (err.cause as { code: string }).code
            : null;

      // Postgres unique_violation. We only want to retry on slug collisions.
      // Anything else (missing tables, auth, bad DATABASE_URL) should surface.
      if (code === "23505") continue;

      throw e;
    }
  }

  throw new Error("Failed to create poll");
}

export async function assertOptionBelongsToPoll(
  slug: string,
  optionId: string,
): Promise<{ pollId: string } | null> {
  const poll = await getPollBySlug(slug);
  if (!poll) return null;
  const db = getDb();
  const rows = await db
    .select({ id: pollOptions.id })
    .from(pollOptions)
    .where(
      and(eq(pollOptions.pollId, poll.id), eq(pollOptions.id, optionId)),
    )
    .limit(1);
  if (!rows[0]) return null;
  return { pollId: poll.id };
}
