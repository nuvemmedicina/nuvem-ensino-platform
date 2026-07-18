"use client";

import { useState } from "react";
import { Brain, RefreshCw, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

type Course = { id: string; title: string; slug: string; chunks: number };
type Status = "idle" | "indexing" | "done" | "error";

export default function RagIndexClient({ courses }: { courses: Course[] }) {
  const [states, setStates] = useState<Record<string, { status: Status; chunks?: number; error?: string }>>({});

  async function indexCourse(courseId: string) {
    setStates((prev) => ({ ...prev, [courseId]: { status: "indexing" } }));
    try {
      const res = await fetch("/api/admin/rag/index", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao indexar");
      setStates((prev) => ({ ...prev, [courseId]: { status: "done", chunks: data.indexed } }));
    } catch (err) {
      setStates((prev) => ({ ...prev, [courseId]: { status: "error", error: err instanceof Error ? err.message : "Erro" } }));
    }
  }

  async function indexAll() {
    for (const course of courses) {
      await indexCourse(course.id);
    }
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Brain className="w-6 h-6 text-primary" />
          <div>
            <h1 className="text-xl font-semibold text-foreground">Base de Conhecimento — RAG</h1>
            <p className="text-sm text-muted">Indexe o conteúdo dos cursos para a Nuvete responder com precisão</p>
          </div>
        </div>
        <button
          onClick={indexAll}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Indexar todos
        </button>
      </div>

      {/* Como funciona */}
      <div className="bg-primary/5 border border-primary/15 rounded-xl p-4 text-sm text-foreground space-y-1">
        <p className="font-semibold text-primary">Como funciona</p>
        <p className="text-muted">1. Clique em <strong>Indexar</strong> para cada curso — isso processa descrições, conteúdo das aulas e materiais (PDF/TXT).</p>
        <p className="text-muted">2. Os textos são divididos em pedaços e transformados em vetores de embedding (OpenAI).</p>
        <p className="text-muted">3. Quando um aluno pergunta à Nuvete, ela busca os trechos mais relevantes e usa como contexto.</p>
        <p className="text-muted font-medium text-amber-600">⚠️ Requer provedor OpenAI configurado em Configurações → IA.</p>
      </div>

      {/* Lista de cursos */}
      <div className="space-y-2">
        {courses.map((course) => {
          const state = states[course.id];
          const isIndexing = state?.status === "indexing";
          const isDone = state?.status === "done";
          const isError = state?.status === "error";
          const chunks = isDone ? state.chunks : course.chunks;

          return (
            <div key={course.id} className="flex items-center gap-4 bg-white border border-border rounded-xl px-4 py-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{course.title}</p>
                <p className="text-xs text-muted">
                  {chunks ? `${chunks.toLocaleString("pt-BR")} chunks indexados` : "Não indexado"}
                </p>
                {isError && (
                  <p className="text-xs text-red-600 mt-0.5">{state.error}</p>
                )}
              </div>

              <div className="flex items-center gap-2">
                {isDone && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                {isError && <AlertCircle className="w-4 h-4 text-red-500" />}

                <button
                  onClick={() => indexCourse(course.id)}
                  disabled={isIndexing}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 rounded-lg transition-colors disabled:opacity-50"
                >
                  {isIndexing
                    ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Indexando…</>
                    : <><RefreshCw className="w-3.5 h-3.5" /> {chunks ? "Re-indexar" : "Indexar"}</>
                  }
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
