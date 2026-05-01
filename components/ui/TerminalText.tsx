"use client";

import { useEffect, useRef, useState } from "react";

export default function TerminalText({
  text,
  speed = 40,
  className = "",
  onComplete,
}: {
  text: string;
  speed?: number;
  className?: string;
  onComplete?: () => void;
}) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    let i = 0;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDisplayed("");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDone(false);
    const timer = setInterval(() => {
      if (i < text.length) {
        setDisplayed(text.slice(0, i + 1));
        i++;
      } else {
        clearInterval(timer);
        setDone(true);
        onCompleteRef.current?.();
      }
    }, speed);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, speed]);

  return (
    <span
      className={`font-mono text-[var(--cyber-green)] ${className} ${!done ? "cursor" : ""}`}
    >
      {displayed}
    </span>
  );
}
