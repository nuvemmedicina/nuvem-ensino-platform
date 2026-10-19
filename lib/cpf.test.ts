import { test } from "node:test";
import assert from "node:assert/strict";
import { cpfValido, formatarCpf, temCpf } from "./cpf";

test("aceita CPF válido com e sem pontuação", () => {
  assert.equal(cpfValido("529.982.247-25"), true);
  assert.equal(cpfValido("52998224725"), true);
});

test("recusa dígito verificador errado", () => {
  assert.equal(cpfValido("529.982.247-24"), false);
  assert.equal(cpfValido("52998224735"), false);
});

test("recusa tamanho errado e dígitos repetidos", () => {
  assert.equal(cpfValido("5299822472"), false);
  assert.equal(cpfValido("111.111.111-11"), false);
  assert.equal(cpfValido(""), false);
});

test("formata só quando há 11 dígitos", () => {
  assert.equal(formatarCpf("52998224725"), "529.982.247-25");
  assert.equal(formatarCpf("123"), "123");
});

test("temCpf exige 11 dígitos", () => {
  assert.equal(temCpf("52998224725"), true);
  assert.equal(temCpf(null), false);
  assert.equal(temCpf("12.345.678/0001-90"), false);
});
