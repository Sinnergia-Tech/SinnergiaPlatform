import { listMatches } from "@/lib/data";
import { MatchesBoard } from "@/components/admin/MatchesBoard";

export const dynamic = "force-dynamic";

export default async function MatchesPage() {
  const list = await listMatches();
  return <MatchesBoard initial={list} />;
}
