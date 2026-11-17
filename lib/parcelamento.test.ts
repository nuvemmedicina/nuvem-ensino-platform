import { test } from "node:test";
import assert from "node:assert/strict";
import { MAX_PARCELAS, maxParcelas } from "./parcelamento";

test("teste respiratório de 12/12, ao vivo e gravação, parcela só em até 2x", () => {
  assert.equal(maxParcelas("testes-respiratorios-h2-ch4-h2s-teorico-pratico"), 2);
  assert.equal(maxParcelas("testes-respiratorios-h2-ch4-h2s-gravado"), 2);
});

test("os demais cursos seguem o padrão", () => {
  assert.equal(maxParcelas("dici"), MAX_PARCELAS);
});
