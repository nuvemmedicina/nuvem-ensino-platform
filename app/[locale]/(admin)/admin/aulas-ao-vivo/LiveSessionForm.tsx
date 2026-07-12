"use client";

import { useRef, useState } from "react";
import { createLiveSession } from "./actions";
import { LiveSessionImageUpload } from "./LiveSessionImageUpload";

type Course = { id: string; title: string; slug: string };

const inputClass =
  "w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:border-primary/50";
const labelClass =
  "block font-sans text-xs font-semibold text-muted mb-1";

export default function LiveSessionForm({ courses }: { courses: Course[] }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState("");

  async function handleSubmit(formData: FormData) {
    formData.set("thumbnailUrl", thumbnailUrl);
    await createLiveSession(formData);
    formRef.current?.reset();
    setThumbnailUrl("");
  }

  return (
    <form ref={formRef} action={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className={labelClass}>Curso</label>
        <select name="courseId" required className={inputClass}>
          <option value="">Selecione...</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>{c.title}</option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelClass}>Título da sessão</label>
        <input name="title" required placeholder="Ex: Aula ao vivo — Módulo 1" className={inputClass} />
      </div>

      <div>
        <label className={labelClass}>Descrição (opcional)</label>
        <textarea name="description" rows={2} className={`${inputClass} resize-none`} />
      </div>

      <div>
        <label className={labelClass}>Data</label>
        <input name="date" type="date" required className={inputClass} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Hora início (Horário de Brasília)</label>
          <input name="startTime" type="time" required className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Hora fim (Horário de Brasília)</label>
          <input name="endTime" type="time" required className={inputClass} />
        </div>
      </div>

      <div>
        <label className={labelClass}>Link da aula (opcional)</label>
        <input name="meetUrl" type="url" placeholder="https://youtube.com/live/... ou meet.google.com/..." className={inputClass} />
      </div>

      <div>
        <label className={labelClass}>Local (para presenciais)</label>
        <input name="location" placeholder="Ex: NU.V.E.M Medicina, BH" className={inputClass} />
      </div>

      <div>
        <label className={labelClass}>Imagem de capa</label>
        <LiveSessionImageUpload value={thumbnailUrl} onChange={setThumbnailUrl} />
      </div>

      <button type="submit" className="w-full font-sans text-sm font-semibold px-4 py-2.5 rounded-xl bg-primary text-white hover:bg-primary-dark transition-colors mt-1">
        Criar sessão
      </button>
    </form>
  );
}
