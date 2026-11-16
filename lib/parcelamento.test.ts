import { test } from "node:test";
import assert from "node:assert/strict";
import { MAX_PARCELAS, maxParcelas } from "./parcelamento";
import { ofertaAtiva } from "./ofertas";

test("teste respiratório de 12/12 parcela só em até 2x", () => {
  const slug = "testes-respiratorios-h2-ch4-h2s-teorico-pratico";
  assert.equal(maxParcelas(slug), 2);
  assert.equal(ofertaAtiva(slug, new Date("2026-11-20T12:00:00-03:00"))?.parcelas, 2);
});

test("os demais cursos seguem o padrão", () => {
  assert.equal(maxParcelas("dici"), MAX_PARCELAS);
});
