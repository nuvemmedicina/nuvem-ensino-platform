@AGENTS.md
# NUVEM ENSINO PLATFORM — CLAUDE.md

## Visão Geral
Plataforma LMS (Learning Management System) completa em Next.js 14+ para a empresa NU.V.E.M Ensino (CNPJ: 42.679.051/0001-31), especializada em educação médica continuada. Substitui o site WordPress atual em cursos.nuvemensino.com.br.

**Stack:** Next.js 14+ (App Router), TypeScript, Tailwind CSS, shadcn/ui, Prisma, PostgreSQL, NextAuth v5, Stripe, Mercado Pago, Mux (vídeo), Claude API (IA)

**Deploy:** Vercel (nuvem-ensino-s-projects.vercel.app) | GitHub: github.com/nuvemmedicina/nuvem-ensino-platform

---

## Identidade Visual

### Fontes
- **Títulos:** Cormorant Garamond (serif, elegante) — pesos 300, 400, 500, 600, 700 + itálico
- **Corpo/UI:** Inter (sans-serif, clean) — pesos 300, 400, 500, 600, 700
- Importar via next/font/google

### Paleta de Cores
```css
--color-surface: #0f0f1a;          /* Background base */
--color-primary: #1a1a2e;          /* Fundo principal */
--color-primary-light: #16213e;    /* Fundo secundário */
--color-surface-card: #1e1e30;     /* Cards */
--color-surface-border: #2a2a3e;   /* Bordas */
--color-accent: #c9a96e;           /* Dourado — cor principal de destaque */
--color-accent-hover: #b8935a;     /* Dourado escuro hover */
--color-text-primary: #f5f0e8;     /* Texto principal — branco quente */
--color-text-secondary: #a89880;   /* Texto secundário — bege */
--color-text-muted: #6b6b7b;       /* Texto desabilitado */
```

### Estilo Geral
- Dark premium médico elegante
- Fundo escuro azul-marinho profundo
- Destaques em dourado/champagne
- Títulos em Cormorant Garamond com itálico nas palavras-chave
- Espaçamento generoso
- Botão primário: fundo dourado + texto escuro
- Botão secundário: borda dourada + texto dourado

---

## Cursos Atuais (migrar do WordPress)

### Hands-On (Presenciais)
- Manometria de Alta Resolução, pHmetria e Impedância — R$ 6.500
- Testes Respiratórios de H₂, CH₄ e H₂S — R$ 2.200 (8h) — Dra. Vera Ângelo
- Fisioterapia nas Disfunções do Assoalho Pélvico — R$ 3.500 (30h)

### Online
- Aperfeiçoamento em Teste Respiratório H₂ e CH₄ — R$ 450
- Doenças da Cavidade Oral, Halimetria e Sialometria — R$ 450 (3h16m)
- Desvendando a Constipação Intestinal — R$ 380
- Teste Respiratório: SIBO, IMO, LIBO e SIFO — gratuito

### Instrutores
- Dra. Vera Ângelo — Gastroenterologista
- Dra. Eliane Basques — Cirurgia Pediátrica
- Dra. Karol Rocha — Fisioterapia Pélvica
- Dr. Felipe Nelson — Gastroenterologista

---

## Módulos do Sistema

### 1. Portal Público
- Home com hero, cursos em destaque, instrutores e depoimentos
- Catálogo com filtro por categoria (Hands-On / Online), especialidade e preço
- Página individual de curso com ementa, carga horária, vagas e preview
- Blog, galeria e SEO avançado

### 2. Pagamentos
- Stripe — pagamento internacional (cartão, Apple Pay, Google Pay)
- Mercado Pago — PIX, boleto, parcelamento
- Cupons de desconto e sistema de vagas com percentual reservado
- Reembolsos automáticos

### 3. Área do Aluno
- Dashboard com cursos, progresso e certificados
- Player de vídeo (Mux) com controle de progresso e velocidade
- Materiais por aula (PDFs, slides)
- Anotações pessoais e quizzes
- Certificado digital com QR Code de autenticidade

### 4. Aulas ao Vivo
- Integração Google Meet (criar sala direto pela plataforma)
- Google Calendar (aluno adiciona evento com 1 clique)
- Notificações automáticas 24h e 1h antes
- Gravação automática disponibilizada após aula

### 5. Chat IA (Assistente Nuvete)
- Baseado na Claude API (Anthropic)
- Contexto médico especializado
- Atalhos: "Resumir aula", "Criar flashcards", "Perguntas de revisão"
- Disponível na área do aluno e na landing page

### 6. Painel Admin
- CRUD de cursos, módulos, aulas e materiais
- Upload de vídeos via Mux
- Gestão de alunos, turmas e matrículas
- Dashboard de receita e relatórios

---

## Regras de Desenvolvimento

- Sempre usar Next.js 14+ com App Router
- TypeScript estrito em todos os arquivos
- Tailwind CSS + shadcn/ui para componentes
- Prisma como ORM com PostgreSQL
- Nunca armazenar dados de cartão (delegar ao Stripe/Mercado Pago)
- Sempre responder e comentar código em português brasileiro
- Commits em inglês no padrão conventional commits (feat:, fix:, chore:)
- Componentes em /components, páginas em /app, utilitários em /lib

---

## Contato e Referências
- Site atual: https://cursos.nuvemensino.com.br
- Clínica: https://nuvemmedicina.com.br
- Email: cursos@nuvemensino.com.br
- WhatsApp: (31) 99726-1029
- Localização: Belo Horizonte — MG