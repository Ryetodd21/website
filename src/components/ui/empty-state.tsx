import { cn } from "cn";
import type { ReactNode } from "react";

// Editorial empty state. Hairline SVG illustration + display-sans title +
// ink/55 subtitle. Style: 1.5px stroke, primary blue, no fill, paper bg.
// All illustrations are 80x80 viewBox so they scale fluidly via className.

const STROKE = "oklch(0.577 0.245 27.325)";
const STROKE_SOFT = "oklch(0.577 0.245 27.325 / 0.4)";
const STROKE_FAINT = "oklch(0.577 0.245 27.325 / 0.18)";

interface SvgProps {
  className?: string;
}

function ChartEmpty({ className }: SvgProps) {
  return (
    <svg viewBox="0 0 80 80" fill="none" className={className} aria-hidden="true">
      <rect x="10" y="12" width="60" height="50" stroke={STROKE_SOFT} strokeWidth="1.5" />
      <line x1="10" y1="50" x2="70" y2="50" stroke={STROKE_SOFT} strokeWidth="1" strokeDasharray="2 2" />
      <line x1="10" y1="30" x2="70" y2="30" stroke={STROKE_FAINT} strokeWidth="0.5" />
      <line x1="30" y1="62" x2="30" y2="12" stroke={STROKE_SOFT} strokeWidth="1" strokeDasharray="2 2" />
      <circle cx="22" cy="40" r="2" fill={STROKE} />
      <circle cx="34" cy="32" r="2" fill={STROKE} />
      <circle cx="46" cy="38" r="2" fill={STROKE} />
      <circle cx="58" cy="24" r="2" fill={STROKE} />
      <path d="M22 40 L34 32 L46 38 L58 24" stroke={STROKE} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

function StudentsEmpty({ className }: SvgProps) {
  return (
    <svg viewBox="0 0 80 80" fill="none" className={className} aria-hidden="true">
      <rect x="8" y="20" width="64" height="44" stroke={STROKE_SOFT} strokeWidth="1.5" />
      <circle cx="24" cy="36" r="5" stroke={STROKE} strokeWidth="1.5" />
      <path d="M16 54 C16 49 20 46 24 46 C28 46 32 49 32 54" stroke={STROKE} strokeWidth="1.5" />
      <circle cx="40" cy="34" r="5" stroke={STROKE} strokeWidth="1.5" />
      <path d="M32 54 C32 48 36 45 40 45 C44 45 48 48 48 54" stroke={STROKE} strokeWidth="1.5" />
      <circle cx="56" cy="36" r="5" stroke={STROKE_SOFT} strokeWidth="1.5" strokeDasharray="2 2" />
      <path d="M48 54 C48 49 52 46 56 46 C60 46 64 49 64 54" stroke={STROKE_SOFT} strokeWidth="1.5" strokeDasharray="2 2" />
      <line x1="8" y1="20" x2="72" y2="20" stroke={STROKE_FAINT} strokeWidth="0.5" />
    </svg>
  );
}

function LogsEmpty({ className }: SvgProps) {
  return (
    <svg viewBox="0 0 80 80" fill="none" className={className} aria-hidden="true">
      <rect x="14" y="10" width="40" height="56" stroke={STROKE_SOFT} strokeWidth="1.5" />
      <line x1="20" y1="20" x2="48" y2="20" stroke={STROKE_FAINT} strokeWidth="1" />
      <line x1="20" y1="28" x2="40" y2="28" stroke={STROKE_FAINT} strokeWidth="1" />
      <line x1="20" y1="36" x2="44" y2="36" stroke={STROKE_FAINT} strokeWidth="1" />
      <line x1="20" y1="44" x2="36" y2="44" stroke={STROKE_FAINT} strokeWidth="1" />
      <path d="M58 36 L66 30 L66 42 L70 38 L70 56 L62 50 L62 60 L58 54 Z" stroke={STROKE} strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx="62" cy="44" r="1.5" fill={STROKE} />
    </svg>
  );
}

function ModelsEmpty({ className }: SvgProps) {
  return (
    <svg viewBox="0 0 80 80" fill="none" className={className} aria-hidden="true">
      <rect x="10" y="10" width="60" height="60" stroke={STROKE_SOFT} strokeWidth="1.5" />
      <line x1="40" y1="10" x2="40" y2="70" stroke={STROKE_FAINT} strokeWidth="0.5" strokeDasharray="2 2" />
      <line x1="10" y1="40" x2="70" y2="40" stroke={STROKE_FAINT} strokeWidth="0.5" strokeDasharray="2 2" />
      <circle cx="20" cy="58" r="2" fill={STROKE_SOFT} />
      <circle cx="28" cy="48" r="2" fill={STROKE_SOFT} />
      <circle cx="36" cy="52" r="2" fill={STROKE} />
      <circle cx="44" cy="38" r="2" fill={STROKE} />
      <circle cx="52" cy="30" r="2" fill={STROKE} />
      <circle cx="60" cy="20" r="2" fill={STROKE_SOFT} />
      <line x1="34" y1="48" x2="46" y2="44" stroke={STROKE} strokeWidth="1" strokeDasharray="2 2" />
      <line x1="46" y1="44" x2="56" y2="26" stroke={STROKE} strokeWidth="1" strokeDasharray="2 2" />
      <circle cx="46" cy="44" r="3" stroke={STROKE} strokeWidth="1.5" fill="none" />
      <line x1="40" y1="40" x2="52" y2="40" stroke={STROKE} strokeWidth="1" />
      <line x1="46" y1="40" x2="46" y2="48" stroke={STROKE} strokeWidth="1" />
    </svg>
  );
}

function MonitorEmpty({ className }: SvgProps) {
  return (
    <svg viewBox="0 0 80 80" fill="none" className={className} aria-hidden="true">
      <rect x="10" y="14" width="60" height="40" stroke={STROKE_SOFT} strokeWidth="1.5" />
      <rect x="28" y="60" width="24" height="4" stroke={STROKE_SOFT} strokeWidth="1.5" />
      <line x1="20" y1="64" x2="60" y2="64" stroke={STROKE_SOFT} strokeWidth="1.5" />
      <rect x="18" y="22" width="14" height="3" fill={STROKE} />
      <rect x="18" y="28" width="20" height="3" fill={STROKE_SOFT} />
      <rect x="18" y="34" width="10" height="3" fill={STROKE_SOFT} />
      <rect x="42" y="22" width="6" height="15" fill={STROKE} opacity="0.15" />
      <rect x="50" y="22" width="6" height="15" fill={STROKE} opacity="0.15" />
      <rect x="58" y="22" width="6" height="15" fill={STROKE} opacity="0.15" />
      <path d="M42 37 L42 30 L48 32 L48 24 L54 26 L54 18 L60 20 L60 15" stroke={STROKE} strokeWidth="1" fill="none" />
    </svg>
  );
}

function InboxEmpty({ className }: SvgProps) {
  return (
    <svg viewBox="0 0 80 80" fill="none" className={className} aria-hidden="true">
      <rect x="14" y="20" width="52" height="40" stroke={STROKE_SOFT} strokeWidth="1.5" />
      <path d="M14 20 L26 32 L40 28 L54 32 L66 20" stroke={STROKE} strokeWidth="1.5" strokeLinejoin="round" />
      <line x1="14" y1="46" x2="66" y2="46" stroke={STROKE_SOFT} strokeWidth="1" strokeDasharray="3 2" />
      <rect x="30" y="50" width="20" height="3" fill={STROKE} />
    </svg>
  );
}

function NoConnectionEmpty({ className }: SvgProps) {
  return (
    <svg viewBox="0 0 80 80" fill="none" className={className} aria-hidden="true">
      <circle cx="40" cy="40" r="22" stroke={STROKE_SOFT} strokeWidth="1.5" />
      <path d="M22 30 C28 24 36 20 40 20 C44 20 52 24 58 30" stroke={STROKE} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M28 36 C32 32 36 30 40 30 C44 30 48 32 52 36" stroke={STROKE} strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="40" cy="44" r="3" fill={STROKE} />
      <line x1="22" y1="22" x2="58" y2="58" stroke={STROKE} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function ShieldEmpty({ className }: SvgProps) {
  return (
    <svg viewBox="0 0 80 80" fill="none" className={className} aria-hidden="true">
      <path d="M40 8 L60 16 L60 38 C60 52 50 62 40 68 C30 62 20 52 20 38 L20 16 Z" stroke={STROKE} strokeWidth="1.5" strokeLinejoin="round" />
      <rect x="30" y="28" width="20" height="20" stroke={STROKE_SOFT} strokeWidth="1" />
      <line x1="30" y1="34" x2="50" y2="34" stroke={STROKE_FAINT} strokeWidth="0.5" />
      <line x1="30" y1="40" x2="50" y2="40" stroke={STROKE_FAINT} strokeWidth="0.5" />
      <line x1="30" y1="46" x2="44" y2="46" stroke={STROKE_FAINT} strokeWidth="0.5" />
      <circle cx="36" cy="34" r="0.8" fill={STROKE} />
      <circle cx="36" cy="40" r="0.8" fill={STROKE} />
    </svg>
  );
}

function PersonPhoneEmpty({ className }: SvgProps) {
  return (
    <svg viewBox="0 0 80 80" fill="none" className={className} aria-hidden="true">
      <rect x="22" y="8" width="36" height="64" rx="2" stroke={STROKE} strokeWidth="1.5" />
      <line x1="22" y1="16" x2="58" y2="16" stroke={STROKE_SOFT} strokeWidth="0.5" />
      <line x1="22" y1="64" x2="58" y2="64" stroke={STROKE_SOFT} strokeWidth="0.5" />
      <circle cx="40" cy="68" r="1.5" fill={STROKE} />
      <circle cx="34" cy="32" r="3" stroke={STROKE} strokeWidth="1.2" />
      <path d="M28 44 C28 40 31 38 34 38 C37 38 40 40 40 44" stroke={STROKE} strokeWidth="1.2" />
      <circle cx="46" cy="32" r="3" stroke={STROKE_SOFT} strokeWidth="1.2" />
      <path d="M40 44 C40 40 43 38 46 38 C49 38 52 40 52 44" stroke={STROKE_SOFT} strokeWidth="1.2" />
      <line x1="30" y1="52" x2="50" y2="52" stroke={STROKE_FAINT} strokeWidth="1" />
      <line x1="32" y1="56" x2="48" y2="56" stroke={STROKE_FAINT} strokeWidth="1" />
    </svg>
  );
}

function PhoneNotFoundEmpty({ className }: SvgProps) {
  return (
    <svg viewBox="0 0 80 80" fill="none" className={className} aria-hidden="true">
      <rect x="22" y="8" width="36" height="64" rx="2" stroke={STROKE_SOFT} strokeWidth="1.5" />
      <line x1="22" y1="16" x2="58" y2="16" stroke={STROKE_FAINT} strokeWidth="0.5" />
      <line x1="22" y1="64" x2="58" y2="64" stroke={STROKE_FAINT} strokeWidth="0.5" />
      <text x="40" y="44" textAnchor="middle" fontFamily="serif" fontSize="14" fontWeight="700" fill={STROKE}>404</text>
      <line x1="30" y1="50" x2="50" y2="50" stroke={STROKE_FAINT} strokeWidth="0.5" strokeDasharray="2 2" />
      <line x1="14" y1="20" x2="22" y2="14" stroke={STROKE} strokeWidth="1" strokeLinecap="round" />
      <line x1="14" y1="30" x2="22" y2="24" stroke={STROKE} strokeWidth="1" strokeLinecap="round" />
      <line x1="58" y1="20" x2="66" y2="14" stroke={STROKE} strokeWidth="1" strokeLinecap="round" />
      <line x1="58" y1="30" x2="66" y2="24" stroke={STROKE} strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}

// Named SVG exports — untuk pemakaian standalone (login/register hero dll).
export const ChartIllustration = ChartEmpty;
export const StudentsIllustration = StudentsEmpty;
export const LogsIllustration = LogsEmpty;
export const ModelsIllustration = ModelsEmpty;
export const MonitorIllustration = MonitorEmpty;
export const InboxIllustration = InboxEmpty;
export const NoConnectionIllustration = NoConnectionEmpty;
export const ShieldIllustration = ShieldEmpty;
export const PersonPhoneIllustration = PersonPhoneEmpty;
export const PhoneNotFoundIllustration = PhoneNotFoundEmpty;

export type EmptyIllustration =
  | "chart"
  | "students"
  | "logs"
  | "models"
  | "monitor"
  | "inbox"
  | "no-connection"
  | "shield"
  | "person-phone"
  | "phone-not-found";

const ILLUSTRATIONS: Record<EmptyIllustration, (p: SvgProps) => ReactNode> = {
  chart: ChartEmpty,
  students: StudentsEmpty,
  logs: LogsEmpty,
  models: ModelsEmpty,
  monitor: MonitorEmpty,
  inbox: InboxEmpty,
  "no-connection": NoConnectionEmpty,
  shield: ShieldEmpty,
  "person-phone": PersonPhoneEmpty,
  "phone-not-found": PhoneNotFoundEmpty,
};

export interface EmptyStateProps {
  illustration?: EmptyIllustration;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function EmptyState({
  illustration = "inbox",
  title,
  description,
  action,
  className,
  size = "md",
}: EmptyStateProps) {
  const Illustration = ILLUSTRATIONS[illustration];
  const sizeClass = {
    sm: "h-16 w-16",
    md: "h-20 w-20",
    lg: "h-28 w-28 sm:h-32 sm:w-32",
  }[size];

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        size === "lg" ? "py-10 px-4" : "py-8 px-4",
        className
      )}
    >
      <div className={cn("mb-4 text-primary", sizeClass)}>
        <Illustration className="h-full w-full" />
      </div>
      <h3 className="display-sans text-base sm:text-lg text-ink max-w-sm">
        {title}
      </h3>
      {description && (
        <p className="mt-2 text-sm text-ink/55 max-w-md leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
