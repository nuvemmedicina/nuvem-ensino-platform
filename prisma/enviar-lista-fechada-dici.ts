/**
 * Convite com 50% no DICI para a lista fechada, cada pessoa com o seu código
 * pessoal (DICI50-XXXXX, uso único, até 08/11). A lista e os códigos estão em
 * campanha-dici/lista-fechada-50.csv, gerada junto com os cupons — o arquivo
 * tem dados pessoais e fica fora do git.
 *
 * Quem já se matriculou no DICI até a hora do envio fica de fora.
 *
 *   npx tsx prisma/enviar-lista-fechada-dici.ts            # simulação, nada sai
 *   npx tsx prisma/enviar-lista-fechada-dici.ts --previa   # grava a prévia em HTML, nada sai
 *   npx tsx prisma/enviar-lista-fechada-dici.ts --teste    # só para o e-mail de teste
 *   npx tsx prisma/enviar-lista-fechada-dici.ts --teste --para=email --nome=Nome  # teste para outra pessoa
 *   npx tsx prisma/enviar-lista-fechada-dici.ts --enviar   # dispara para todos
 */
import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { config } from "dotenv";
import { readFileSync, writeFileSync } from "fs";

config({ path: ".env.local" });

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const ARQUIVO = "campanha-dici/lista-fechada-50.csv";
const PREVIA = "campanha-dici/previa-email-lista-fechada.html";
const EMAIL_TESTE = "anapgs.mkt@gmail.com";
const VALIDO_ATE = "08/11, às 23h59";
const PAUSA_MS = 600; // respeita o limite de requisições da Resend
const EMAIL_ENTREGAVEL = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;
const CURSO_CONTAINS = "Aperfeiçoamento em DICI";

type Origem = "live de julho" | "aula gratuita" | "teste respiratório";
type Pessoa = { nome: string; email: string; origem: Origem; codigo: string; link: string };

/** Lê o CSV gerado com os cupons (separador ";", campos entre aspas, BOM no início). */
function lerLista(): Pessoa[] {
  const linhas = readFileSync(ARQUIVO, "utf8").replace(/^﻿/, "").split(/\r?\n/).filter(Boolean);
  const campos = (l: string) => [...l.matchAll(/"((?:[^"]|"")*)"/g)].map((m) => m[1].replace(/""/g, '"'));
  return linhas.slice(1).map((l) => {
    const [nome, email, , origens, codigo, link] = campos(l);
    // Quem está em mais de uma lista ("teste respiratório + live de julho") é
    // tratado pela primeira origem: é a que a pessoa mais reconhece.
    const origem = origens.split(" + ")[0] as Origem;
    return { nome, email, origem, codigo, link };
  });
}

/** "maria DA silva" → "Maria Da Silva": alguns cadastros vêm todo em minúsculas. */
const capitalizar = (nome: string) =>
  nome.replace(/\s+/g, " ").trim().toLowerCase().replace(/(^|\s)(\p{L})/gu, (_, s, l) => s + l.toUpperCase());

async function main() {
  const previa = process.argv.includes("--previa");
  const teste = process.argv.includes("--teste");
  const enviar = process.argv.includes("--enviar");
  if ([previa, teste, enviar].filter(Boolean).length > 1) {
    console.error("Use só um modo: --previa, --teste ou --enviar.");
    process.exitCode = 1;
    return;
  }

  const { montarConviteListaFechadaDici, sendConviteListaFechadaDici } = await import("@/lib/email");
  const lista = lerLista();

  if (previa) {
    // Uma prévia por origem, porque a primeira frase muda conforme a lista.
    const exemplos = (["live de julho", "aula gratuita", "teste respiratório"] as Origem[])
      .map((o) => lista.find((p) => p.origem === o))
      .filter((p): p is Pessoa => !!p);
    const partes = exemplos.map((p) => {
      const { subject, html } = montarConviteListaFechadaDici({
        nome: capitalizar(p.nome), origem: p.origem, codigo: p.codigo, link: p.link, validoAte: VALIDO_ATE,
      });
      return `<h2 style="font-family:Arial;padding:24px 16px 0">Origem: ${p.origem} · Assunto: ${subject}</h2>${html}`;
    });
    writeFileSync(PREVIA, partes.join("\n<hr/>\n"));
    console.log(`Prévia gravada em ${PREVIA} (${exemplos.length} versões). Nenhum e-mail saiu.`);
    return;
  }

  if (teste) {
    const destino = process.argv.find((a) => a.startsWith("--para="))?.split("=")[1] ?? EMAIL_TESTE;
    const nome = process.argv.find((a) => a.startsWith("--nome="))?.split("=")[1] ?? "Ana Paula";
    if (!EMAIL_ENTREGAVEL.test(destino)) {
      console.error(`Endereço de teste inválido: "${destino}"`);
      process.exitCode = 1;
      return;
    }
    const p = lista[0];
    const r = await sendConviteListaFechadaDici(destino, {
      nome, origem: p.origem, codigo: p.codigo, link: p.link, validoAte: VALIDO_ATE,
    });
    console.log(r.ok ? `OK enviado para ${destino}  (${r.id})` : `!! FALHOU — ${r.error}`);
    if (!r.ok) process.exitCode = 1;
    return;
  }

  // Quem se matriculou no DICI depois da lista ser gerada não recebe o convite.
  const matriculados = await prisma.enrollment.findMany({
    where: { course: { title: { contains: CURSO_CONTAINS } } },
    select: { user: { select: { email: true } } },
  });
  const jaAlunos = new Set(matriculados.map((m) => m.user.email.toLowerCase().trim()));

  const validos = lista.filter((p) => EMAIL_ENTREGAVEL.test(p.email) && !jaAlunos.has(p.email));
  const invalidos = lista.filter((p) => !EMAIL_ENTREGAVEL.test(p.email));
  const viraramAlunos = lista.filter((p) => jaAlunos.has(p.email));

  console.log(`Lista: ${lista.length}`);
  if (invalidos.length) {
    console.log(`\nE-mail inválido, não serão enviados (${invalidos.length}) — mande pelo WhatsApp:`);
    invalidos.forEach((p) => console.log(`~  "${p.email}"  ${p.nome}  ${p.codigo}`));
  }
  if (viraramAlunos.length) {
    console.log(`\nJá matriculados no DICI, ficam de fora (${viraramAlunos.length}):`);
    viraramAlunos.forEach((p) => console.log(`-  ${p.nome} <${p.email}>`));
  }
  console.log(`\nVão receber: ${validos.length}`);
  console.log(enviar ? "MODO ENVIO — os e-mails vão sair\n" : "SIMULAÇÃO — nenhum e-mail sai\n");

  let ok = 0;
  let falhas = 0;

  for (const p of validos) {
    if (!enviar) {
      console.log(`.  ${capitalizar(p.nome)} <${p.email}>  ${p.origem}  ${p.codigo}`);
      continue;
    }

    const r = await sendConviteListaFechadaDici(p.email, {
      nome: capitalizar(p.nome), origem: p.origem, codigo: p.codigo, link: p.link, validoAte: VALIDO_ATE,
    });
    if (r.ok) {
      ok++;
      console.log(`OK ${p.email}  (${r.id})`);
    } else {
      falhas++;
      console.log(`!! ${p.email}  FALHOU — ${r.error}`);
    }

    await new Promise((res) => setTimeout(res, PAUSA_MS));
  }

  if (enviar) {
    console.log(`\nEnviados: ${ok} | Falhas: ${falhas}`);
    console.log(`Cada envio ficou registrado em /admin/emails.`);
  } else {
    console.log(`\n${validos.length} receberiam o e-mail.`);
    console.log(`Rode com --previa ou --teste para ver como chega, ou --enviar para disparar.`);
  }
}

main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(() => prisma.$disconnect());
