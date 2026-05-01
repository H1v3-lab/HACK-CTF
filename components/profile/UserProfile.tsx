"use client";

import Image from "next/image";

interface Badge {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string;
  earned_at: string;
}

interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
  score: number;
  created_at: string;
}

interface UserProfileProps {
  profile: Profile;
  badges: Badge[];
  rank: number | null;
  totalSolves: number;
  totalChallenges: number;
}

export default function UserProfile({
  profile,
  badges,
  rank,
  totalSolves,
  totalChallenges,
}: UserProfileProps) {
  const completion =
    totalChallenges > 0 ? Math.round((totalSolves / totalChallenges) * 100) : 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Profile header */}
      <div className="cyber-card rounded-sm p-6 flex flex-col sm:flex-row gap-6 items-start sm:items-center neon-box-cyan">
        {/* Avatar */}
        <div className="shrink-0 w-20 h-20 rounded-sm border-2 border-[var(--cyber-cyan)] flex items-center justify-center bg-[var(--bg-secondary)] text-4xl overflow-hidden">
          {profile.avatar_url ? (
            <Image
              src={profile.avatar_url}
              alt={profile.username}
              width={80}
              height={80}
              className="w-full h-full object-cover"
            />
          ) : (
            <span>{profile.username.charAt(0).toUpperCase()}</span>
          )}
        </div>

        {/* Info */}
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-[var(--cyber-cyan)] neon-cyan tracking-widest">
            {profile.username}
          </h1>
          {profile.bio && (
            <p className="text-sm text-[var(--text-muted)] mt-1">
              {profile.bio}
            </p>
          )}
          <p className="text-xs text-[var(--text-muted)] mt-2">
            Member since{" "}
            {new Date(profile.created_at).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
            })}
          </p>
        </div>

        {/* Stats */}
        <div className="flex flex-col gap-2 text-right">
          <div>
            <div className="text-3xl font-bold text-[var(--cyber-green)] neon-green">
              {profile.score}
            </div>
            <div className="text-[10px] text-[var(--text-muted)] tracking-widest">
              POINTS
            </div>
          </div>
          {rank !== null && (
            <div className="text-xs text-[var(--text-muted)]">
              Rank{" "}
              <span className="text-[var(--cyber-cyan)] font-bold">
                #{rank}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Progress */}
      <div className="cyber-card rounded-sm p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs tracking-widest text-[var(--text-muted)]">
            COMPLETION
          </span>
          <span className="text-xs text-[var(--cyber-cyan)]">
            {totalSolves}/{totalChallenges} ({completion}%)
          </span>
        </div>
        <div className="cyber-progress">
          <div
            className="cyber-progress-fill"
            style={{ width: `${completion}%` }}
          />
        </div>
      </div>

      {/* Badges */}
      <div className="cyber-card rounded-sm p-5">
        <h2 className="text-xs tracking-widest text-[var(--cyber-cyan)] font-bold mb-4">
          BADGES ({badges.length})
        </h2>
        {badges.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">
            No badges earned yet. Solve challenges to earn badges!
          </p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {badges.map((b) => (
              <div
                key={b.id}
                title={b.description ?? b.name}
                className="flex items-center gap-2 border rounded-sm px-3 py-2 text-xs"
                style={{ borderColor: b.color, color: b.color }}
              >
                <span>{b.icon ?? "🏅"}</span>
                <span className="font-bold tracking-wide">{b.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
