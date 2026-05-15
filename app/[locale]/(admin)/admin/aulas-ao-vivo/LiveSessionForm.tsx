"use client";

import { useRef } from "react";
import { createLiveSession } from "./actions";

type Course = { id: string; title: string; slug: string };

export default function LiveSessionForm({ courses }: { courses: Course[] }) {
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(formData: FormData) {
    await createLiveSession(formData);
    formRef.current?.reset();
  }

  return (
    <form ref={formRef} action={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="block font-sans text-xs font-semibold text-muted mb-1">Curso</label>
        <select name="courseId" required className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-background text-foreground">
          <option value="">Selecione...</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>{c.title}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block font-sans text-xs font-semibold text-muted mb-1">Título da sessão</label>
        <input name="title" required placeholder="Ex: Aula ao vivo — Módulo 1" className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-background text-foreground" />
      </div>

      <div>
        <label className="block font-sans text-xs font-semibold text-muted mb-1">Descrição (opcional)</label>
        <textarea name="description" rows={2} className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-background text-foreground resize-none" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block font-sans text-xs font-semibold text-muted mb-1">Início</label>
          <input name="startAt" type="datetime-local" required className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-background text-foreground" />
        </div>
        <div>
          <label className="block font-sans text-xs font-semibold text-muted mb-1">Fim</label>
          <input name="endAt" type="datetime-local" required className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-background text-foreground" />
        </div>
      </div>

      <div>
        <label className="block font-sans text-xs font-semibold text-muted mb-1">Link Google Meet (opcional)</label>
        <input name="meetUrl" type="url" placeholder="https://meet.google.com/..." className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-background text-foreground" />
      </div>

      <div>
        <label className="block font-sans text-xs font-semibold text-muted mb-1">Local (para presenciais)</label>
        <input name="location" placeholder="Ex: NU.V.E.M Medicina, BH" className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-background text-foreground" />
      </div>

      <button type="submit" className="w-full font-sans text-sm font-semibold px-4 py-2.5 rounded-xl bg-primary text-white hover:bg-primary-dark transition-colors mt-1">
        Criar sessão
      </button>
    </form>
  );
}
