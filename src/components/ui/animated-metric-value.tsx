"use client";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface AnimatedMetricValueProps {
  value: number | string;
  /** Number of decimals to display for numeric values. Default 0. */
  decimals?: number;
  /** Locale formatter, default id-ID. */
  locale?: string;
  /** Animation duration in ms. Default 600. */
  durationMs?: number;
  /** Optional prefix/suffix (e.g. "Rp" or " ms"). */
  prefix?: string;
  suffix?: string;
  className?: string;
}

/**
 * Count-up animation when numeric value changes. Editorial tabular-nums
 * to prevent layout shift during animation.
 */
export function AnimatedMetricValue({
  value,
  decimals = 0,
  locale = "id-ID",
  durationMs = 600,
  prefix = "",
  suffix = "",
  className,
}: AnimatedMetricValueProps) {
  const target = typeof value === "number" ? value : Number(value);
  const [display, setDisplay] = useState(target);

  useEffect(() => {
    if (!Number.isFinite(target)) return;
    const start = Number.isFinite(display) ? display : target;
    const delta = target - (typeof start === "number" ? start : Number(start));
    if (delta === 0) return;
    const startTime = performance.now();
    let rafId: number;
    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = durationMs <= 0 || window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 1 : Math.min(1, elapsed / durationMs);
      // Ease-out cubic for editorial settle.
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(start + delta * eased);
      if (progress < 1) rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, durationMs]);

  const formatted = Number.isFinite(target)
    ? (Number.isFinite(display) ? display : target).toLocaleString(locale, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })
    : String(value);

  return (
    <span className={cn("tabular-nums", className)}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}
