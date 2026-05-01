"use client";

import { useEffect, useState, ReactNode } from "react";

interface GlitchTextProps {
  children: ReactNode;
  as?: "h1" | "h2" | "h3" | "h4" | "p" | "span";
  className?: string;
  color?: "cyan" | "green" | "white";
  animate?: boolean;
}

export default function GlitchText({
  children,
  as: Tag = "span",
  className = "",
  color = "cyan",
  animate = false,
}: GlitchTextProps) {
  const [isGlitching, setIsGlitching] = useState(false);

  useEffect(() => {
    if (!animate) return;
    const interval = setInterval(
      () => {
        setIsGlitching(true);
        setTimeout(() => setIsGlitching(false), 400);
      },
      4000 + Math.random() * 3000
    );
    return () => clearInterval(interval);
  }, [animate]);

  const colorClass =
    color === "cyan"
      ? "text-[var(--cyber-cyan)] neon-cyan"
      : color === "green"
        ? "text-[var(--cyber-green)] neon-green"
        : "text-white";

  const text = typeof children === "string" ? children : "";

  return (
    <Tag
      className={`glitch ${colorClass} ${className} ${isGlitching ? "[&::before]:animate-pulse" : ""}`}
      data-text={text}
    >
      {children}
    </Tag>
  );
}
