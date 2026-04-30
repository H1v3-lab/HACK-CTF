"use client";

import { ReactNode, HTMLAttributes } from "react";

interface CyberCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  solved?: boolean;
  glow?: "cyan" | "green" | "none";
}

export default function CyberCard({
  children,
  solved = false,
  glow = "none",
  className = "",
  ...props
}: CyberCardProps) {
  const glowClass =
    glow === "cyan"
      ? "neon-box-cyan"
      : glow === "green"
        ? "neon-box-green"
        : "";

  return (
    <div
      className={`cyber-card rounded-sm p-5 ${solved ? "solved" : ""} ${glowClass} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
