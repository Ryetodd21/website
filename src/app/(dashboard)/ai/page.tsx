"use client";
import { useState, useRef, useEffect, lazy, Suspense } from "react";
import { BrainCircuit, ChartColumn, Clock3, Copy, Database, Loader2, Plus, Send, Square, Users } from "lucide-react";
import { toast } from "sonner";
import remarkGfm from "remark-gfm";
import { chatWithAI, getClusterContext, type ChatMessage, type ChatResponse } from "@/lib/api";
import { useApiResource } from "@/hooks/use-api-resource";
import { PageHeader } from "@/components/metrics";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { DataState } from "@/components/ui/data-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const ReactMarkdown = lazy(() => import("react-markdown"));
const suggestions = [
  { icon: ChartColumn, title: "Pahami kelompok", question: "Jelaskan sebaran kelompok mahasiswa berdasarkan data yang tersedia, dengan bahasa sederhana." },
  { icon: Clock3, title: "Baca pola penggunaan", question: "Bagaimana pola waktu layar, media sosial, dan permainan pada data yang tersedia? Jelaskan juga keterbatasan datanya." },
  { icon: Users, title: "Rencanakan pendampingan", question: "Apa langkah pendampingan yang dapat dilakukan dosen berdasarkan data yang tersedia? Hindari menyimpulkan penyebab tanpa bukti." },
  { icon: Database, title: "Periksa kelengkapan", question: "Apakah data yang tersedia cukup untuk dianalisis? Jelaskan data yang masih kurang sebelum menarik kesimpulan." },
];
interface Message extends ChatMessage { usage?: ChatResponse["usage"]; model?: string }

export default function AIPage() {
  const context = useApiResource(getClusterContext);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resetOpen, setResetOpen] = useState(false);
  const requestRef = useRef<AbortController | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const alive = useRef(true);
  const isLoading = pendingMessage !== null;

  useEffect(() => {
    alive.current = true;
    return () => { alive.current = false; requestRef.current?.abort(); };
  }, []);

  useEffect(() => {
    // Scroll only the conversation, without moving the page or keyboard focus.
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "instant" });
  }, [messages, pendingMessage]);

  async function handleSend() {
    const trimmed = input.trim();
    if (!trimmed || trimmed.length > 4000 || requestRef.current) return;
    const controller = new AbortController();
    requestRef.current = controller;
    setPendingMessage(trimmed);
    setInput("");
    setError(null);
    try {
      // shortcut: API caps history at 50 messages / 4000 characters each; expand only with the server contract.
      const history: ChatMessage[] = messages.slice(-48).map(({ role, content }) => ({ role, content: content.slice(0, 4000) }));
      const response = await chatWithAI([
        { role: "system", content: "Jawab dalam Bahasa Indonesia yang jelas untuk staf akademik lintas jurusan. Gunakan data konteks yang tersedia, jelaskan periode dan keterbatasannya, jangan mengarang data atau penyebab. Bedakan lokasi dari presensi. Akhiri dengan rekomendasi pendampingan yang dapat ditinjau dosen." },
        ...history,
        { role: "user", content: trimmed },
      ], { signal: controller.signal });
      if (!alive.current || controller.signal.aborted) return;
      setMessages(previous => [...previous, { role: "user", content: trimmed }, { role: "assistant", content: response.message, usage: response.usage, model: response.model }]);
    } catch (failure) {
      if (!alive.current || controller.signal.aborted) return;
      setInput(trimmed);
      setError(failure instanceof Error ? failure.message : "Jawaban belum dapat dimuat. Coba kirim kembali.");
    } finally {
      if (alive.current && requestRef.current === controller) {
        requestRef.current = null;
        setPendingMessage(null);
      }
    }
  }

  function stop() {
    requestRef.current?.abort();
    requestRef.current = null;
    setInput(pendingMessage ?? "");
    setPendingMessage(null);
    setError("Permintaan dihentikan. Pertanyaan Anda dikembalikan ke kolom pesan.");
  }

  const cluster = context.data;
  const contextStats = cluster ? [
    { label: "Mahasiswa terdaftar", value: cluster.total.toLocaleString("id-ID"), icon: Users },
    { label: "Sudah dikelompokkan", value: cluster.clustered.toLocaleString("id-ID"), icon: ChartColumn },
    { label: "Rerata waktu layar", value: cluster.week.logs > 0 ? `${cluster.week.sot.toLocaleString("id-ID")} menit` : "Belum ada data", icon: Clock3 },
  ] : [];

  return (
    <div>
      <PageHeader title="AI Analisis" subtitle="Dari data aktivitas menjadi bahan pendampingan mahasiswa." rightActions={
        <Dialog open={resetOpen} onOpenChange={setResetOpen}>
          <DialogTrigger render={<Button variant="outline" className="min-h-11 gap-2 bg-card" disabled={isLoading || (!messages.length && !input)}><Plus className="size-4" aria-hidden="true" />Percakapan baru</Button>} />
          <DialogContent className="bg-card">
            <DialogTitle>Mulai percakapan baru?</DialogTitle>
            <DialogDescription>Percakapan dan draf saat ini akan dihapus dari halaman. Salin jawaban yang masih diperlukan.</DialogDescription>
            <DialogFooter><DialogClose render={<Button variant="outline" className="min-h-11">Batal</Button>} /><Button className="min-h-11" onClick={() => { setMessages([]); setInput(""); setError(null); setResetOpen(false); }}>Mulai baru</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      } />
      <div className="grid min-w-0 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        <section aria-labelledby="conversation-title" className="dashboard-panel min-w-0 overflow-hidden">
          <div className="flex items-center gap-3 border-b border-hairline p-4 sm:px-6">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><BrainCircuit className="size-5" aria-hidden="true" /></span>
            <div><h2 id="conversation-title" className="font-semibold text-ink">Asisten analisis akademik</h2><p className="text-sm text-muted-foreground">Bahasa sederhana, berdasarkan data tersedia</p></div>
          </div>
          <div ref={logRef} className="max-h-[65dvh] min-h-80 overflow-y-auto overscroll-contain p-4 sm:p-6" tabIndex={0} role="region" aria-label="Isi percakapan">
            {!messages.length && !isLoading && <div className="mx-auto max-w-2xl py-5 sm:py-8">
              <p className="mb-3 text-sm font-semibold text-ink">Ruang untuk memahami</p>
              <h3 className="font-heading text-2xl font-bold leading-snug text-ink sm:text-3xl">Apa yang ingin Anda pahami dari data mahasiswa?</h3>
              <p className="mt-3 text-base leading-relaxed text-muted-foreground">Pilih contoh pertanyaan atau tulis kebutuhan Anda. Periksa kembali jawaban sebelum mengambil keputusan.</p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">{suggestions.map(item => <button key={item.title} type="button" onClick={() => { setInput(item.question); setError(null); textareaRef.current?.focus({ preventScroll: true }); }} className="group flex min-h-24 items-start gap-3 rounded-xl border border-hairline bg-paper p-4 text-left transition-colors hover:border-primary hover:bg-primary/5"><item.icon className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" /><span><span className="block text-base font-semibold">{item.title}</span><span className="mt-1 block text-sm text-muted-foreground">Gunakan contoh pertanyaan</span></span></button>)}</div>
            </div>}
            <div role="log" aria-label="Pesan percakapan" aria-live="polite" aria-relevant="additions" className="space-y-6">
              {messages.map((message, index) => <article key={index} className={message.role === "user" ? "ml-auto max-w-[92%] rounded-2xl rounded-tr-sm border border-primary/20 bg-primary/5 p-4 sm:max-w-[85%]" : "min-w-0"}>
                <p className="mb-2 text-sm font-semibold text-muted-foreground">{message.role === "user" ? "Anda" : "Asisten AI"}</p>
                {message.role === "user" ? <p className="whitespace-pre-wrap break-words text-base leading-7">{message.content}</p> : <>
                  <Suspense fallback={<p role="status" className="text-sm text-muted-foreground">Menyiapkan jawaban...</p>}>
                    <div className="ai-prose"><ReactMarkdown remarkPlugins={[remarkGfm]} components={{
                      table: ({ children }) => <div className="my-4 overflow-x-auto rounded-lg border border-hairline" tabIndex={0} role="region" aria-label="Tabel jawaban AI"><table>{children}</table></div>,
                      a: ({ children, href }) => <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>,
                      h1: ({ children }) => <h3>{children}</h3>,
                      h2: ({ children }) => <h3>{children}</h3>,
                      h3: ({ children }) => <h4>{children}</h4>,
                    }}>{message.content}</ReactMarkdown></div>
                  </Suspense>
                  <div className="mt-3 flex flex-wrap items-start gap-3">
                    <Button variant="ghost" className="min-h-11 gap-2 text-muted-foreground" aria-label={`Salin jawaban ${Math.floor(index / 2) + 1}`} onClick={async () => { try { await navigator.clipboard.writeText(message.content); toast.success("Jawaban disalin"); } catch { toast.error("Jawaban belum dapat disalin. Pilih teks untuk menyalin manual."); } }}><Copy className="size-4" aria-hidden="true" />Salin</Button>
                    <details className="text-sm text-muted-foreground"><summary className="min-h-11 cursor-pointer py-3">Rincian jawaban</summary><p>Model: {message.model || "Tidak dilaporkan"}</p>{message.usage && <p>Penggunaan: {message.usage.total_tokens.toLocaleString("id-ID")} token</p>}</details>
                  </div>
                </>}
              </article>)}
            </div>
            {isLoading && <div className="mt-6 space-y-5">
              <div className="ml-auto max-w-[92%] rounded-2xl border border-primary/20 bg-primary/5 p-4"><p className="mb-2 text-sm font-semibold text-muted-foreground">Anda</p><p className="whitespace-pre-wrap break-words text-base leading-7">{pendingMessage}</p></div>
              <div role="status" className="rounded-xl bg-paper p-4"><p className="flex items-center gap-2 text-sm font-medium"><Loader2 className="size-4 animate-spin motion-reduce:animate-none text-primary" aria-hidden="true" />Sedang menyusun analisis...</p><p className="mt-2 text-sm text-muted-foreground">Jawaban dapat memerlukan beberapa saat.</p><div className="mt-4 space-y-3" aria-hidden="true"><Skeleton height={12} width="90%" /><Skeleton height={12} width="70%" /><Skeleton height={12} width="80%" /></div></div>
            </div>}
          </div>
          <form onSubmit={event => { event.preventDefault(); void handleSend(); }} className="border-t border-hairline bg-card p-4 sm:p-5">
            {error && <div role="alert" className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 p-3"><p className="break-words text-sm text-ink">{error}</p><p className="mt-1 text-sm text-muted-foreground">Periksa pertanyaan, lalu kirim kembali.</p></div>}
            <label htmlFor="ai-question" className="mb-2 block text-sm font-semibold">Pertanyaan Anda</label>
            <Textarea id="ai-question" ref={textareaRef} value={input} onChange={event => setInput(event.target.value)} onKeyDown={event => { if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); void handleSend(); } }} readOnly={isLoading} maxLength={4000} rows={3} aria-describedby="ai-input-help" placeholder="Contoh: Apa yang perlu ditinjau dari aktivitas mahasiswa minggu ini?" className="max-h-48 min-h-24 resize-y bg-paper p-3 text-base md:text-base" />
            <div className="mt-3 flex items-end justify-between gap-3">
              <p id="ai-input-help" className="text-xs leading-relaxed text-muted-foreground">Enter untuk kirim, Shift+Enter untuk baris baru.<br />{input.length.toLocaleString("id-ID")} / 4.000 karakter</p>
              {/* Stopping replaces this control with a submit button before the click default runs. */}
              {isLoading ? <Button type="button" variant="outline" onClick={event => { event.preventDefault(); stop(); }} className="min-h-11 gap-2"><Square className="size-4" aria-hidden="true" />Hentikan</Button> : <Button type="submit" disabled={!input.trim()} className="min-h-11 gap-2 px-4"><Send className="size-4" aria-hidden="true" />{error ? "Kirim kembali" : "Kirim"}</Button>}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">Percakapan hanya tersedia selama halaman ini terbuka.</p>
          </form>
        </section>
        <aside className="space-y-4" aria-label="Konteks analisis">
          <section className="dashboard-panel p-5">
            <h2 className="flex items-center gap-2 text-base font-semibold"><Database className="size-5 text-primary" aria-hidden="true" />Konteks data</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Ringkasan data tersedia untuk membantu membaca hasil analisis.</p>
            <div className="mt-4" aria-busy={context.pending}>
              <DataState pending={context.pending && !cluster} error={context.error} onRetry={context.reload}>
                <dl className="space-y-4">{contextStats.map(stat => <div key={stat.label} className="border-b border-hairline pb-4 last:border-0"><dt className="flex items-center gap-2 text-sm text-muted-foreground"><stat.icon className="size-4" aria-hidden="true" />{stat.label}</dt><dd className="mt-2 text-xl font-semibold tabular-nums">{stat.value}</dd></div>)}</dl>
                <p className="mt-3 text-sm text-muted-foreground">Waktu layar menggunakan periode mingguan dari server.</p>
                <Button variant="outline" onClick={context.reload} disabled={context.pending} className="mt-4 min-h-11 w-full">{context.pending ? "Memperbarui..." : "Perbarui konteks"}</Button>
              </DataState>
            </div>
          </section>
          <section className="rounded-xl border border-hairline bg-primary/5 p-5 text-sm leading-relaxed text-muted-foreground"><h2 className="mb-2 font-semibold text-ink">Bahan pertimbangan, bukan keputusan</h2><p>AI dapat keliru. Cocokkan jawaban dengan laporan, kelengkapan data, dan konteks mahasiswa sebelum melakukan tindak lanjut.</p></section>
          <details className="dashboard-panel p-5 text-sm text-muted-foreground"><summary className="min-h-6 cursor-pointer font-medium text-ink">Tentang analisis</summary><div className="mt-3 space-y-3"><p>{cluster?.model.v != null ? `Model pengelompokan v${cluster.model.v}, ${cluster.model.k} kelompok.` : "Informasi model pengelompokan belum tersedia."}</p><p>Konteks diambil kembali oleh server saat pertanyaan dikirim.</p><p>AI menerima hingga 48 pesan terakhir. Pesan panjang dibatasi 4.000 karakter dalam konteks; teks lengkap tetap tampil di percakapan.</p></div></details>
        </aside>
      </div>
    </div>
  );
}
