import { test } from "node:test";
import assert from "node:assert/strict";
import { mostraNumeroDeVagas } from "./vagasExibicao";

test("por enquanto todos os cursos mostram o número de vagas", () => {
  assert.equal(mostraNumeroDeVagas("testes-respiratorios-h2-ch4-h2s-teorico-pratico"), true);
  assert.equal(mostraNumeroDeVagas("dici"), true);
});
