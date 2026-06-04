"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface Props {
  phrases: string[];
  intervalMs?: number;
  className?: string;
}

/**
 * Slot-machine vertical: las frases rotan con un loop continuo sin "flash"
 * en el wraparound (snap invisible con requestAnimationFrame).
 */
export function TextRotator({ phrases, intervalMs = 2800, className }: Props) {
  const [idx, setIdx] = useState(0);
  const [transitionOn, setTransitionOn] = useState(true);

  useEffect(() => {
    const id = setInterval(() => setIdx((i) => i + 1), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  useEffect(() => {
    if (idx !== phrases.length) return;
    const t = setTimeout(() => {
      setTransitionOn(false);
      setIdx(0);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setTransitionOn(true));
      });
    }, 700);
    return () => clearTimeout(t);
  }, [idx, phrases.length]);

  const longest = phrases.reduce((a, b) => (a.length > b.length ? a : b));
  const strip = [...phrases, phrases[0]];

  return (
    <span className={cn("relative inline-flex items-center align-baseline", className)}>
      <span
        className="relative inline-block overflow-hidden"
        style={{ lineHeight: "1.3em", height: "1.3em" }}
      >
        <span className="invisible block whitespace-nowrap">{longest}</span>
        <span
          className="absolute left-0 top-0 flex flex-col"
          style={{
            transform: `translateY(-${idx * 1.3}em)`,
            transition: transitionOn
              ? "transform 700ms cubic-bezier(0.4, 0, 0.2, 1)"
              : "none",
          }}
        >
          {strip.map((phrase, i) => (
            <span
              key={i}
              className="block whitespace-nowrap"
              style={{ lineHeight: "1.3em", height: "1.3em" }}
            >
              {phrase}
            </span>
          ))}
        </span>
      </span>
    </span>
  );
}
