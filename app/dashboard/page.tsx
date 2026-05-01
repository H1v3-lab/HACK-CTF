"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import GlitchText from "@/components/ui/GlitchText";
import ChallengeGrid from "@/components/dashboard/ChallengeGrid";
import TerminalText from "@/components/ui/TerminalText";
import type { Challenge } from "@/lib/types";

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();

  const [userId, setUserId] = useState<string | null>(null);
  const [username, setUsername] = useState<string>("");
  const [score, setScore] = useState(0);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [solvedIds, setSolvedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth/login");
        return;
      }

      setUserId(user.id);

      // Load profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profile) {
        setUsername(profile.username);
        setScore(profile.score);
      }

      // Load challenges with category
      const { data: challs } = await supabase
        .from("challenges")
        .select("*, categories(name, color)")
        .eq("is_active", true)
        .order("points", { ascending: true });

      if (challs) setChallenges(challs as Challenge[]);

      // Load solved challenge ids
      const { data: solves } = await supabase
        .from("user_solves")
        .select("*")
        .eq("user_id", user.id);

      if (solves) setSolvedIds(solves.map((s) => s.challenge_id));

      setLoading(false);
    }
    load();
  }, [supabase, router]);

  const handleSolve = (challengeId: string, points: number) => {
    setSolvedIds((prev) => [...prev, challengeId]);
    setScore((prev) => prev + points);
    // Update solve count in the challenge list
    setChallenges((prev) =>
      prev.map((c) =>
        c.id === challengeId ? { ...c, solves: c.solves + 1 } : c
      )
    );
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <TerminalText text="Loading challenges..." />
      </div>
    );
  }

  return (
    <div className="flex-1 px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <GlitchText
            as="h1"
            color="cyan"
            className="text-3xl font-bold tracking-widest"
            animate
          >
            DASHBOARD
          </GlitchText>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Welcome back,{" "}
            <span className="text-[var(--cyber-green)]">{username}</span>
          </p>
        </div>

        <div className="flex items-center gap-6 text-sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-[var(--cyber-green)] neon-green">
              {score}
            </div>
            <div className="text-[10px] tracking-widest text-[var(--text-muted)]">
              POINTS
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-[var(--cyber-cyan)] neon-cyan">
              {solvedIds.length}
            </div>
            <div className="text-[10px] tracking-widest text-[var(--text-muted)]">
              SOLVED
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white">
              {challenges.length}
            </div>
            <div className="text-[10px] tracking-widest text-[var(--text-muted)]">
              TOTAL
            </div>
          </div>
        </div>
      </div>

      {/* Challenge Grid */}
      {userId && (
        <ChallengeGrid
          challenges={challenges}
          solvedIds={solvedIds}
          userId={userId}
          onSolve={handleSolve}
        />
      )}
    </div>
  );
}
