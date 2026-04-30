"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import GlitchText from "@/components/ui/GlitchText";
import UserProfile from "@/components/profile/UserProfile";
import TerminalText from "@/components/ui/TerminalText";

export default function ProfilePage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<{
    id: string;
    username: string;
    avatar_url: string | null;
    bio: string | null;
    score: number;
    created_at: string;
  } | null>(null);
  const [badges, setBadges] = useState<
    {
      id: string;
      name: string;
      description: string | null;
      icon: string | null;
      color: string;
      earned_at: string;
    }[]
  >([]);
  const [rank, setRank] = useState<number | null>(null);
  const [solves, setSolves] = useState(0);
  const [totalChallenges, setTotalChallenges] = useState(0);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth/login"); return; }

      const [profileRes, badgesRes, solveRes, totalRes, rankRes] =
        await Promise.all([
          supabase
            .from("profiles")
            .select("id, username, avatar_url, bio, score, created_at")
            .eq("id", user.id)
            .single(),
          supabase
            .from("user_badges")
            .select("earned_at, badges(id, name, description, icon, color)")
            .eq("user_id", user.id),
          supabase
            .from("user_solves")
            .select("challenge_id", { count: "exact", head: true })
            .eq("user_id", user.id),
          supabase
            .from("challenges")
            .select("id", { count: "exact", head: true })
            .eq("is_active", true),
          supabase
            .from("scoreboard")
            .select("position")
            .eq("id", user.id)
            .single(),
        ]);

      if (profileRes.data) setProfile(profileRes.data);

      if (badgesRes.data) {
        setBadges(
          badgesRes.data
            .filter((b) => b.badges)
            .map((b) => {
              const badge = b.badges as unknown as { id: string; name: string; description: string | null; icon: string | null; color: string };
              return {
                ...badge,
                earned_at: b.earned_at,
              };
            })
        );
      }

      setSolves(solveRes.count ?? 0);
      setTotalChallenges(totalRes.count ?? 0);
      if (rankRes.data) setRank(rankRes.data.position);

      setLoading(false);
    }
    load();
  }, [supabase, router]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <TerminalText text="Loading profile..." />
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="flex-1 px-4 sm:px-6 lg:px-8 py-8 max-w-3xl mx-auto w-full">
      <div className="mb-8">
        <GlitchText
          as="h1"
          color="cyan"
          className="text-3xl font-bold tracking-widest"
          animate
        >
          PROFILE
        </GlitchText>
      </div>

      <UserProfile
        profile={profile}
        badges={badges}
        rank={rank}
        totalSolves={solves}
        totalChallenges={totalChallenges}
      />
    </div>
  );
}
