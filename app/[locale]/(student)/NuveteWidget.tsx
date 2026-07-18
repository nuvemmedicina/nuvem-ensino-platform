"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { usePathname } from "next/navigation";
import { X, Send, Loader2, Sparkles, RotateCcw } from "lucide-react";

type Message = { role: "user" | "assistant"; content: string };

type CourseContext = {
  courseId?: string;
  courseTitle?: string;
  moduleTitle?: string;
  lessonTitle?: string;
};

function NuveteAvatar({ size = 32 }: { size?: number }) {
  return (
    <div
      className="rounded-full shrink-0 overflow-hidden bg-primary/10"
      style={{ width: size, height: size }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/nuvete.jpg"
        alt="Nuvete"
        width={size}
        height={size}
        style={{ width: size, height: size, objectFit: "cover" }}
      />
    </div>
  );
}

function usePageContext(): CourseContext {
  const pathname = usePathname();
  const [ctx, setCtx] = useState<CourseContext>({});

  useEffect(() => {
    // Detecta página de aula: /dashboard/cursos/[slug]/[lessonId]
    const match = pathname.match(/\/cursos\/([^/]+)\/([^/]+)/);
    if (!match) { setCtx({}); return; }

    const [, courseSlug, lessonId] = match;
    fetch(`/api/courses/${courseSlug}/lesson-context?lessonId=${lessonId}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data) setCtx(data); })
      .catch(() => {});
  }, [pathname]);

  return ctx;
}

export function NuveteWidget({ userName }: { userName: string }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const ctx = usePageContext();

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  async function send() {
    const text = input.trim();
    if (!text || streaming) return;
    setInput("");

    const userMsg: Message = { role: "user", content: text };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setStreaming(true);

    // Placeholder para a resposta
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      const res = await fetch("/api/chat/nuvete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages, context: ctx }),
      });

      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({ error: "Erro desconhecido" }));
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: "assistant", content: `⚠️ ${err.error}` };
          return updated;
        });
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let full = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        full += decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: "assistant", content: full };
          return updated;
        });
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      }
    } catch {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: "assistant", content: "⚠️ Erro ao conectar. Tente novamente." };
        return updated;
      });
    } finally {
      setStreaming(false);
    }
  }

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  }

  const contextLabel = ctx.courseTitle
    ? ctx.lessonTitle
      ? `${ctx.courseTitle} · ${ctx.lessonTitle}`
      : ctx.courseTitle
    : null;

  return (
    <>
      {/* ── Chat panel ── */}
      {open && (
        <div className="fixed bottom-[5.5rem] md:bottom-24 right-4 md:right-6 z-50 w-[calc(100vw-2rem)] max-w-sm flex flex-col shadow-2xl rounded-2xl overflow-hidden border border-border bg-white"
          style={{ height: "min(520px, calc(100vh - 160px))" }}>

          {/* Header */}
          <div className="bg-primary px-4 py-3 flex items-center gap-3">
            <NuveteAvatar size={36} />
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-semibold leading-tight">Nuvete</p>
              <p className="text-white/60 text-[11px] leading-tight">Assistente de estudos IA</p>
            </div>
            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <button onClick={() => setMessages([])} title="Limpar conversa"
                  className="text-white/50 hover:text-white/90 transition-colors p-1.5 rounded-lg hover:bg-white/10">
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
              <button onClick={() => setOpen(false)}
                className="text-white/50 hover:text-white/90 transition-colors p-1.5 rounded-lg hover:bg-white/10">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Context pill */}
          {contextLabel && (
            <div className="px-4 py-1.5 bg-primary/5 border-b border-border">
              <span className="text-[11px] text-primary/70 font-medium">📚 {contextLabel}</span>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                <NuveteAvatar size={52} />
                <div>
                  <p className="text-sm font-semibold text-foreground">Olá, {userName}!</p>
                  <p className="text-xs text-muted mt-1 leading-relaxed">
                    Sou a Nuvete, sua assistente de estudos.<br />
                    Pode me perguntar sobre o conteúdo do curso, tirar dúvidas médicas ou pedir um resumo.
                  </p>
                </div>
                <div className="flex flex-col gap-2 w-full mt-2">
                  {[
                    "Explique o mecanismo do nervo vago",
                    "Faça 3 perguntas de revisão sobre este módulo",
                    "Quais os critérios diagnósticos de SIBO?",
                  ].map((s) => (
                    <button key={s} onClick={() => { setInput(s); setTimeout(send, 50); }}
                      className="text-left text-xs text-primary bg-primary/5 hover:bg-primary/10 border border-primary/15 rounded-xl px-3 py-2 transition-colors">
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} className={`flex gap-2 ${m.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                {m.role === "assistant" && <NuveteAvatar size={28} />}
                <div className={`max-w-[82%] rounded-2xl px-3 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                  m.role === "user"
                    ? "bg-primary text-white rounded-tr-sm"
                    : "bg-background text-foreground rounded-tl-sm border border-border"
                }`}>
                  {m.content || (streaming && i === messages.length - 1
                    ? <span className="inline-flex gap-1">{[0,1,2].map(j => <span key={j} className="w-1.5 h-1.5 bg-muted/50 rounded-full animate-bounce" style={{ animationDelay: `${j * 0.15}s` }} />)}</span>
                    : null)}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="border-t border-border px-3 py-3 flex items-end gap-2 bg-white">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              disabled={streaming}
              placeholder="Pergunte algo sobre o conteúdo…"
              rows={1}
              className="flex-1 resize-none text-sm text-foreground placeholder:text-muted/50 bg-transparent focus:outline-none py-1 max-h-28 overflow-y-auto"
              style={{ lineHeight: "1.5" }}
            />
            <button onClick={send} disabled={streaming || !input.trim()}
              className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center disabled:opacity-40 transition-opacity shrink-0 hover:bg-primary/90">
              {streaming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      )}

      {/* ── FAB button ── */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-50 rounded-full shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center overflow-hidden border-2 border-white"
        style={{ width: 52, height: 52, background: "var(--primary)" }}
        aria-label="Abrir Nuvete"
      >
        {open
          ? <X className="w-5 h-5 text-white" />
          : <img src="/nuvete.jpg" alt="Nuvete" style={{ width: 52, height: 52, objectFit: "cover" }} />
        }
      </button>
    </>
  );
}
