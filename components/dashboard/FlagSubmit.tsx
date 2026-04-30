"use client";

import { useState, useRef } from "react";
import CyberInput from "@/components/ui/CyberInput";
import CyberButton from "@/components/ui/CyberButton";
import GlitchText from "@/components/ui/GlitchText";

interface Challenge {
  id: string;
  title: string;
  description: string;
  points: number;
  difficulty: string;
  solves: number;
  author: string | null;
  hints?: unknown;
  files?: unknown;
  categories?: { name: string; color: string } | null;
}

interface FlagSubmitProps {
  challenge: Challenge;
  userId: string;
  onSuccess: (challengeId: string, points: number) => void;
  onClose: () => void;
}

type LogLine = { type: "info" | "success" | "error" | "warn"; text: string };

export default function FlagSubmit({
  challenge,
  onSuccess,
  onClose,
}: Omit<FlagSubmitProps, "userId">) {
  const [flag, setFlag] = useState("");
  const [loading, setLoading] = useState(false);
  const [log, setLog] = useState<LogLine[]>([
    { type: "info", text: `Challenge loaded: ${challenge.title}` },
    { type: "info", text: `Points: ${challenge.points} | Difficulty: ${challenge.difficulty.toUpperCase()}` },
    { type: "warn", text: "Enter flag below to validate..." },
  ]);
  const inputRef = useRef<HTMLInputElement>(null);

  const addLog = (line: LogLine) =>
    setLog((prev) => [...prev.slice(-20), line]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!flag.trim() || loading) return;

    setLoading(true);
    addLog({ type: "info", text: `Submitting: ${flag}` });

    try {
      const res = await fetch("/api/validate-flag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeId: challenge.id, flag }),
      });

      const data = await res.json();

      if (!res.ok) {
        addLog({ type: "error", text: data.error ?? "Server error." });
      } else if (data.correct) {
        addLog({ type: "success", text: "✓ FLAG ACCEPTED! Points awarded." });
        onSuccess(challenge.id, challenge.points);
        setFlag("");
      } else {
        addLog({ type: "error", text: "✗ INCORRECT FLAG. Try again." });
        setFlag("");
      }
    } catch {
      addLog({ type: "error", text: "Network error. Check connection." });
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const hints = Array.isArray(challenge.hints) ? challenge.hints as string[] : [];
  const files = Array.isArray(challenge.files)
    ? (challenge.files as { name: string; url: string }[])
    : [];

  const lineColor = (type: LogLine["type"]) => {
    switch (type) {
      case "success":
        return "text-[var(--cyber-green)]";
      case "error":
        return "text-red-400";
      case "warn":
        return "text-yellow-400";
      default:
        return "text-[var(--text-muted)]";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative cyber-card rounded-sm w-full max-w-xl neon-box-cyan fade-in-up">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border-color)] p-4">
          <GlitchText as="h2" color="cyan" className="text-base font-bold tracking-widest">
            {challenge.title}
          </GlitchText>
          <button
            onClick={onClose}
            className="text-[var(--text-muted)] hover:text-red-400 text-lg font-bold leading-none"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="p-4 flex flex-col gap-4">
          {/* Description */}
          <p className="text-sm text-[var(--text-muted)] leading-relaxed">
            {challenge.description}
          </p>

          {/* Files */}
          {files.length > 0 && (
            <div>
              <p className="text-xs text-[var(--cyber-cyan)] tracking-widest mb-1">
                ATTACHMENTS
              </p>
              <div className="flex flex-wrap gap-2">
                {files.map((f) => (
                  <a
                    key={f.url}
                    href={f.url}
                    download
                    className="text-xs border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--cyber-cyan)] px-2 py-1 rounded-sm transition-colors"
                  >
                    📎 {f.name}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Hints */}
          {hints.length > 0 && (
            <details className="text-xs">
              <summary className="text-yellow-400 cursor-pointer tracking-widest">
                HINTS ({hints.length})
              </summary>
              <ul className="mt-2 pl-3 flex flex-col gap-1">
                {hints.map((h, i) => (
                  <li key={i} className="text-[var(--text-muted)]">
                    {i + 1}. {h}
                  </li>
                ))}
              </ul>
            </details>
          )}

          {/* Terminal Log */}
          <div className="bg-black border border-[var(--border-color)] rounded-sm p-3 h-32 overflow-y-auto font-mono text-xs">
            {log.map((line, i) => (
              <div key={i} className={lineColor(line.type)}>
                <span className="text-[var(--text-muted)] mr-2">
                  [{String(i + 1).padStart(2, "0")}]
                </span>
                {line.text}
              </div>
            ))}
          </div>

          {/* Flag Input */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <CyberInput
              ref={inputRef}
              prefix="FLAG>"
              placeholder="HACK{your_flag_here}"
              value={flag}
              onChange={(e) => setFlag(e.target.value)}
              disabled={loading}
            />
            <CyberButton
              type="submit"
              variant="green"
              disabled={loading || !flag.trim()}
            >
              {loading ? "VALIDATING..." : "SUBMIT FLAG"}
            </CyberButton>
          </form>
        </div>
      </div>
    </div>
  );
}
