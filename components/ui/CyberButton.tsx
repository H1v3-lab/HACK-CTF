"use client";

import { ButtonHTMLAttributes, ReactNode } from "react";

interface CyberButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "cyan" | "green";
  size?: "sm" | "md" | "lg";
}

export default function CyberButton({
  children,
  variant = "cyan",
  size = "md",
  className = "",
  ...props
}: CyberButtonProps) {
  const sizeClasses = {
    sm: "text-xs px-3 py-1",
    md: "text-sm px-5 py-2",
    lg: "text-base px-8 py-3",
  };

  return (
    <button
      className={`cyber-btn ${variant === "green" ? "cyber-btn-green" : ""} ${sizeClasses[size]} ${className}`}
      data-text={typeof children === "string" ? children : undefined}
      {...props}
    >
      <span>{children}</span>
    </button>
  );
}
