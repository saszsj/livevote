import { getPollBySlug } from "@/lib/polls";
import { safeEqualString } from "@/lib/crypto";
import { getPublicOrigin } from "@/lib/public-url";
import { HostLive } from "./host-live";

export default async function HostPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ t?: string }>;
}) {
  const { slug } = await params;
  const { t } = await searchParams;

  if (!t) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16">
        <p className="text-lg leading-relaxed">
          缺少主持密钥。请从{" "}
          <a href="/create" className="underline">
            创建页
          </a>{" "}
          完成创建后自动进入。
        </p>
      </main>
    );
  }

  const poll = await getPollBySlug(slug);
  if (!poll || !safeEqualString(poll.adminToken, t)) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16">
        <p className="text-lg leading-relaxed">无效的主持链接。</p>
      </main>
    );
  }

  const voteUrl = `${getPublicOrigin()}/p/${slug}/vote`;

  return <HostLive slug={slug} voteUrl={voteUrl} />;
}
