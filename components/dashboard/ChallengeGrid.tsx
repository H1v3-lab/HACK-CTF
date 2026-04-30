"use client";

import { useState } from "react";
import ChallengeCard from "./ChallengeCard";
import FlagSubmit from "./FlagSubmit";

interface Challenge {
  id: string;
  title: string;
  description: string;
  points: number;
  difficulty: "easy" | "medium" | "hard" | "insane";
  solves: number;
  author: string | null;
  hints?: unknown;
  files?: unknown;
  categories?: { name: string; color: string } | null;
}

interface ChallengeGridProps {
  challenges: Challenge[];
  solvedIds: string[];
  userId?: string;
  onSolve: (challengeId: string, points: number) => void;
}

const CATEGORIES = ["All", "Web", "Cryptography", "Reverse", "Pwn", "Forensics", "OSINT", "Steganography", "Misc"];
const DIFFICULTIES = ["all", "easy", "medium", "hard", "insane"];

export default function ChallengeGrid({
  challenges,
  solvedIds,
  onSolve,
}: ChallengeGridProps) {
  const [selected, setSelected] = useState<Challenge | null>(null);
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [diffFilter, setDiffFilter] = useState("all");
  const [showSolved, setShowSolved] = useState(true);

  const filtered = challenges.filter((c) => {
    if (categoryFilter !== "All" && c.categories?.name !== categoryFilter)
      return false;
    if (diffFilter !== "all" && c.difficulty !== diffFilter) return false;
    if (!showSolved && solvedIds.includes(c.id)) return false;
    return true;
  });

  return (
    <>
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {/* Category filter */}
        <div className="flex flex-wrap gap-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`text-[10px] tracking-widest px-2 py-1 border rounded-sm transition-colors ${
                categoryFilter === cat
                  ? "border-[var(--cyber-cyan)] text-[var(--cyber-cyan)] bg-[rgba(0,243,255,0.08)]"
                  : "border-[var(--border-color)] text-[var(--text-muted)] hover:border-[var(--cyber-cyan)] hover:text-[var(--cyber-cyan)]"
              }`}
            >
              {cat.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="h-4 w-px bg-[var(--border-color)]" />

        {/* Difficulty filter */}
        <div className="flex gap-1">
          {DIFFICULTIES.map((d) => (
            <button
              key={d}
              onClick={() => setDiffFilter(d)}
              className={`text-[10px] tracking-widest px-2 py-1 border rounded-sm transition-colors badge-${d === "all" ? "" : d} ${
                diffFilter === d
                  ? "bg-[rgba(255,255,255,0.05)]"
                  : "border-[var(--border-color)] text-[var(--text-muted)] hover:opacity-80"
              }`}
            >
              {d.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <label className="flex items-center gap-2 cursor-pointer text-xs text-[var(--text-muted)]">
            <input
              type="checkbox"
              checked={showSolved}
              onChange={(e) => setShowSolved(e.target.checked)}
              className="accent-[var(--cyber-cyan)]"
            />
            SHOW SOLVED
          </label>
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-6 mb-4 text-xs text-[var(--text-muted)]">
        <span>
          <span className="text-[var(--cyber-cyan)]">{challenges.length}</span>{" "}
          total
        </span>
        <span>
          <span className="text-[var(--cyber-green)]">{solvedIds.length}</span>{" "}
          solved
        </span>
        <span>
          <span className="text-white">{filtered.length}</span> displayed
        </span>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-[var(--text-muted)] text-sm">
          No challenges match the current filters.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((c) => (
            <ChallengeCard
              key={c.id}
              challenge={c}
              solved={solvedIds.includes(c.id)}
              onOpen={setSelected}
            />
          ))}
        </div>
      )}

      {/* Flag submission modal */}
      {selected && (
        <FlagSubmit
          challenge={selected}
          onSuccess={(id, pts) => {
            onSolve(id, pts);
            setSelected(null);
          }}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}
