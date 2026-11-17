import { test } from "node:test";
import assert from "node:assert/strict";
import { mostraNumeroDeVagas } from "./vagasExibicao";

test("teste respiratório presencial mostra só 'Vagas limitadas'", () => {
  assert.equal(mostraNumeroDeVagas("testes-respiratorios-h2-ch4-h2s-teorico-pratico"), false);
});

test("os demais cursos continuam mostrando o número", () => {
  assert.equal(mostraNumeroDeVagas("testes-respiratorios-h2-ch4-h2s-online"), true);
});
