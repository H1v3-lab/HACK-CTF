"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

interface ScoreboardEntry {
  id: string;
  username: string;
  avatar_url: string | null;
  score: number;
  solves: number;
  last_solve: string | null;
  position: number;
}

interface ScoreboardTableProps {
  currentUserId?: string;
}

export default function ScoreboardTable({
  currentUserId,
}: ScoreboardTableProps) {
  const [entries, setEntries] = useState<ScoreboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const supabase = createClient();

  const fetchScoreboard = useCallback(async () => {
    const { data, error } = await supabase
      .from("scoreboard")
      .select("*")
      .order("position", { ascending: true })
      .limit(100);

    if (!error && data) {
      setEntries(data as ScoreboardEntry[]);
      setLastUpdate(new Date());
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchScoreboard();

    // Real-time subscription on submissions table
    const channel = supabase
      .channel("scoreboard-updates")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "submissions" },
        () => {
          fetchScoreboard();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchScoreboard, supabase]);

  const medal = (pos: number) => {
    if (pos === 1) return "🥇";
    if (pos === 2) return "🥈";
    if (pos === 3) return "🥉";
    return null;
  };

  return (
    <div className="cyber-card rounded-sm overflow-hidden">
      {/* Table header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-color)] bg-[rgba(0,243,255,0.03)]">
        <h2 className="text-xs tracking-widest text-[var(--cyber-cyan)] font-bold">
          SCOREBOARD
        </h2>
        {lastUpdate && (
          <span className="text-[10px] text-[var(--text-muted)]">
            Updated {lastUpdate.toLocaleTimeString()}
            <span className="ml-1 inline-block w-1.5 h-1.5 rounded-full bg-[var(--cyber-green)] animate-pulse" />
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-[var(--text-muted)] text-sm">
          <span className="cursor">Loading scoreboard</span>
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-16 text-[var(--text-muted)] text-sm">
          No submissions yet. Be the first!
        </div>
      ) : (
        <table className="w-full text-xs">
          <thead>
            <tr className="text-[var(--text-muted)] tracking-widest border-b border-[var(--border-color)]">
              <th className="text-left px-4 py-2">RANK</th>
              <th className="text-left px-4 py-2">PLAYER</th>
              <th className="text-right px-4 py-2">SOLVES</th>
              <th className="text-right px-4 py-2">SCORE</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => {
              const isMe = entry.id === currentUserId;
              return (
                <tr
                  key={entry.id}
                  className={`border-b border-[var(--border-color)] transition-colors ${
                    isMe
                      ? "bg-[rgba(0,243,255,0.05)] text-[var(--cyber-cyan)]"
                      : "hover:bg-[rgba(255,255,255,0.02)] text-[var(--text-primary)]"
                  }`}
                >
                  <td className="px-4 py-2.5 font-mono">
                    {medal(entry.position) ?? (
                      <span className="text-[var(--text-muted)]">
                        #{entry.position}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 font-bold tracking-wide">
                    {entry.username}
                    {isMe && (
                      <span className="ml-2 text-[10px] text-[var(--cyber-cyan)] border border-[var(--cyber-cyan)] px-1 rounded-sm">
                        YOU
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-right text-[var(--text-muted)]">
                    {entry.solves}
                  </td>
                  <td className="px-4 py-2.5 text-right font-bold text-[var(--cyber-green)]">
                    {entry.score}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
