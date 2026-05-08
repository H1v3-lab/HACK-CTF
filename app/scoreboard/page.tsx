"use client";

import { useEffect, useState } from "react";
import GlitchText from "@/components/ui/GlitchText";
import ScoreboardTable from "@/components/scoreboard/ScoreboardTable";

type ScoreboardEntry = {
  id: string;
  username: string;
  avatar_url: string | null;
  score: number;
  solves: number;
  last_solve: string | null;
  position: number;
};

export default function ScoreboardPage() {
  const [entries, setEntries] = useState<ScoreboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const res = await fetch("/api/scoreboard", { cache: "no-store" });
      const json = (await res.json()) as { data?: ScoreboardEntry[] };
      setEntries(json.data ?? []);
      setLoading(false);
    }

    load();
  }, []);

  return (
    <div className="flex-1 px-4 sm:px-6 lg:px-8 py-8 max-w-4xl mx-auto w-full">
      <div className="mb-8">
        <GlitchText
          as="h1"
          color="cyan"
          className="text-3xl font-bold tracking-widest"
          animate
        >
          SCOREBOARD
        </GlitchText>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Live rankings — updated periodically
        </p>
      </div>

      <ScoreboardTable entries={entries} loading={loading} />
    </div>
  );
}
