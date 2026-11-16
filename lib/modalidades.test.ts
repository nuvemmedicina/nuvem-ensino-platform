import { test } from "node:test";
import assert from "node:assert/strict";
import { configModalidade, lerModalidade } from "./modalidades";

test("teste respiratório de 12/12 pergunta a modalidade, com 30 presenciais", () => {
  assert.equal(configModalidade("testes-respiratorios-h2-ch4-h2s-teorico-pratico")?.vagasPresenciais, 30);
  assert.equal(configModalidade("dici"), null);
});

test("só aceita as duas modalidades", () => {
  assert.equal(lerModalidade("PRESENCIAL"), "PRESENCIAL");
  assert.equal(lerModalidade("ONLINE"), "ONLINE");
  assert.equal(lerModalidade("presencial"), null);
  assert.equal(lerModalidade(undefined), null);
});
