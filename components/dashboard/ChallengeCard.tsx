"use client";

import CyberCard from "@/components/ui/CyberCard";
import type { Challenge } from "@/lib/types";

interface ChallengeCardProps {
  challenge: Challenge;
  solved: boolean;
  onOpen: (challenge: Challenge) => void;
}

const DIFFICULTY_CONFIG = {
  easy: { label: "EASY", color: "#00ff41" },
  medium: { label: "MEDIUM", color: "#ffff00" },
  hard: { label: "HARD", color: "#ff6600" },
  insane: { label: "INSANE", color: "#ff00ff" },
};

export default function ChallengeCard({
  challenge,
  solved,
  onOpen,
}: ChallengeCardProps) {
  const diff = DIFFICULTY_CONFIG[challenge.difficulty];

  return (
    <CyberCard
      solved={solved}
      className="flex flex-col gap-3 cursor-pointer fade-in-up transition-transform duration-200 hover:-translate-y-1"
      onClick={() => onOpen(challenge)}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3
            className={`font-bold text-sm tracking-wide truncate ${solved ? "text-[var(--cyber-green)]" : "text-[var(--cyber-cyan)]"}`}
          >
            {challenge.title}
          </h3>
          {challenge.categories && (
            <span
              className="text-xs mt-0.5 block"
              style={{ color: challenge.categories.color }}
            >
              {challenge.categories.name}
            </span>
          )}
        </div>

        {/* Points badge */}
        <div
          className={`shrink-0 text-xs font-bold px-2 py-0.5 border rounded-sm ${solved ? "border-[var(--cyber-green)] text-[var(--cyber-green)]" : "border-[var(--cyber-cyan)] text-[var(--cyber-cyan)]"}`}
        >
          {challenge.points} pts
        </div>
      </div>

      {/* Description */}
      <p className="text-xs text-[var(--text-muted)] line-clamp-2 leading-relaxed">
        {challenge.description}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between mt-auto pt-2 border-t border-[var(--border-color)]">
        <span
          className={`text-xs font-bold badge-${challenge.difficulty} border px-1.5 py-0.5 rounded-sm`}
        >
          {diff.label}
        </span>

        <div className="flex items-center gap-3 text-[10px] text-[var(--text-muted)]">
          <span>{challenge.solves} solves</span>
          {solved && (
            <span className="text-[var(--cyber-green)] font-bold">
              ✓ SOLVED
            </span>
          )}
        </div>
      </div>
    </CyberCard>
  );
}
