"use client";

import { useMemo, useState, useTransition } from "react";
import { Send } from "lucide-react";
import type { AlunoFacop } from "@/lib/certificadosFacop";
import { pedirDadosCertificado, type ResultadoPedido } from "./actions";

const th = "px-4 py-3 text-left font-sans text-xs font-semibold text-muted uppercase tracking-wider";
const filtroCls =
  "font-sans text-sm px-3 py-2 rounded-lg border border-border bg-surface text-foreground focus:outline-none focus:border-primary/50";

type Situacao = "todos" | "sem-pedido" | "aguardando" | "recebidos";

const data = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }) : "");

export function TabelaFacop({ alunos, totalAulas, totalProvas }: { alunos: AlunoFacop[]; totalAulas: number; totalProvas: number }) {
  const [minProvas, setMinProvas] = useState(totalProvas > 0 ? Math.max(totalProvas - 1, 1) : 0);
  const [situacao, setSituacao] = useState<Situacao>("todos");
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
  const [resultado, setResultado] = useState<ResultadoPedido | null>(null);
  const [erro, setErro] = useState("");
  const [enviando, iniciar] = useTransition();

  const visiveis = useMemo(
    () =>
      alunos.filter((a) => {
        if (a.provasAprovadas < minProvas) return false;
        if (situacao === "sem-pedido") return !a.pedidoEm;
        if (situacao === "aguardando") return !!a.pedidoEm && !a.respondidoEm;
        if (situacao === "recebidos") return !!a.respondidoEm;
        return true;
      }),
    [alunos, minProvas, situacao],
  );

  const todosMarcados = visiveis.length > 0 && visiveis.every((a) => selecionados.has(a.enrollmentId));
  const alternar = (id: string) =>
    setSelecionados((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  const alternarTodos = () =>
    setSelecionados((s) => {
      const n = new Set(s);
      if (todosMarcados) visiveis.forEach((a) => n.delete(a.enrollmentId));
      else visiveis.forEach((a) => n.add(a.enrollmentId));
      return n;
    });

  function enviar() {
    const ids = [...selecionados];
    const jaPedidos = alunos.filter((a) => selecionados.has(a.enrollmentId) && a.pedidoEm).length;
    const aviso = jaPedidos ? `\n\n${jaPedidos} já tinham recebido o pedido e vão receber o e-mail de novo.` : "";
    if (!window.confirm(`Enviar o pedido de dados do certificado por e-mail para ${ids.length} aluno(s)?${aviso}`)) return;
    setErro("");
    setResultado(null);
    iniciar(async () => {
      try {
        setResultado(await pedirDadosCertificado(ids));
        setSelecionados(new Set());
      } catch (e) {
        setErro(e instanceof Error ? e.message : "Não foi possível enviar.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <label className="font-sans text-sm text-muted flex items-center gap-2">
          Provas aprovadas
          <select value={minProvas} onChange={(e) => setMinProvas(Number(e.target.value))} className={filtroCls}>
            {Array.from({ length: totalProvas + 1 }, (_, n) => (
              <option key={n} value={n}>
                {n === 0 ? "qualquer número" : n === totalProvas ? `todas (${n})` : `${n} ou mais`}
              </option>
            ))}
          </select>
        </label>
        <label className="font-sans text-sm text-muted flex items-center gap-2">
          Situação
          <select value={situacao} onChange={(e) => setSituacao(e.target.value as Situacao)} className={filtroCls}>
            <option value="todos">Todas</option>
            <option value="sem-pedido">Ainda sem pedido</option>
            <option value="aguardando">Aguardando resposta</option>
            <option value="recebidos">Dados recebidos</option>
          </select>
        </label>
        <span className="font-sans text-sm text-muted">{visiveis.length} aluno(s)</span>

        <button
          type="button"
          onClick={enviar}
          disabled={selecionados.size === 0 || enviando}
          className="ml-auto inline-flex items-center gap-2 min-h-[44px] px-5 rounded-full bg-primary text-white font-sans text-sm font-semibold hover:bg-primary/90 disabled:opacity-50"
        >
          <Send className="w-4 h-4" aria-hidden="true" />
          {enviando ? "Enviando…" : `Pedir dados aos selecionados (${selecionados.size})`}
        </button>
      </div>

      <div aria-live="polite" className="font-sans text-sm">
        {resultado && (
          <p className={`rounded-xl px-4 py-3 ${resultado.falhas.length ? "bg-amber-50 text-amber-900" : "bg-green-50 text-green-900"}`}>
            {resultado.enviados} e-mail(s) enviado(s).
            {resultado.falhas.length > 0 && ` Não chegaram: ${resultado.falhas.join(", ")} (veja em E-mails).`}
          </p>
        )}
        {erro && <p className="rounded-xl px-4 py-3 bg-red-50 text-red-800">{erro}</p>}
      </div>

      <div className="bg-surface border border-border rounded-2xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-background">
              <th className="px-4 py-3 w-10">
                <input type="checkbox" checked={todosMarcados} onChange={alternarTodos} aria-label="Selecionar todos os alunos visíveis" className="w-4 h-4 accent-[#00475E]" />
              </th>
              <th className={th}>Aluno</th>
              <th className={th}>Aulas</th>
              <th className={th}>Provas</th>
              <th className={`${th} hidden md:table-cell`}>Última aula</th>
              <th className={th}>Pedido de dados</th>
              <th className={`${th} hidden lg:table-cell`}>Falta no cadastro</th>
            </tr>
          </thead>
          <tbody>
            {visiveis.map((a) => (
              <tr key={a.enrollmentId} className="border-b border-border last:border-0 hover:bg-background/60">
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selecionados.has(a.enrollmentId)}
                    onChange={() => alternar(a.enrollmentId)}
                    aria-label={`Selecionar ${a.nome}`}
                    className="w-4 h-4 accent-[#00475E]"
                  />
                </td>
                <td className="px-4 py-3">
                  <p className="font-sans font-semibold text-foreground">{a.nome}</p>
                  <p className="font-sans text-xs text-muted">{a.email}</p>
                </td>
                <td className="px-4 py-3 font-sans tabular-nums whitespace-nowrap">
                  {a.aulas}/{totalAulas}
                  <span className="text-muted text-xs"> · {totalAulas ? Math.round((100 * a.aulas) / totalAulas) : 0}%</span>
                </td>
                <td className="px-4 py-3 font-sans tabular-nums">
                  <span className={a.provasAprovadas === totalProvas && totalProvas > 0 ? "font-semibold text-green-800" : ""}>
                    {a.provasAprovadas}/{totalProvas}
                  </span>
                </td>
                <td className="px-4 py-3 font-sans text-muted hidden md:table-cell">{data(a.ultimaAtividade) || "nunca"}</td>
                <td className="px-4 py-3 font-sans whitespace-nowrap">
                  {a.respondidoEm ? (
                    <span className="inline-flex px-2.5 py-1 rounded-full bg-green-100 text-green-900 text-xs font-semibold">Recebido {data(a.respondidoEm)}</span>
                  ) : a.pedidoEm ? (
                    <span className="inline-flex px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-semibold">Pedido {data(a.pedidoEm)}</span>
                  ) : (
                    <span className="text-muted text-xs">Sem pedido</span>
                  )}
                </td>
                <td className="px-4 py-3 font-sans text-xs text-muted hidden lg:table-cell">{a.faltando.join(", ") || "Nada"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
