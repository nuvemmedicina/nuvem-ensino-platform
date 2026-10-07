import Link from "next/link";
import { salvarTraducoesModulo } from "./actions";

/**
 * Traduções (ES/EN) de módulos, temas e aulas, um módulo por vez.
 * Campo vazio = o aluno vê o português. A área do aluno escolhe o texto pelo
 * idioma da página (lib/i18n-content.ts, traduzirItem/traduzirModulos).
 */

type Item = {
  id: string;
  title: string;
  description: string | null;
  titleEs: string | null;
  titleEn: string | null;
  descriptionEs: string | null;
  descriptionEn: string | null;
};
type Modulo = Item & { topics: (Item & { lessons: Item[] })[] };

const inputClass =
  "w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:border-primary/50";
const btnPrimary =
  "font-sans text-sm font-semibold px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-dark transition-colors";

const nomeCurto = (titulo: string) => titulo.split("—")[0].trim();

function contar(modulo: Modulo) {
  const itens = [modulo, ...modulo.topics, ...modulo.topics.flatMap((t) => t.lessons)];
  return {
    total: itens.length,
    es: itens.filter((i) => i.titleEs).length,
    en: itens.filter((i) => i.titleEn).length,
  };
}

/** Uma linha: título em português e os campos em espanhol e inglês. */
function linha(prefixo: string, item: Item, tipo: string, nivel: 0 | 1 | 2) {
  const recuo = nivel === 0 ? "" : nivel === 1 ? "sm:pl-4" : "sm:pl-8";
  return (
    <div key={prefixo} className={`flex flex-col gap-2 py-3 border-b border-border last:border-b-0 ${recuo}`}>
      <p className="font-sans text-sm text-foreground">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted mr-2">{tipo}</span>
        <span className={nivel === 2 ? "" : "font-semibold"}>{item.title}</span>
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="font-sans text-[11px] font-semibold text-muted">Español</span>
          <input name={`${prefixo}:titleEs`} defaultValue={item.titleEs ?? ""} placeholder={item.title} className={inputClass} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="font-sans text-[11px] font-semibold text-muted">English</span>
          <input name={`${prefixo}:titleEn`} defaultValue={item.titleEn ?? ""} placeholder={item.title} className={inputClass} />
        </label>
      </div>
      {item.description && (
        <details className="group">
          <summary className="font-sans text-xs text-primary cursor-pointer hover:underline">
            Descrição {item.descriptionEs && item.descriptionEn ? "· traduzida" : item.descriptionEs || item.descriptionEn ? "· em parte" : "· sem tradução"}
          </summary>
          <p className="font-sans text-xs text-muted whitespace-pre-line mt-2 mb-2">{item.description}</p>
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="flex flex-col gap-1">
              <span className="font-sans text-[11px] font-semibold text-muted">Español</span>
              <textarea name={`${prefixo}:descriptionEs`} defaultValue={item.descriptionEs ?? ""} rows={3} className={`${inputClass} resize-y`} />
            </label>
            <label className="flex flex-col gap-1">
              <span className="font-sans text-[11px] font-semibold text-muted">English</span>
              <textarea name={`${prefixo}:descriptionEn`} defaultValue={item.descriptionEn ?? ""} rows={3} className={`${inputClass} resize-y`} />
            </label>
          </div>
        </details>
      )}
    </div>
  );
}

export function TraducoesConteudo({ slug, modules, moduloId }: { slug: string; modules: Modulo[]; moduloId: string | undefined }) {
  const modulo = modules.find((m) => m.id === moduloId) ?? modules[0];
  if (!modulo) return null;
  const c = contar(modulo);

  return (
    <section className="bg-surface border border-border rounded-2xl p-6 mb-6 flex flex-col gap-5">
      <div>
        <h2 className="font-sans text-xs font-bold uppercase tracking-widest text-muted mb-1">Módulos, temas e aulas</h2>
        <p className="font-sans text-xs text-muted">
          Campo vazio: o aluno vê o texto em português. Mantenha o formato &quot;Módulo 1 — Nome&quot; nos títulos dos módulos.
        </p>
      </div>

      <nav aria-label="Módulos" className="flex flex-wrap gap-2">
        {modules.map((m) => {
          const cm = contar(m);
          const ativo = m.id === modulo.id;
          return (
            <Link
              key={m.id}
              href={`/admin/cursos/${slug}?aba=traducoes&modulo=${m.id}`}
              scroll={false}
              aria-current={ativo ? "page" : undefined}
              className={`font-sans text-sm px-3.5 py-2 rounded-full border ${
                ativo ? "border-primary bg-primary text-white font-semibold" : "border-border text-foreground hover:border-primary/40"
              }`}
            >
              {nomeCurto(m.title)}
              <span className={ativo ? "text-white/70" : "text-muted"}>
                {" "}
                · ES {cm.es}/{cm.total} · EN {cm.en}/{cm.total}
              </span>
            </Link>
          );
        })}
      </nav>

      <p className="font-sans text-sm text-foreground">
        {nomeCurto(modulo.title)}: {c.es} de {c.total} títulos em espanhol e {c.en} de {c.total} em inglês.
      </p>

      <form action={salvarTraducoesModulo.bind(null, modulo.id, slug)} className="flex flex-col">
        {linha(`m:${modulo.id}`, modulo, "Módulo", 0)}
        {modulo.topics.map((tp) => [
          linha(`t:${tp.id}`, tp, "Tema", 1),
          ...tp.lessons.map((a) => linha(`a:${a.id}`, a, "Aula", 2)),
        ])}
        <div className="pt-4">
          <button type="submit" className={btnPrimary}>
            Salvar traduções do {nomeCurto(modulo.title)}
          </button>
        </div>
      </form>
    </section>
  );
}
