"use client";

import { deleteLiveSession } from "./actions";
import { Trash2, Video, MapPin } from "lucide-react";

type Session = {
  id: string;
  title: string;
  startAt: Date;
  endAt: Date;
  meetUrl: string | null;
  location: string | null;
  reminder24h: boolean;
  reminder1h: boolean;
  course: { title: string; slug: string };
};

export default function LiveSessionList({ sessions }: { sessions: Session[] }) {
  const upcoming = sessions.filter((s) => s.startAt > new Date());
  const past = sessions.filter((s) => s.startAt <= new Date());

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-sans text-sm font-semibold text-foreground mb-3">
          Próximas sessões ({upcoming.length})
        </h2>
        {upcoming.length === 0 ? (
          <p className="font-sans text-sm text-muted">Nenhuma sessão agendada.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {upcoming.map((s) => <SessionCard key={s.id} session={s} />)}
          </div>
        )}
      </div>

      {past.length > 0 && (
        <div>
          <h2 className="font-sans text-sm font-semibold text-muted mb-3">Realizadas ({past.length})</h2>
          <div className="flex flex-col gap-3 opacity-60">
            {past.map((s) => <SessionCard key={s.id} session={s} />)}
          </div>
        </div>
      )}
    </div>
  );
}

function SessionCard({ session: s }: { session: Session }) {
  const fmt = (d: Date) => new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(d));

  return (
    <div className="bg-surface border border-border rounded-xl p-4 flex items-start justify-between gap-4">
      <div className="flex-1 min-w-0">
        <p className="font-sans text-[10px] text-primary font-semibold uppercase tracking-wide mb-0.5">{s.course.title}</p>
        <p className="font-sans text-sm font-medium text-foreground">{s.title}</p>
        <p className="font-sans text-xs text-muted mt-1">
          {fmt(s.startAt)} até {fmt(s.endAt)}
        </p>
        <div className="flex items-center gap-3 mt-2 flex-wrap">
          {s.meetUrl && (
            <a href={s.meetUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 font-sans text-xs text-primary hover:underline">
              <Video className="w-3 h-3" /> Google Meet
            </a>
          )}
          {s.location && (
            <span className="flex items-center gap-1 font-sans text-xs text-muted">
              <MapPin className="w-3 h-3" /> {s.location}
            </span>
          )}
          <span className={`font-sans text-[10px] px-2 py-0.5 rounded-full ${s.reminder24h ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
            24h {s.reminder24h ? "✓" : "pendente"}
          </span>
          <span className={`font-sans text-[10px] px-2 py-0.5 rounded-full ${s.reminder1h ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
            1h {s.reminder1h ? "✓" : "pendente"}
          </span>
        </div>
      </div>
      <button
        onClick={() => deleteLiveSession(s.id)}
        className="text-muted hover:text-red-500 transition-colors shrink-0 mt-0.5"
        aria-label="Excluir"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}
