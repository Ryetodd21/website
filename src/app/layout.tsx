import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Fraunces, Montserrat } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { THEME_INIT_SCRIPT } from "@/components/theme-toggle";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
  // Only the two weights actually used by globals.css:
  //   - .display         → 700 (regular)
  //   - .display-italic  → 500 (italic)
  // Without an explicit `weight` array Next.js downloads all weights from
  // 100–900 (~13 files), which the browser preloads but never renders →
  // console warning "preloaded with link preload was not used within a
  // few seconds". The `axes` field is incompatible with a discrete `weight`
  // (next/font requires `weight: "variable"` when axes are set, but that
  // pulls all weights again) — opsz isn't used anywhere on the site, so
  // drop it.
  weight: ["500", "700"],
  style: ["normal", "italic"],
  // Editorial accent font — most pages never render any Fraunces text
  // (Inter is the body font). Preloading on every page triggers the
  // "preloaded but not used" browser warning; let it lazy-load on demand
  // via display: swap.
  preload: false,
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

// SAIC-pattern heavy grotesque sans for primary display headlines.
// Only 800 and 900 are actually applied in globals.css
// (.display-sans, .display-sans-uc → 800; .display-sans-black → 900).
// Loading the unused 400/500/600/700 weights would preload 4 font files
// that never render → "preloaded but not used" console warning per page.
const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["800", "900"],
  display: "swap",
  // Same reasoning as Fraunces: editorial accent font, lazy-load on demand
  // to avoid "preloaded but not used" warnings on pages with no Montserrat
  // text (e.g. /logs, /reports tables).
  preload: false,
});

export const metadata: Metadata = {
  title: "Monitor UNG · Sistem Monitoring Distraksi Belajar",
  description: "Dashboard monitoring distraksi belajar mahasiswa berbasis PCA & K-Means",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🎓</text></svg>",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className={`${inter.variable} ${fraunces.variable} ${jetbrainsMono.variable} ${montserrat.variable} min-h-full antialiased max-w-full overflow-x-hidden`}>
        {children}
        <Toaster position="bottom-right" richColors />
      </body>
    </html>
  );
}
