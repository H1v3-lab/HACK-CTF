import Link from "next/link";
import GlitchText from "@/components/ui/GlitchText";
import { createClient } from "@/lib/supabase/server";

export default async function AdminChallengesPage() {
  const supabase = await createClient();

  const { data: challenges, error } = await supabase
    .from("challenges")
    .select("id, title, points, difficulty, is_active, solves, deleted_at, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <div className="cyber-card rounded-sm p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <GlitchText
            as="h1"
            color="cyan"
            className="text-2xl font-bold tracking-widest"
            animate
          >
            CHALLENGES
          </GlitchText>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Create, edit, activate/deactivate, soft-delete.
          </p>
        </div>

        <Link
          href="/admin/challenges/new"
          className="border border-[var(--cyber-green)] text-[var(--cyber-green)] px-3 py-2 text-xs tracking-widest hover:bg-[rgba(0,255,65,0.08)]"
        >
          + NEW
        </Link>
      </div>

      {error && (
        <p className="mt-4 text-xs text-red-400">Failed: {error.message}</p>
      )}

      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-[var(--text-muted)] tracking-widest border-b border-[var(--border-color)]">
              <th className="text-left px-3 py-2">TITLE</th>
              <th className="text-right px-3 py-2">PTS</th>
              <th className="text-left px-3 py-2">DIFF</th>
              <th className="text-right px-3 py-2">SOLVES</th>
              <th className="text-left px-3 py-2">STATUS</th>
              <th className="text-right px-3 py-2">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {(challenges ?? []).map((c) => (
              <tr
                key={c.id}
                className="border-b border-[var(--border-color)] hover:bg-[rgba(255,255,255,0.02)]"
              >
                <td className="px-3 py-2 font-bold">{c.title}</td>
                <td className="px-3 py-2 text-right font-mono">{c.points}</td>
                <td className="px-3 py-2">{c.difficulty}</td>
                <td className="px-3 py-2 text-right font-mono">{c.solves}</td>
                <td className="px-3 py-2">
                  {c.deleted_at ? (
                    <span className="text-red-400">DELETED</span>
                  ) : c.is_active ? (
                    <span className="text-[var(--cyber-green)]">ACTIVE</span>
                  ) : (
                    <span className="text-[var(--text-muted)]">INACTIVE</span>
                  )}
                </td>
                <td className="px-3 py-2 text-right">
                  <Link
                    className="text-[var(--cyber-cyan)] hover:neon-cyan"
                    href={`/admin/challenges/${c.id}`}
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {challenges?.length === 0 && (
          <div className="text-sm text-[var(--text-muted)] py-8">
            No challenges.
          </div>
        )}
      </div>
    </div>
  );
}
