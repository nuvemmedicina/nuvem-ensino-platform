import { test } from "node:test";
import assert from "node:assert/strict";
import { precoComOferta, rotuloDesconto } from "./ofertas";

const base = { slug: "x", cupom: "X", parcelas: 2, inicio: new Date(0), fim: new Date(0), fimLabel: "" };

test("desconto em reais: de R$ 799 por R$ 699", () => {
  const oferta = { ...base, descontoValor: 100 };
  assert.equal(precoComOferta(799, oferta), 699);
  assert.equal(rotuloDesconto(oferta), "R$ 100 OFF");
});

test("ofertas em porcentagem continuam iguais", () => {
  const oferta = { ...base, descontoPct: 30 };
  assert.equal(precoComOferta(1000, oferta), 700);
  assert.equal(rotuloDesconto(oferta), "30% OFF");
});
