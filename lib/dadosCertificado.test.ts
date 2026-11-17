import { test } from "node:test";
import assert from "node:assert/strict";
import { enderecoCompleto, validarDados } from "./dadosCertificado";

const completo = {
  nome: "  Maria   da Silva ",
  cpf: "529.982.247-25",
  telefone: "(31) 99999-0000",
  cep: "30150-310",
  rua: "Rua Ceará",
  numero: "600",
  complemento: "",
  bairro: "Santa Efigênia",
  cidade: "Belo Horizonte",
  uf: "MG",
};

test("aceita dados completos e normaliza", () => {
  const { dados, erros } = validarDados(completo);
  assert.deepEqual(erros, []);
  assert.equal(dados.nome, "Maria da Silva");
  assert.equal(dados.cpf, "52998224725");
  assert.equal(dados.telefone, "31999990000");
  assert.equal(dados.cep, "30150310");
});

test("aponta cada campo com problema", () => {
  const { erros } = validarDados({ ...completo, nome: "Maria", cpf: "111.111.111-11", uf: "XX", numero: "", complemento: "" });
  assert.deepEqual(erros.sort(), ["cpf", "nome", "numero", "uf"]);
});

test("RG e naturalidade não são mais pedidos", () => {
  assert.deepEqual(validarDados({ ...completo, rg: "", naturalidadeCidade: "" }).erros, []);
});

test("complemento é opcional", () => {
  assert.deepEqual(validarDados({ ...completo, complemento: "" }).erros, []);
});

test("monta o endereço numa linha", () => {
  assert.equal(
    enderecoCompleto({ address: "Quadra SQS 408 Bloco P", addressNumber: "0", addressComplement: "Apto. 201", province: "Asa Sul", city: "Brasília", state: "DF", postalCode: "70257160" }),
    "Quadra SQS 408 Bloco P, s/n - Apto. 201 - Asa Sul, Brasília - DF, CEP 70257-160",
  );
  assert.equal(enderecoCompleto({ address: null, addressNumber: null, addressComplement: null, province: null, city: null, state: null, postalCode: null }), "");
});
