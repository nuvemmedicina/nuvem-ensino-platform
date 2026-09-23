import { test } from "node:test";
import assert from "node:assert/strict";
import { isSensitivePath, sanitizePathAndSearch, sanitizeAbsoluteUrl } from "./analyticsSanitize";

test("mantém apenas parâmetros utm_*", () => {
  const url = sanitizePathAndSearch("/cursos/fisioterapia-respiratoria", "utm_source=google&utm_campaign=verao&ref=xyz");
  assert.equal(url, "/cursos/fisioterapia-respiratoria?utm_source=google&utm_campaign=verao");
});

test("remove todo parâmetro quando não há nenhum utm", () => {
  const url = sanitizePathAndSearch("/cursos", "sessao=abc123");
  assert.equal(url, "/cursos");
});

test("nunca envia parâmetro em rota de checkout, mesmo utm", () => {
  const url = sanitizePathAndSearch("/checkout/dici-neurogastroenterologia-2026", "utm_source=google&session_id=cs_test_abc123");
  assert.equal(url, "/checkout/dici-neurogastroenterologia-2026");
});

test("nunca envia parâmetro na área do aluno", () => {
  const url = sanitizePathAndSearch("/dashboard/cursos/fisioterapia-respiratoria", "sucesso=1");
  assert.equal(url, "/dashboard/cursos/fisioterapia-respiratoria");
});

test("reconhece rota sensível com prefixo de idioma (en/es)", () => {
  assert.equal(isSensitivePath("/en/dashboard/perfil"), true);
  assert.equal(isSensitivePath("/es/checkout/dici-neurogastroenterologia-2026"), true);
  assert.equal(isSensitivePath("/en/courses/fisioterapia-respiratoria"), false);
});

test("nunca deixa passar e-mail, telefone ou identificador de pagamento em nenhum parâmetro, mesmo sob um nome de chave inofensivo", () => {
  const armadilhas = "email=aluno@exemplo.com&telefone=31999999999&session_id=cs_live_abc&payment_intent=pi_abc&cpf=11122233344";
  const url = sanitizePathAndSearch("/cursos/fisioterapia-respiratoria", armadilhas);
  assert.equal(url, "/cursos/fisioterapia-respiratoria");
  assert.doesNotMatch(url, /@|\d{9,}/);
});

test("sanitiza referrer absoluto, removendo tudo que não é utm", () => {
  const url = sanitizeAbsoluteUrl("https://www.nuvemensino.com.br/entrar?callbackUrl=%2Fdashboard&email=aluno@exemplo.com");
  assert.equal(url, "https://www.nuvemensino.com.br/entrar");
});

test("referrer absoluto inválido não derruba a chamada", () => {
  assert.equal(sanitizeAbsoluteUrl(""), undefined);
  assert.equal(sanitizeAbsoluteUrl("não é uma url"), undefined);
});

test("preserva múltiplos utms na ordem permitida", () => {
  const url = sanitizePathAndSearch("/", "utm_source=instagram&utm_medium=social&utm_campaign=lancamento&utm_content=post1&utm_term=fisioterapia");
  assert.equal(
    url,
    "/?utm_source=instagram&utm_medium=social&utm_campaign=lancamento&utm_content=post1&utm_term=fisioterapia"
  );
});
