"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import GlitchText from "@/components/ui/GlitchText";
import ScoreboardTable from "@/components/scoreboard/ScoreboardTable";

export default function ScoreboardPage() {
  const supabase = createClient();
  const [userId, setUserId] = useState<string | undefined>(undefined);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id));
  }, [supabase.auth]);

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
          Live rankings — updated in real-time
        </p>
      </div>

      <ScoreboardTable currentUserId={userId} />
    </div>
  );
}
