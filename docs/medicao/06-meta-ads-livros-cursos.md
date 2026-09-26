# Meta Ads (Instagram e Facebook): campanhas de Livros e Cursos, passo a passo

Duas campanhas novas no Gerenciador de Anúncios do Meta (business.facebook.com), orçamento inicial combinado de R$ 500/mês, dividido R$ 300 cursos + R$ 200 livros. O Pixel do Meta já está instalado e testado desde a Etapa 4 do projeto de medição (`docs/medicao/03-etapa4-passos-manuais.md`), então a maior parte do trabalho aqui é configuração de campanha, não instrumentação nova.

## Antes de começar

- Confirme no **Gerenciador de Eventos** (Business Manager → Fontes de dados → o Pixel `1355104133372437`) que os eventos `PageView`, `InitiateCheckout` e `Lead` continuam chegando (mesma checagem da Etapa 4). Se algum parou de chegar, resolve isso antes de criar campanha nova.
- O evento `Purchase` (compra confirmada) é mandado direto do servidor via API de Conversões, não aparece no Gerenciador de Eventos do mesmo jeito que os do navegador, mas já está implementado e testado (ver `docs/medicao/00-auditoria.md`, seção da Etapa 4).
- O evento novo (`ViewContent`, clique em comprar livro) só passa a existir depois de você aplicar o passo do Tag Manager em `docs/medicao/04-livros-clique-compra.md`, seção "Mesmo clique, agora também pro Meta Pixel".

---

## Campanha 1: Livros

**Configuração**
- Objetivo: **Tráfego**
- Orçamento: R$ 200/mês (~R$ 7/dia)
- Posicionamento: Automático (Vantagem+), deixa o Meta escolher Feed, Stories e Reels do Instagram e Facebook
- Local: Brasil · Idade: 25–65
- Destino do anúncio: `https://www.nuvemensino.com.br/livros`

**Público**
- Interesses: Gastroenterologia, Medicina, Fisioterapia
- Cargo (dado demográfico do Meta): médico, fisioterapeuta, estudante de medicina
- Sem público semelhante (lookalike) nesta primeira fase: precisa de uma base de conversões do Pixel que ainda não existe. Entra numa segunda fase, depois que o `ViewContent` acumular volume.

**Criativo: carrossel**

Um cartão por livro, usando as capas já publicadas em `nuvemensino.com.br/livros` (mesmos arquivos de `public/books/`). Texto principal e título sugeridos:

- Texto principal: "Livros da Dra. Vera Ângelo pela Editora Rubio. Gastroenterologia, doenças funcionais e testes respiratórios."
- Título: "Livros da Dra. Vera Ângelo"
- Botão: "Saiba mais"

---

## Campanha 2: Cursos

**Configuração**
- Objetivo: **Vendas**, otimizado pelo evento `Purchase`
- Orçamento: R$ 300/mês (~R$ 10/dia)
- Posicionamento: Automático (Vantagem+)
- Local: Brasil · Idade: 25–65
- Destino do anúncio: `https://www.nuvemensino.com.br/cursos`

**Público**
- Interesses: Gastroenterologia, Motilidade digestiva, Fisioterapia pélvica
- Cargo: médico, fisioterapeuta, residente

**Criativo: imagem única**

Foto de uma instrutora ou da clínica (por exemplo `public/aula-ao-vivo.jpeg`, ou outra que você preferir).

- Texto principal: "Cursos teórico-práticos em gastroenterologia, motilidade digestiva e fisioterapia pélvica, com a Dra. Vera Ângelo e outros especialistas."
- Título: "Cursos com Dra. Vera Ângelo"
- Botão: "Inscreva-se"

---

## Conferindo antes de publicar

No Gerenciador de Eventos, use a aba **Testar eventos** com o Pixel Helper (extensão do Chrome) ou o próprio painel de teste do Meta: navegue pelo site em uma aba anônima, aceite o cookie de publicidade, clique em "Comprar" num livro e confirme que `ViewContent` aparece com o nome do livro certo. Só depois de confirmar isso, tire as duas campanhas do modo rascunho.

## Depois de publicado

O Meta mantém as campanhas em "aprendizado" até acumular eventos suficientes (o próprio painel avisa quando sai dessa fase, geralmente ~50 conversões em 7 dias por conjunto de anúncios). Evite pausar ou editar o anúncio nesse período, cada edição reinicia o aprendizado. Acompanhe custo por resultado depois da primeira semana e ajuste orçamento com base em dado real, mesmo cronograma de 2 a 4 semanas usado para o Google Ads.
