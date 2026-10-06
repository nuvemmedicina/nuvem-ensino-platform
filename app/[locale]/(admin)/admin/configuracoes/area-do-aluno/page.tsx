import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { CHAVE_NOVA_AREA, lerModoNovaArea, type ModoNovaArea } from "@/lib/novaArea";
import { salvarModoNovaArea } from "./actions";

export const dynamic = "force-dynamic";

const OPCOES: { modo: ModoNovaArea; titulo: string; descricao: string }[] = [
  {
    modo: "desligada",
    titulo: "Desligada",
    descricao: "Todos usam a área do aluno atual. Use para voltar atrás a qualquer momento.",
  },
  {
    modo: "equipe",
    titulo: "Só a equipe",
    descricao: "Administradores e editores veem a nova área; os alunos continuam na atual.",
  },
  {
    modo: "todos",
    titulo: "Todos",
    descricao: "Todos os alunos passam a usar a nova área. Evite ligar durante uma prova aberta.",
  },
];

export default async function AreaDoAlunoConfigPage() {
  const session = await auth();
  const podeAlterar = (session?.user as { role?: string })?.role === "ADMIN";

  const [modoAtual, registro] = await Promise.all([
    lerModoNovaArea(),
    prisma.platformSetting.findUnique({ where: { key: CHAVE_NOVA_AREA } }),
  ]);

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-light text-foreground">Nova área do aluno</h1>
        <p className="font-sans text-sm text-muted mt-1">
          Escolha quem vê a nova área do aluno. Progresso, notas e certificados são os mesmos nas duas versões.
        </p>
      </div>

      <form action={salvarModoNovaArea} className="space-y-3">
        <fieldset disabled={!podeAlterar} className="space-y-3">
          <legend className="sr-only">Quem vê a nova área do aluno</legend>
          {OPCOES.map((opcao) => (
            <label
              key={opcao.modo}
              className="flex items-start gap-3 rounded-2xl border border-border bg-surface p-4 cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-primary/5"
            >
              <input
                type="radio"
                name="modo"
                value={opcao.modo}
                defaultChecked={modoAtual === opcao.modo}
                className="mt-1 accent-primary"
              />
              <span>
                <span className="block font-sans text-sm font-semibold text-foreground">{opcao.titulo}</span>
                <span className="block font-sans text-sm text-muted mt-0.5">{opcao.descricao}</span>
              </span>
            </label>
          ))}
        </fieldset>

        {podeAlterar ? (
          <button
            type="submit"
            className="font-sans text-sm font-semibold px-6 py-2.5 rounded-full bg-primary text-white hover:bg-primary/90 transition-colors"
          >
            Salvar
          </button>
        ) : (
          <p className="font-sans text-sm text-muted">Só administradores podem alterar esta opção.</p>
        )}
      </form>

      {registro && (
        <p className="font-sans text-xs text-muted mt-6">
          Última alteração:{" "}
          {new Intl.DateTimeFormat("pt-BR", {
            dateStyle: "short",
            timeStyle: "short",
            timeZone: "America/Sao_Paulo",
          }).format(registro.updatedAt)}
        </p>
      )}
    </div>
  );
}
