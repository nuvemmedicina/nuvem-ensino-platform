"use client";

import { useActionState } from "react";
import { createInstructor } from "./actions";
import { ImageUploader } from "@/components/ImageUploader";

const inputClass =
  "w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:border-primary/50";
const labelClass =
  "block font-sans text-xs font-semibold text-muted uppercase tracking-wider mb-1.5";

type State = { error: string | null };

async function submitAction(_prev: State, formData: FormData): Promise<State> {
  try {
    await createInstructor(formData);
    return { error: null };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erro ao cadastrar instrutor." };
  }
}

export function CreateInstructorForm() {
  const [state, formAction, isPending] = useActionState(submitAction, { error: null });

  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <div className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 font-sans text-xs text-red-700">
          {state.error}
        </div>
      )}

      <div>
        <label className={labelClass}>E-mail da conta (já deve existir no sistema)</label>
        <input
          name="email"
          type="email"
          required
          placeholder="dra.vera@exemplo.com"
          className={inputClass}
        />
        <p className="font-sans text-[10px] text-muted mt-1">
          O usuário será encontrado pelo e-mail e seu papel mudará automaticamente para Instrutor.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Título / Especialidade</label>
          <input
            name="title"
            placeholder="Ex: Dra. · Gastroenterologista"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>CRM</label>
          <input name="crm" placeholder="Ex: CRM-MG 12345" className={inputClass} />
        </div>
      </div>

      <div>
        <label className={labelClass}>RQE (opcional)</label>
        <input name="rqe" placeholder="Ex: RQE 67890" className={inputClass} />
      </div>

      <div>
        <label className={labelClass}>Foto do instrutor (opcional)</label>
        <ImageUploader
          name="photoUrl"
          folder="instructors"
          aspectHint="1:1"
          label="Foto do instrutor"
        />
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="font-sans text-sm font-semibold px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-dark disabled:opacity-50 transition-colors"
        >
          {isPending ? "Cadastrando…" : "Cadastrar instrutor"}
        </button>
      </div>
    </form>
  );
}
