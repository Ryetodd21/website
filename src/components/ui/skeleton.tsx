"use client";
import { cn } from "@/lib/utils";

interface SkeletonProps extends React.ComponentProps<"div"> {
  variant?: "default" | "text" | "circle" | "rect";
  width?: string | number;
  height?: string | number;
}

export function Skeleton({ variant = "default", width, height, style, className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse bg-ink/[0.06]",
        variant === "text" && "rounded h-4",
        variant === "circle" && "rounded-full",
        variant === "rect" && "rounded-[2px]",
        variant === "default" && "rounded-[2px]",
        className,
      )}
      style={{
        width: width ?? (variant === "text" ? "100%" : undefined),
        height: height ?? (variant === "circle" ? width ?? 40 : undefined),
        ...style,
      }}
      {...props}
    />
  );
}

export function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 items-center">
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton
              key={j}
              variant={j === 0 ? "circle" : "rect"}
              width={j === 0 ? 32 : "100%"}
              height={j === 0 ? 32 : 16}
              className="flex-1"
            />
          ))}
        </div>
      ))}
    </div>
  );
}
