"use client";

import { useState } from "react";
import Image from "next/image";
import { deleteLiveSession, updateLiveSession } from "./actions";
import { Trash2, Video, MapPin, Pencil, X, Check, PlayCircle, Radio, Calendar } from "lucide-react";

type Session = {
  id: string;
  title: string;
  description: string | null;
  startAt: Date;
  endAt: Date;
  meetUrl: string | null;
  location: string | null;
  recordingUrl: string | null;
  reminder24h: boolean;
  reminder1h: boolean;
  course: { title: string; slug: string; thumbnailUrl?: string | null };
};

const inputClass =
  "w-full px-3 py-1.5 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:border-primary/50";

function toLocalDate(d: Date): string {
  const dt = new Date(d);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
}
function toLocalTime(d: Date): string {
  const dt = new Date(d);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
}

const fmtDate = new Intl.DateTimeFormat("pt-BR", { weekday: "short", day: "2-digit", month: "short", timeZone: "America/Sao_Paulo" });
const fmtTime = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" });

export default function LiveSessionList({ sessions }: { sessions: Session[] }) {
  const upcoming = sessions.filter((s) => new Date(s.startAt) > new Date());
  const past = sessions.filter((s) => new Date(s.startAt) <= new Date());

  if (sessions.length === 0) {
    return <p className="font-sans text-sm text-muted">Nenhuma aula ao vivo agendada.</p>;
  }

  return (
    <div className="flex flex-col gap-8">
      {upcoming.length > 0 && (
        <div>
          <p className="font-sans text-xs font-bold uppercase tracking-widest text-foreground/70 mb-4">
            Próximas ({upcoming.length})
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {upcoming.map((s) => <SessionCard key={s.id} session={s} />)}
          </div>
        </div>
      )}

      {past.length > 0 && (
        <div>
          <p className="font-sans text-xs font-bold uppercase tracking-widest text-foreground/70 mb-4">
            Realizadas ({past.length})
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 opacity-55">
            {past.map((s) => <SessionCard key={s.id} session={s} past />)}
          </div>
        </div>
      )}
    </div>
  );
}

function SessionCard({ session: s, past = false }: { session: Session; past?: boolean }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(formData: FormData) {
    setSaving(true);
    await updateLiveSession(s.id, formData);
    setSaving(false);
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="col-span-full bg-surface border border-primary/30 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="font-sans text-xs font-bold uppercase tracking-widest text-primary">{s.course.title}</p>
          <button onClick={() => setEditing(false)} className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-background transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form action={handleSubmit} className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="block font-sans text-[10px] font-semibold text-muted uppercase tracking-wider mb-1">Título</label>
            <input name="title" defaultValue={s.title} required className={inputClass} />
          </div>
          <div className="col-span-2">
            <label className="block font-sans text-[10px] font-semibold text-muted uppercase tracking-wider mb-1">Descrição</label>
            <textarea name="description" defaultValue={s.description ?? ""} rows={2} className={`${inputClass} resize-none`} />
          </div>
          <div className="col-span-2">
            <label className="block font-sans text-[10px] font-semibold text-muted uppercase tracking-wider mb-1">Data</label>
            <input name="date" type="date" defaultValue={toLocalDate(new Date(s.startAt))} required className={inputClass} />
          </div>
          <div>
            <label className="block font-sans text-[10px] font-semibold text-muted uppercase tracking-wider mb-1">Início (BRT)</label>
            <input name="startTime" type="time" defaultValue={toLocalTime(new Date(s.startAt))} required className={inputClass} />
          </div>
          <div>
            <label className="block font-sans text-[10px] font-semibold text-muted uppercase tracking-wider mb-1">Fim (BRT)</label>
            <input name="endTime" type="time" defaultValue={toLocalTime(new Date(s.endAt))} required className={inputClass} />
          </div>
          <div className="col-span-2">
            <label className="block font-sans text-[10px] font-semibold text-muted uppercase tracking-wider mb-1">Link da aula</label>
            <input name="meetUrl" type="url" defaultValue={s.meetUrl ?? ""} placeholder="https://meet.google.com/... ou youtube.com/live/..." className={inputClass} />
          </div>
          <div className="col-span-2">
            <label className="block font-sans text-[10px] font-semibold text-muted uppercase tracking-wider mb-1">Local (presencial)</label>
            <input name="location" defaultValue={s.location ?? ""} placeholder="Ex: NU.V.E.M Medicina, BH" className={inputClass} />
          </div>
          <div className="col-span-2">
            <label className="block font-sans text-[10px] font-semibold text-muted uppercase tracking-wider mb-1">URL da gravação</label>
            <input name="recordingUrl" type="url" defaultValue={s.recordingUrl ?? ""} placeholder="https://drive.google.com/..." className={inputClass} />
          </div>
          <div className="col-span-2 flex gap-2 pt-1">
            <button type="submit" disabled={saving}
              className="flex items-center gap-1.5 font-sans text-xs font-semibold px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-dark disabled:opacity-50 transition-colors">
              <Check className="w-3.5 h-3.5" /> {saving ? "Salvando…" : "Salvar"}
            </button>
            <button type="button" onClick={() => setEditing(false)}
              className="flex items-center gap-1.5 font-sans text-xs font-semibold px-4 py-2 rounded-lg border border-border text-muted hover:text-foreground transition-colors">
              <X className="w-3.5 h-3.5" /> Cancelar
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-violet-500/15 bg-surface">
      {/* Poster */}
      <div className="relative overflow-hidden bg-gradient-to-br from-violet-900 to-indigo-950" style={{ paddingBottom: "140%" }}>
        {s.course.thumbnailUrl && (
          <Image src={s.course.thumbnailUrl} alt={s.title} fill
            className="absolute inset-0 object-cover opacity-40 transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, 33vw" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

        <span className="absolute top-3 left-3 flex items-center gap-1 font-sans text-[9px] font-bold uppercase tracking-widest bg-violet-500 text-white px-2 py-1 rounded-full shadow-lg">
          <Radio className="w-2.5 h-2.5" /> ao vivo
        </span>

        {/* Ações no hover */}
        <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => setEditing(true)}
            className="p-1.5 rounded-lg bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-colors">
            <Pencil className="w-3 h-3" />
          </button>
          <button onClick={() => deleteLiveSession(s.id)}
            className="p-1.5 rounded-lg bg-red-500/20 backdrop-blur-sm text-red-300 hover:bg-red-500/40 transition-colors">
            <Trash2 className="w-3 h-3" />
          </button>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-3">
          <p className="font-sans text-[9px] font-bold uppercase tracking-widest text-white/50 mb-1 line-clamp-1">{s.course.title}</p>
          <p className="font-sans text-sm font-bold text-white leading-snug line-clamp-2 mb-2">{s.title}</p>
          <div className="flex flex-col gap-1">
            <span className="flex items-center gap-1 font-sans text-[10px] text-white/70">
              <Calendar className="w-3 h-3 shrink-0" />
              <span className="capitalize">{fmtDate.format(new Date(s.startAt))}</span>
              <span className="text-white/40">·</span>
              <span>{fmtTime.format(new Date(s.startAt))}</span>
            </span>
            {s.location && (
              <span className="flex items-center gap-1 font-sans text-[10px] text-white/60">
                <MapPin className="w-3 h-3 shrink-0" />{s.location}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Botões */}
      <div className="flex flex-col gap-1.5 p-2.5">
        {!past && s.meetUrl && (
          <a href={s.meetUrl} target="_blank" rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-1.5 font-sans text-[11px] font-bold px-3 py-2 rounded-xl bg-violet-600 text-white hover:bg-violet-500 transition-colors">
            <Video className="w-3.5 h-3.5" /> Entrar na aula
          </a>
        )}
        {past && s.recordingUrl && (
          <a href={s.recordingUrl} target="_blank" rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-1.5 font-sans text-[11px] font-bold px-3 py-2 rounded-xl bg-foreground/10 text-foreground hover:bg-foreground/20 transition-colors">
            <PlayCircle className="w-3.5 h-3.5" /> Ver gravação
          </a>
        )}
        <button onClick={() => setEditing(true)}
          className="w-full flex items-center justify-center gap-1.5 font-sans text-[11px] font-semibold px-3 py-2 rounded-xl border border-border text-muted hover:text-foreground hover:border-violet-400/40 transition-colors">
          <Pencil className="w-3 h-3" /> Editar
        </button>
      </div>
    </div>
  );
}
