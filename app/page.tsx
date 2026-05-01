import Link from "next/link";
import GlitchText from "@/components/ui/GlitchText";
import CyberButton from "@/components/ui/CyberButton";

export default function HomePage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-16 text-center relative">
      {/* Big title */}
      <GlitchText
        as="h1"
        color="cyan"
        className="text-5xl sm:text-7xl font-bold tracking-widest mb-2"
        animate
      >
        HACK-CTF
      </GlitchText>

      <GlitchText
        as="p"
        color="green"
        className="text-lg tracking-widest mb-8"
      >
        CYBER-IMMERSIVE PLATFORM
      </GlitchText>

      <p className="max-w-lg text-sm text-[var(--text-muted)] leading-relaxed mb-10">
        Test your hacking skills across Web, Cryptography, Reverse Engineering,
        Pwn, Forensics and more. Compete globally. Earn badges. Reach the top.
      </p>

      {/* CTA Buttons */}
      <div className="flex flex-wrap gap-4 justify-center mb-16">
        <Link href="/auth/register">
          <CyberButton variant="green" size="lg">
            START HACKING
          </CyberButton>
        </Link>
        <Link href="/scoreboard">
          <CyberButton variant="cyan" size="lg">
            SCOREBOARD
          </CyberButton>
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-8 max-w-md w-full border border-[var(--border-color)] p-6 cyber-card">
        {[
          { label: "CHALLENGES", value: "50+" },
          { label: "CATEGORIES", value: "8" },
          { label: "PLAYERS", value: "∞" },
        ].map(({ label, value }) => (
          <div key={label} className="flex flex-col items-center gap-1">
            <span className="text-2xl font-bold text-[var(--cyber-cyan)] neon-cyan">
              {value}
            </span>
            <span className="text-[10px] tracking-widest text-[var(--text-muted)]">
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
