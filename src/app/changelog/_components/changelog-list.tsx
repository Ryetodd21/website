"use client";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { CHANGELOG, KIND_DOT, KIND_LABEL } from "./_data";

// ─── Changelog list — Server / ML / Website / Android ─────────────────────
// Setiap kanal adalah blok terpisah dengan daftar versi yang dapat
// diperluas (accordion). Versi paling atas otomatis terbuka.

// Tabel KIND_LABEL + KIND_DOT dipindahkan ke `_data.ts` agar bisa
// dibagikan tanpa duplikasi. Impor di sini.

export function ChangelogList() {
  return (
    <div className="grid lg:grid-cols-2 gap-x-12 gap-y-16">
      {CHANGELOG.map((channel, idx) => (
        <ChangelogChannelBlock
          key={channel.channel}
          channel={channel}
          delay={idx * 80}
        />
      ))}
    </div>
  );
}

function ChangelogChannelBlock({
  channel,
  delay,
}: {
  channel: (typeof CHANGELOG)[number];
  delay: number;
}) {
  const [openVersion, setOpenVersion] = useState<string | null>(
    channel.versions[0]?.version ?? null
  );

  return (
    <section
      className="animate-fade-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <header className="flex items-baseline justify-between gap-3 mb-4 pb-4 border-b border-hairline">
        <div className="min-w-0">
          <span className="eyebrow-sm text-ink tabular-nums">
            {channel.channel.toUpperCase()}
          </span>
          <h2 className="display-sans text-2xl sm:text-3xl text-ink mt-1 leading-tight">
            {channel.title}
          </h2>
        </div>
        <span className="font-mono text-[11px] text-ink/55 shrink-0">
          {channel.versions.length} versi
        </span>
      </header>

      <p className="text-sm text-ink/65 leading-relaxed mb-6">{channel.blurb}</p>

      <ol className="space-y-5">
        {channel.versions.map((v) => {
          const isOpen = openVersion === v.version;
          return (
            <li
              key={v.version}
              className="border border-hairline bg-paper transition-shadow hover:shadow-[var(--shadow-card)]"
            >
              <button
                type="button"
                onClick={() => setOpenVersion(isOpen ? null : v.version)}
                className="w-full flex items-start gap-4 text-left px-5 py-4 group/changelog"
                aria-expanded={isOpen}
              >
                <span className="font-mono text-[11px] text-ink/45 shrink-0 tabular-nums mt-1 w-16">
                  {v.version}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block display-sans text-base text-ink leading-tight">
                    {v.highlight}
                  </span>
                  <span className="block text-[11px] text-ink/55 mt-1.5 font-mono">
                    {v.date} · {v.changes.length} butir
                  </span>
                </span>
                <ChevronDown
                  className={`h-4 w-4 text-ink/45 shrink-0 mt-1 transition-transform ${
                    isOpen ? "rotate-180 text-ink" : ""
                  }`}
                  strokeWidth={2}
                />
              </button>
              {isOpen && (
                <div className="px-5 pb-5 pt-1 border-t border-hairline bg-paper">
                  <ul className="space-y-2.5">
                    {v.changes.map((c, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-3 text-sm text-ink/80 leading-relaxed"
                      >
                        <span className="mt-1.5 shrink-0 inline-flex items-center gap-2 min-w-[110px]">
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${KIND_DOT[c.kind]}`}
                          />
                          <span className="eyebrow-sm text-ink/70 tabular-nums">
                            {KIND_LABEL[c.kind]}
                          </span>
                        </span>
                        <span className="flex-1 min-w-0">{c.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
