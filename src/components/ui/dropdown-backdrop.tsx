"use client";
import { cn } from "@/lib/utils";

interface DropdownBackdropProps {
  visible: boolean;
  onClose?: () => void;
  className?: string;
}

/**
 * Full-screen dimmed backdrop used behind floating dropdowns (notification
 * popover, user menu). Round 8: backdrop-blur removed — keeps the dark
 * scrim for focus but doesn't visually distort the page underneath, which
 * felt heavy and washed out contrast on cream paper.
 *
 * Click anywhere outside the popover closes the dropdown via onClose.
 */
export function DropdownBackdrop({ visible, onClose, className }: DropdownBackdropProps) {
  if (!visible) return null;
  return (
    <div
      className={cn(
        "fixed inset-0 z-40 bg-black/55",
        className
      )}
      style={{ animation: "notifBackdropIn 200ms ease-out" }}
      onClick={onClose}
      aria-hidden
    />
  );
}
