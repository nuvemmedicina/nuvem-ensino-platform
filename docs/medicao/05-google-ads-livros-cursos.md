# Google Ads: campanhas de Livros e Cursos, passo a passo

Duas campanhas de Pesquisa, configuradas do zero na conta do Google Ads (não usar o rascunho antigo que já estava em andamento, esse é de outra coisa). Este documento é o passo a passo técnico; a apresentação em slides para a Dra. Vera cobre a mesma estrutura de forma resumida.

## Antes de começar

- Confirme no admin (`/admin/cursos`) os slugs e datas de turma atuais de cada curso antes de definir a URL final de cada grupo de anúncio da campanha de Cursos. O `seed.ts` do repositório pode estar desatualizado em relação ao que está publicado (já aconteceu antes, com o curso de fisioterapia pélvica).
- As duas campanhas têm objetivo **Tráfego do site**, não "Vendas": no caso dos livros porque a venda acontece na Rubio, fora do nosso domínio; no caso dos cursos porque ainda não vinculamos o GA4 ao Google Ads (passo final deste documento resolve isso, depois é possível trocar pra otimização por conversão).

---

## Campanha 1: Livros

**Configuração**
- Tipo: Pesquisa
- Redes: só Rede de Pesquisa (desmarcar parceiros de pesquisa e Display)
- Local: Brasil · Idioma: Português
- Lance: Maximizar cliques
- Orçamento: sugestão R$ 30–50/dia
- URL final: `https://www.nuvemensino.com.br/livros`

**Grupos de anúncio**

| Grupo | Palavras-chave (frase) |
|---|---|
| Testes Respiratórios | "livro testes respiratórios gastroenterologia", "livro hidrogênio metano gastro", "teste respiratório H2 CH4 livro" |
| Doenças Funcionais / DGBIs | "livro doenças funcionais gastroenterologia", "livro DGBIs", "doenças funcionais gastrenterologia livro" |
| Autora | "livros Vera Ângelo Andrade", "Dra Vera Ângelo livros", "Vera Lúcia Ângelo Andrade Rubio" |
| Manuais e casos clínicos | "manual terapêutica gastroenterologia", "livro casos comentados gastroenterologia", "manual gastroenterologia hepatologia" |

**Negativas:** grátis, pdf, download, resumo, resenha

**Anúncio responsivo de pesquisa**

Títulos: Livros da Dra. Vera Ângelo · Gastroenterologia e DGBIs · Editora Rubio | Nuvem Ensino · Testes Respiratórios em Gastro · Doenças Funcionais na Gastro · 8 Livros Publicados · Compra Direto na Rubio · Conteúdo de Referência Médica

Descrições:
- Conheça os livros publicados pela Dra. Vera Ângelo Andrade pela Editora Rubio, sobre gastroenterologia e doenças funcionais.
- Testes respiratórios, doenças funcionais, métodos diagnósticos e mais. Veja os 8 títulos e compre direto na Rubio.

Sitelink: "Conheça os Cursos" → `nuvemensino.com.br/cursos`

---

## Campanha 2: Cursos

**Configuração**
- Tipo: Pesquisa
- Redes: só Rede de Pesquisa
- Local: Brasil · Idioma: Português
- Lance: Maximizar cliques
- Orçamento: sugestão R$ 50–85/dia (R$ 1.500–2.500/mês, mesma faixa já apresentada no plano de marketing de setembro)
- URL final: por grupo, ver abaixo (confirmar slug atual no admin antes de publicar)

**Grupos de anúncio**

| Grupo | Palavras-chave (frase) | URL final sugerida (confirmar slug) |
|---|---|---|
| Testes Respiratórios | "curso teste respiratório hidrogênio metano", "curso SIBO teste respiratório", "curso teste respiratório H2 CH4" | `/cursos/testes-respiratorios-h2-ch4-h2s-outubro` (turma presencial confirmada em `nuvemensino.com.br/links`) |
| Motilidade Digestiva / DGBIs | "curso manometria esofágica", "curso motilidade digestiva", "curso DGBIs" | `/cursos/dici-neurogastroenterologia-2026` |
| Fisioterapia Pélvica | "curso fisioterapia pélvica", "curso disfunções assoalho pélvico", "treinamento fisioterapia pélvica" | `/cursos/fisioterapia-pelvica` |
| Doenças da Cavidade Oral | "curso halimetria sialometria", "curso doenças cavidade oral gastro" | `/cursos/doencas-da-cavidade-oral-halimetria-e-sialometria` |

**Anúncio responsivo de pesquisa**

Títulos: Cursos com Dra. Vera Ângelo · Formação em Gastroenterologia · Testes Respiratórios H2/CH4 · Fisioterapia Pélvica · DGBIs e Motilidade Digestiva · Hands-On e Online · NU.V.E.M ENSINO

Descrições:
- Cursos teórico-práticos em gastroenterologia, motilidade digestiva e fisioterapia pélvica, com especialistas da NU.V.E.M Medicina.
- Turmas hands-on e cursos online. Conheça a grade completa de cursos da NU.V.E.M ENSINO.

Sitelink: "Livros da Dra. Vera" → `nuvemensino.com.br/livros`

---

## Depois de publicar as duas: vincular conversões

1. No GA4: **Administrador → Eventos**, marcar como conversão:
   - `select_content` (clique em comprar livro, ver `docs/medicao/04-livros-clique-compra.md`)
   - `purchase`, `begin_checkout` e `sign_up` (cursos, já implementados desde a Etapa 3)
2. No Google Ads: **Ferramentas e configurações → Conversões → Nova ação de conversão → Importar → Google Analytics (GA4)**, selecionar essas conversões.
3. Depois de alguns dias com dado real, trocar o lance de "Maximizar cliques" para "Maximizar conversões" em cada campanha.

## Teste antes de publicar

Para as duas campanhas: usar o **Google Ads Editor** ou salvar como rascunho e revisar cada anúncio (não existe Preview igual ao Tag Manager aqui, a checagem é visual mesmo, no próprio painel de pré-visualização do anúncio). Só publicar (tirar a campanha de pausada) depois de revisar.
