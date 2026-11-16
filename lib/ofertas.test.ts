import { test } from "node:test";
import assert from "node:assert/strict";
import { ofertaAtiva, precoComOferta, rotuloDesconto } from "./ofertas";

test("teste respiratório: de R$ 799 por R$ 699 até 11/12", () => {
  const slug = "testes-respiratorios-h2-ch4-h2s-teorico-pratico";
  const oferta = ofertaAtiva(slug, new Date("2026-11-20T12:00:00-03:00"));
  assert.ok(oferta);
  assert.equal(precoComOferta(799, oferta), 699);
  assert.equal(rotuloDesconto(oferta), "R$ 100 OFF");
  assert.equal(ofertaAtiva(slug, new Date("2026-12-12T08:00:00-03:00")), null);
});

test("ofertas em porcentagem continuam iguais", () => {
  const oferta = { slug: "x", cupom: "X", descontoPct: 30, parcelas: 5, inicio: new Date(0), fim: new Date(0), fimLabel: "" };
  assert.equal(precoComOferta(1000, oferta), 700);
  assert.equal(rotuloDesconto(oferta), "30% OFF");
});
