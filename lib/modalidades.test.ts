import { test } from "node:test";
import assert from "node:assert/strict";
import { configModalidade, lerModalidade } from "./modalidades";

test("o teste respiratório virou duas turmas e não pergunta mais a modalidade", () => {
  assert.equal(configModalidade("testes-respiratorios-h2-ch4-h2s-teorico-pratico"), null);
  assert.equal(configModalidade("testes-respiratorios-h2-ch4-h2s-online"), null);
});

test("só aceita as duas modalidades", () => {
  assert.equal(lerModalidade("PRESENCIAL"), "PRESENCIAL");
  assert.equal(lerModalidade("ONLINE"), "ONLINE");
  assert.equal(lerModalidade("presencial"), null);
  assert.equal(lerModalidade(undefined), null);
});
