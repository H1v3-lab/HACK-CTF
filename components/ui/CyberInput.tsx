"use client";

import { InputHTMLAttributes, forwardRef } from "react";

interface CyberInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  prefix?: string;
}

const CyberInput = forwardRef<HTMLInputElement, CyberInputProps>(
  ({ label, prefix = ">>", className = "", ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1 w-full">
        {label && (
          <label className="text-xs text-[var(--text-muted)] uppercase tracking-widest">
            {label}
          </label>
        )}
        <div className="flex items-center gap-2">
          {prefix && (
            <span className="text-[var(--cyber-green)] font-bold text-sm select-none">
              {prefix}
            </span>
          )}
          <input
            ref={ref}
            className={`terminal-input ${className}`}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            {...props}
          />
        </div>
      </div>
    );
  }
);

CyberInput.displayName = "CyberInput";

export default CyberInput;
