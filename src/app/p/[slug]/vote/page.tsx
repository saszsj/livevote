import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { getPollBySlug, getPollResultsBySlug } from "@/lib/polls";
import { votedCookieName } from "@/lib/vote-cookie";
import { VotePanel } from "./vote-panel";

export default async function VotePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const poll = await getPollBySlug(slug);
  if (!poll) notFound();

  const cookieStore = await cookies();
  const hasVoted = Boolean(cookieStore.get(votedCookieName(slug))?.value);

  const initial = await getPollResultsBySlug(slug);
  if (!initial) notFound();

  return <VotePanel slug={slug} hasVoted={hasVoted} initial={initial} />;
}
