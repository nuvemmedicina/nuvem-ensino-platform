"use client";

import { useState, useTransition } from "react";
import { Pencil, Trash2, X, Check, BookOpen } from "lucide-react";
import { updateInstructor, deleteInstructor } from "./actions";
import { ImageUploader } from "@/components/ImageUploader";

type Instructor = {
  id: string;
  title: string | null;
  crm: string | null;
  rqe: string | null;
  photoUrl: string | null;
  slug: string;
  user: { id: string; name: string | null; email: string; image: string | null };
  _count: { courses: number };
};

const inputClass =
  "w-full px-3 py-1.5 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:border-primary/50";
const labelClass =
  "block font-sans text-[10px] font-semibold text-muted uppercase tracking-wider mb-1";

export function InstructorCard({ instructor: inst }: { instructor: Instructor }) {
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleUpdate(formData: FormData) {
    startTransition(async () => {
      await updateInstructor(inst.id, formData);
      setEditing(false);
    });
  }

  function handleDelete() {
    if (inst._count.courses > 0) {
      alert(`Não é possível remover "${inst.user.name}" — possui ${inst._count.courses} curso(s) atribuído(s). Reatribua os cursos primeiro.`);
      return;
    }
    if (!confirm(`Remover o instrutor "${inst.user.name}"? O papel voltará para Aluno.`)) return;
    startTransition(() => deleteInstructor(inst.id));
  }

  const initials = (inst.user.name ?? inst.user.email)
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  if (editing) {
    return (
      <div className="bg-surface border border-primary/30 rounded-2xl p-5">
        <div className="flex items-center gap-3 mb-4">
          <Avatar src={inst.user.image} initials={initials} />
          <div>
            <p className="font-sans text-sm font-semibold text-foreground">{inst.user.name}</p>
            <p className="font-sans text-xs text-muted">{inst.user.email}</p>
          </div>
        </div>
        <form action={handleUpdate} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Título / Especialidade</label>
              <input name="title" defaultValue={inst.title ?? ""} placeholder="Ex: Dra. · Gastroenterologista" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>CRM</label>
              <input name="crm" defaultValue={inst.crm ?? ""} placeholder="CRM-MG 12345" className={inputClass} />
            </div>
          </div>
          <div>
            <label className={labelClass}>RQE</label>
            <input name="rqe" defaultValue={inst.rqe ?? ""} placeholder="RQE 67890" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Foto do instrutor</label>
            <ImageUploader
              name="photoUrl"
              initialUrl={inst.photoUrl}
              folder="instructors"
              aspectHint="1:1"
              label="Foto do instrutor"
            />
          </div>
          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={isPending}
              className="flex items-center gap-1.5 font-sans text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary text-white hover:bg-primary-dark disabled:opacity-50 transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              {isPending ? "Salvando…" : "Salvar"}
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
    <div className="bg-surface border border-border rounded-2xl px-5 py-4 flex items-center gap-4">
      <Avatar src={inst.user.image} initials={initials} size="lg" />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-sans text-sm font-semibold text-foreground">
            {inst.user.name ?? "—"}
          </p>
          {inst.title && (
            <span className="font-sans text-[10px] text-muted/70 italic">{inst.title}</span>
          )}
        </div>
        <p className="font-sans text-xs text-muted">{inst.user.email}</p>
        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
          {inst.crm && (
            <span className="font-sans text-[10px] text-muted bg-border/40 px-2 py-0.5 rounded">
              {inst.crm}
            </span>
          )}
          {inst.rqe && (
            <span className="font-sans text-[10px] text-muted bg-border/40 px-2 py-0.5 rounded">
              {inst.rqe}
            </span>
          )}
          <span className="flex items-center gap-1 font-sans text-[10px] text-muted">
            <BookOpen className="w-3 h-3" />
            {inst._count.courses} curso{inst._count.courses !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={() => setEditing(true)}
          className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-primary/10 transition-colors"
          title="Editar"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleDelete}
          disabled={isPending}
          className="p-1.5 rounded-lg text-muted hover:text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-40"
          title="Remover"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

function Avatar({
  src,
  initials,
  size = "md",
}: {
  src: string | null;
  initials: string;
  size?: "md" | "lg";
}) {
  const dim = size === "lg" ? "w-10 h-10" : "w-8 h-8";
  const text = size === "lg" ? "text-sm" : "text-xs";
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt="" className={`${dim} rounded-full object-cover shrink-0`} />;
  }
  return (
    <div className={`${dim} rounded-full bg-primary/20 flex items-center justify-center shrink-0`}>
      <span className={`font-sans ${text} font-semibold text-primary`}>{initials}</span>
    </div>
  );
}
