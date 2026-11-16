import { test } from "node:test";
import assert from "node:assert/strict";
import { destinoSeguro } from "./destinoSeguro";

test("mantém caminhos do site, com o cupom", () => {
  assert.equal(destinoSeguro("/checkout/curso?cupom=RESPIRA100"), "/checkout/curso?cupom=RESPIRA100");
});

test("recusa endereços externos", () => {
  assert.equal(destinoSeguro("https://outro.site"), "/dashboard");
  assert.equal(destinoSeguro("//outro.site"), "/dashboard");
  assert.equal(destinoSeguro("/\\outro.site"), "/dashboard");
  assert.equal(destinoSeguro(null), "/dashboard");
});
