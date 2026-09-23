# Pendências de conteúdo científico para validação da Dra. Vera

Este arquivo lista trechos de conteúdo científico ou institucional encontrados durante a auditoria de medição e SEO (Etapa 0), que podem precisar de revisão. Nada aqui foi alterado. A tarefa de medição não edita ementa, descrição de técnica ou texto científico, então cada item abaixo só está listado, com o caminho exato, para que a Dra. Vera decida o que fazer.

## 1. Divergência entre "Roma IV" e "Roma V"

O código usa as duas versões dos critérios de Roma em lugares diferentes, sem que eu saiba dizer qual está correta para cada contexto:

- `messages/pt.json`, linha 73, e `messages/es.json`, linha 73: um selo de texto com o valor `"Roma V"`.
- `prisma/seed.ts`, linhas 324, 326, 327, 333, 337, 339, 340 e 699: curso sobre constipação intestinal, título, descrições e o nome de uma aula, todos citando `"Roma IV"` ("Classificação Roma IV").
- `app/[locale]/(admin)/admin/configuracoes/migrate-content/route.ts`, linha 130: objetivo de aprendizagem citando `"critérios Roma IV"`.
- `app/[locale]/(admin)/admin/configuracoes/run-migrations/route.ts`, linhas 468, 470 e 471: script de migração de banco de dados que busca e ajusta registros pelo texto `"ROMA V"`.
- `app/[locale]/(admin)/admin/configuracoes/migrate-dici/route.ts`, linhas 42 e 81: curso de DICI citando `"Critérios de Roma V"` e uma aula chamada "Introdução aos DICI e Critérios de Roma".

Ou seja: o curso sobre constipação intestinal usa "Roma IV" de forma consistente entre si, e o curso de DICI usa "Roma V" de forma consistente entre si. Não sei se isso é intencional (critérios diferentes se aplicam a cada tema) ou um erro de digitação em um dos dois cursos. Pergunta para a Dra. Vera: cada curso está com a versão certa dos critérios de Roma para o assunto que aborda, ou algum precisa de correção?

## 2. Uso do termo "Doenças Funcionais"

O prompt original desta tarefa pede que o termo "doenças funcionais" nunca seja usado, e que o termo correto é DGBIs (distúrbios da interação intestino-cérebro). Encontrei o termo em conteúdo público em:

- `app/[locale]/(public)/instrutores/page.tsx`, linha 28: biografia da Dra. Vera, citando "Professora Convidada da pós-graduação em Doenças Funcionais e Manometria pelo Hospital Israelita Albert Einstein" e "Tutora de treinamentos em doenças funcionais e testes respiratórios".
- `app/[locale]/(public)/instrutores/page.tsx`, linha 34: citação de autoria de um livro, "Doenças Funcionais em Gastrenterologia 2025".
- `app/[locale]/(public)/instrutores/page.tsx`, linha 56: "Pós-graduação em Doenças Funcionais, Instituto Israelita Albert Einstein".
- `app/[locale]/(standalone)/dra-vera/page.tsx`, linhas 60 e 64: títulos de curso ou tópico, "Métodos Diagnósticos em Doenças Funcionais e Motilidade Digestiva" e "Doenças Funcionais na Gastrenterologia".

Alguns desses casos parecem ser nomes próprios ou títulos oficiais (o nome de um livro publicado, o nome de um programa de pós-graduação de uma instituição), não uma escolha de terminologia do site. Não tenho como saber, sem a Dra. Vera confirmar, quais desses são citações factuais de nomes já fixados (e portanto não deveriam mudar) e quais são texto de marketing do próprio site, onde valeria trocar para DGBIs. Pergunta para a Dra. Vera: qual desses itens é nome próprio (livro, programa de pós-graduação) e qual é texto livre do site que pode ser atualizado para a terminologia DGBIs?
