"use client";

import { useState } from "react";
import { deleteLiveSession, updateLiveSession } from "./actions";
import { Trash2, Video, MapPin, Pencil, X, Check, PlayCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { LiveSessionImageUpload } from "./LiveSessionImageUpload";

type Session = {
  id: string;
  title: string;
  description: string | null;
  startAt: Date;
  endAt: Date;
  meetUrl: string | null;
  location: string | null;
  recordingUrl: string | null;
  thumbnailUrl: string | null;
  reminder24h: boolean;
  reminder1h: boolean;
  course: { title: string; slug: string };
};

const inputClass =
  "w-full px-3 py-1.5 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:border-primary/50";

// Retorna a data local no formato YYYY-MM-DD (para input type="date")
function toLocalDate(d: Date): string {
  const dt = new Date(d);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
}

// Retorna o horário local no formato HH:MM (para input type="time")
function toLocalTime(d: Date): string {
  const dt = new Date(d);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
}

export default function LiveSessionList({ sessions }: { sessions: Session[] }) {
  const t = useTranslations("admin.liveSessions");
  const upcoming = sessions.filter((s) => new Date(s.startAt) > new Date());
  const past = sessions.filter((s) => new Date(s.startAt) <= new Date());

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-sans text-sm font-semibold text-foreground mb-3">
          {t("upcoming", { count: upcoming.length })}
        </h2>
        {upcoming.length === 0 ? (
          <p className="font-sans text-sm text-muted">{t("noUpcoming")}</p>
        ) : (
          <div className="flex flex-col gap-3">
            {upcoming.map((s) => (
              <SessionCard
                key={s.id}
                session={s}
                untilLabel={t("until")}
                pendingLabel={t("pending")}
                deleteLabel={t("delete")}
              />
            ))}
          </div>
        )}
      </div>

      {past.length > 0 && (
        <div>
          <h2 className="font-sans text-sm font-semibold text-muted mb-3">
            {t("past", { count: past.length })}
          </h2>
          <div className="flex flex-col gap-3 opacity-60">
            {past.map((s) => (
              <SessionCard
                key={s.id}
                session={s}
                untilLabel={t("until")}
                pendingLabel={t("pending")}
                deleteLabel={t("delete")}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SessionCard({
  session: s,
  untilLabel,
  pendingLabel,
  deleteLabel,
}: {
  session: Session;
  untilLabel: string;
  pendingLabel: string;
  deleteLabel: string;
}) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [thumbnailUrl, setThumbnailUrl] = useState(s.thumbnailUrl ?? "");

  const fmt = (d: Date) =>
    new Intl.DateTimeFormat(undefined, {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(d));

  async function handleSubmit(formData: FormData) {
    formData.set("thumbnailUrl", thumbnailUrl);
    setSaving(true);
    await updateLiveSession(s.id, formData);
    setSaving(false);
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="bg-surface border border-primary/30 rounded-xl p-4">
        <p className="font-sans text-[10px] text-primary font-semibold uppercase tracking-wide mb-3">
          {s.course.title}
        </p>
        <form action={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className="block font-sans text-[10px] font-semibold text-muted uppercase tracking-wider mb-1">
              Título
            </label>
            <input name="title" defaultValue={s.title} required className={inputClass} />
          </div>

          <div>
            <label className="block font-sans text-[10px] font-semibold text-muted uppercase tracking-wider mb-1">
              Descrição (opcional)
            </label>
            <textarea
              name="description"
              defaultValue={s.description ?? ""}
              rows={2}
              className={`${inputClass} resize-none`}
            />
          </div>

          <div>
            <label className="block font-sans text-[10px] font-semibold text-muted uppercase tracking-wider mb-1">
              Data
            </label>
            <input
              name="date"
              type="date"
              defaultValue={toLocalDate(new Date(s.startAt))}
              required
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-sans text-[10px] font-semibold text-muted uppercase tracking-wider mb-1">
                Hora início (BRT)
              </label>
              <input
                name="startTime"
                type="time"
                defaultValue={toLocalTime(new Date(s.startAt))}
                required
                className={inputClass}
              />
            </div>
            <div>
              <label className="block font-sans text-[10px] font-semibold text-muted uppercase tracking-wider mb-1">
                Hora fim (BRT)
              </label>
              <input
                name="endTime"
                type="time"
                defaultValue={toLocalTime(new Date(s.endAt))}
                required
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className="block font-sans text-[10px] font-semibold text-muted uppercase tracking-wider mb-1">
              Link da aula
            </label>
            <input
              name="meetUrl"
              type="url"
              defaultValue={s.meetUrl ?? ""}
              placeholder="https://meet.google.com/..."
              className={inputClass}
            />
          </div>

          <div>
            <label className="block font-sans text-[10px] font-semibold text-muted uppercase tracking-wider mb-1">
              Local (presencial)
            </label>
            <input
              name="location"
              defaultValue={s.location ?? ""}
              placeholder="Ex: NU.V.E.M Medicina, BH"
              className={inputClass}
            />
          </div>

          <div>
            <label className="block font-sans text-[10px] font-semibold text-muted uppercase tracking-wider mb-1">
              URL da gravação (após a aula)
            </label>
            <input
              name="recordingUrl"
              type="url"
              defaultValue={s.recordingUrl ?? ""}
              placeholder="https://drive.google.com/... ou YouTube..."
              className={inputClass}
            />
            <p className="font-sans text-[10px] text-muted mt-1">
              Cole aqui o link da gravação. Os alunos verão um botão "Assistir gravação".
            </p>
          </div>

          <div>
            <label className="block font-sans text-[10px] font-semibold text-muted uppercase tracking-wider mb-1">
              Imagem de capa
            </label>
            <LiveSessionImageUpload value={thumbnailUrl} onChange={setThumbnailUrl} />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-1.5 font-sans text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary text-white hover:bg-primary-dark disabled:opacity-50 transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              {saving ? "Salvando…" : "Salvar"}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="flex items-center gap-1.5 font-sans text-xs font-semibold px-3 py-1.5 rounded-lg border border-border text-muted hover:text-foreground transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Cancelar
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border rounded-xl p-4 flex items-start justify-between gap-4">
      <div className="flex-1 min-w-0">
        <p className="font-sans text-[10px] text-primary font-semibold uppercase tracking-wide mb-0.5">
          {s.course.title}
        </p>
        <p className="font-sans text-sm font-medium text-foreground">{s.title}</p>
        <p className="font-sans text-xs text-muted mt-1">
          {fmt(s.startAt)} {untilLabel} {fmt(s.endAt)}
        </p>
        <div className="flex items-center gap-3 mt-2 flex-wrap">
          {s.meetUrl && (
            <a
              href={s.meetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 font-sans text-xs text-primary hover:underline"
            >
              <Video className="w-3 h-3" /> Link da aula
            </a>
          )}
          {s.recordingUrl && (
            <a
              href={s.recordingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 font-sans text-xs text-green-600 hover:underline"
            >
              <PlayCircle className="w-3 h-3" /> Gravação salva
            </a>
          )}
          {s.location && (
            <span className="flex items-center gap-1 font-sans text-xs text-muted">
              <MapPin className="w-3 h-3" /> {s.location}
            </span>
          )}
          <span
            className={`font-sans text-[10px] px-2 py-0.5 rounded-full ${
              s.reminder24h ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
            }`}
          >
            24h {s.reminder24h ? "✓" : pendingLabel}
          </span>
          <span
            className={`font-sans text-[10px] px-2 py-0.5 rounded-full ${
              s.reminder1h ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
            }`}
          >
            1h {s.reminder1h ? "✓" : pendingLabel}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0 mt-0.5">
        <button
          onClick={() => setEditing(true)}
          className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-primary/10 transition-colors"
          aria-label="Editar sessão"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => deleteLiveSession(s.id)}
          className="p-1.5 rounded-lg text-muted hover:text-red-500 hover:bg-red-500/10 transition-colors"
          aria-label={deleteLabel}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
