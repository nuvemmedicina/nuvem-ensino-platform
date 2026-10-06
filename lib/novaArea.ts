import { cache } from "react";
import { prisma } from "@/lib/prisma";

/**
 * Chave liga/desliga da nova área do aluno (redesenho de outubro/2026).
 *
 * A nova interface é construída ao lado da atual e liberada em etapas:
 * primeiro só para a equipe (ADMIN e EDITOR), depois para todos. Voltar a
 * "desligada" devolve todo mundo à versão atual na hora, sem perder
 * progresso, notas ou certificados, porque os dados são os mesmos.
 *
 * O valor fica em PlatformSetting e é alterado em /admin/configuracoes/area-do-aluno.
 */
export const CHAVE_NOVA_AREA = "nova_area_aluno";

export const MODOS_NOVA_AREA = ["desligada", "equipe", "todos"] as const;
export type ModoNovaArea = (typeof MODOS_NOVA_AREA)[number];

export function ehModoNovaArea(valor: unknown): valor is ModoNovaArea {
  return typeof valor === "string" && (MODOS_NOVA_AREA as readonly string[]).includes(valor);
}

/** Lida uma vez por requisição; qualquer valor inesperado conta como desligada. */
export const lerModoNovaArea = cache(async (): Promise<ModoNovaArea> => {
  const registro = await prisma.platformSetting.findUnique({ where: { key: CHAVE_NOVA_AREA } });
  return ehModoNovaArea(registro?.value) ? registro.value : "desligada";
});

/** Se esta pessoa deve ver a nova área do aluno, dado o papel dela. */
export async function usaNovaArea(role: string | undefined): Promise<boolean> {
  const modo = await lerModoNovaArea();
  if (modo === "todos") return true;
  if (modo === "equipe") return role === "ADMIN" || role === "EDITOR";
  return false;
}
