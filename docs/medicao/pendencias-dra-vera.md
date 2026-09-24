# Pendências de conteúdo científico para validação da Dra. Vera

Este arquivo lista trechos de conteúdo científico ou institucional encontrados durante a auditoria de medição e SEO (Etapa 0), que podem precisar de revisão. Nada aqui foi alterado sem confirmação. A tarefa de medição não edita ementa, descrição de técnica ou texto científico por conta própria, então cada item abaixo ficou listado até a usuária confirmar o que fazer.

## 1. Divergência entre "Roma IV" e "Roma V" — respondido em 24/09

Pergunta original: o curso sobre constipação intestinal (`prisma/seed.ts`) cita "Roma IV", o curso de DICI (`migrate-dici/route.ts`) cita "Roma V", sem eu saber se isso era intencional ou erro de digitação.

**Resposta:** Roma V é a classificação nova, atualizada em 2026. O curso de constipação intestinal que cita "Roma IV" está descontinuado, porque vai ser atualizado com os novos critérios do Roma V. Ou seja, o texto atual ("Roma IV") reflete o estado real do curso hoje (versão antiga, pausada), não é erro nem precisa de correção agora. Nenhuma edição feita, por ser justamente conteúdo científico de um curso pendente de atualização própria, fora do escopo desta tarefa.

## 2. Uso do termo "Doenças Funcionais" — respondido em 24/09

Pergunta original: quais das quatro menções ao termo "Doenças Funcionais" eram nome próprio/título oficial (e por isso não deveriam mudar) e quais eram texto livre do site (onde valeria trocar para DGBIs).

**Resposta:** nenhuma delas é nome próprio ou título oficial, exceto uma citação de livro à parte que a usuária confirmou separadamente. Com isso:

- `app/[locale]/(public)/instrutores/page.tsx`, bio da Dra. Vera ("pós-graduação em Doenças Funcionais e Manometria...", "treinamentos em doenças funcionais..."): **atualizado para DGBIs.**
- `app/[locale]/(public)/instrutores/page.tsx`, formação da Dra. Eliane ("Pós-graduação em Doenças Funcionais, Instituto Israelita Albert Einstein"): **atualizado para DGBIs.**
- `app/[locale]/(public)/instrutores/page.tsx`, linha da autoria "Doenças Funcionais em Gastrenterologia 2025": **mantido sem alteração.** A usuária confirmou que é o título real e publicado do livro, mudar o nome seria inventar um título que não existe.
- `app/[locale]/(standalone)/dra-vera/page.tsx`, "Métodos Diagnósticos em Doenças Funcionais e Motilidade Digestiva" e "Doenças Funcionais na Gastrenterologia": **mantidos sem alteração.** Ao reler o código antes de editar, percebi que esses dois não são títulos de curso/tópico como eu tinha descrito antes por engano, são **títulos de livros publicados**, cada um com link direto para a página do livro na editora Rubio, ISBN incluído no próprio endereço. Mesma categoria do item acima, citação factual de obra publicada, não texto de marketing do site.
