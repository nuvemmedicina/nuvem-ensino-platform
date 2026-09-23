# Auditoria inicial de medição, pagamento e SEO técnico

Data da auditoria: 21 de setembro de 2026. Repositório: nuvem-ensino-platform, branch claude/medicao-e-indexacao, criado a partir de main (commit 4e205c5).

Esta etapa foi só leitura. Nenhum arquivo de código foi alterado. O que se lê abaixo é o que o código, o histórico do git e os arquivos de configuração mostram, com a distinção clara entre evidência (o que está escrito no repositório) e hipótese (uma explicação possível, ainda não confirmada).

## Resumo em uma leitura

A tag do Google Analytics 4 já está instalada no código, mas fica condicionada a uma variável de ambiente chamada `NEXT_PUBLIC_GA_ID`, que não está documentada no `.env.example` e cujo valor em produção eu não tenho como conferir. Se essa variável não estiver definida na Vercel, ou estiver definida com outro nome, a tag simplesmente não carrega, e isso por si só explicaria "nenhum dado recebido" sem precisar de nenhuma outra causa. Não há Consent Mode, não há banner de consentimento, e não há nenhuma sanitização de URL antes do envio da página vista: hoje, se a tag estivesse ativa, ela enviaria a URL completa, incluindo qualquer parâmetro de busca, em toda página do site, inclusive dentro da área do aluno e do checkout. Nas URLs de retorno de pagamento que encontrei, porém, não há parâmetro com e-mail ou identificador de transação: elas parecem ter sido desenhadas de propósito para ficar limpas. Registro isso como ponto de atenção mesmo assim, porque o gateway Asaas redireciona por conta própria depois do pagamento, e eu não tenho como confirmar se ele acrescenta algo à URL nesse redirecionamento.

Existe também PostHog já em uso, tanto no navegador quanto no servidor, capturando visualizações de página (com a URL completa, incluindo parâmetros de busca) e eventos como aula concluída e curso concluído. Não vi e-mail, nome, telefone ou CPF em nenhum payload desses eventos, mas o PostHog é uma camada de medição que já roda hoje e que a regra de privacidade deste projeto também alcança, então trago isso à atenção da usuária mesmo sem ter sido mencionado no diagnóstico inicial.

Do lado técnico de SEO, a maior parte das páginas públicas tem canonical e hreflang corretos, por página e por idioma. Encontrei duas páginas públicas (`/dra-vera` e `/live`) sem nenhuma metadata própria, o que faz com que herdem o canonical padrão do layout raiz, apontando para a home, e não para elas mesmas. Encontrei também um link no rodapé do site, presente em todas as páginas e nos três idiomas, apontando para `/contato`, uma rota que não existe no código: é um link morto.

Sobre a queda de cliques de busca entre 7 e 9 de agosto: não há nenhum commit no histórico do git nesse intervalo, nem em nenhum dia entre 3 e 16 de agosto. Isso não explica a causa, mas descarta, com razoável segurança, que uma alteração de código ou um deploy tenha disparado a queda nesses dias específicos. O commit mais relevante que encontrei sobre domínio é de 30 de julho, oito dias antes da janela observada, e trata de unificar um domínio antigo (`cursos.nuvemmedicina.com.br`, que não existe mais) que antes aparecia como valor padrão em partes do código quando a variável de ambiente não estava configurada. Registro isso como dado observado e como hipótese, nunca como conclusão.

## 1. Medição atual

### Google Analytics 4

A tag está implementada em `app/[locale]/layout.tsx`, linha 13 e linhas 134 a 150. O código lê `process.env.NEXT_PUBLIC_GA_ID` e, se o valor existir, carrega dois `next/script`: um apontando para `https://www.googletagmanager.com/gtag/js?id=...` com `strategy="afterInteractive"`, e outro inline que inicializa `window.dataLayer` e chama `gtag('config', GA_ID)`.

Pontos observados:

- O nome da variável é `NEXT_PUBLIC_GA_ID`, não `NEXT_PUBLIC_GA_MEASUREMENT_ID`. O diagnóstico inicial cita o ID G-EFJPEPFDLC, mas eu não tenho acesso ao valor configurado na Vercel, só ao nome da variável que o código espera. Preciso que a usuária confirme, no painel da Vercel, se `NEXT_PUBLIC_GA_ID` existe e tem esse valor.
- Essa variável não está listada no `.env.example`, diferente de quase todas as outras. Isso é o tipo de coisa que passa despercebido ao configurar um ambiente novo.
- O layout onde a tag está (`app/[locale]/layout.tsx`) é o layout raiz de todas as rotas com prefixo de idioma, ou seja, de toda a área pública, da área do aluno, do admin, do instrutor e do checkout. Se a variável estiver definida, a tag carrega em português, inglês e espanhol, sem diferença entre eles, e em todas as áreas do site, inclusive as logadas.
- Não existe nenhuma chamada a `gtag('consent', ...)`. Não existe Consent Mode. A tag, quando ativa, dispara incondicionalmente.
- O `gtag('config', ...)` está na forma padrão, sem `page_location` customizado, então o Google Analytics usa a URL do navegador tal como está, com qualquer parâmetro de busca presente. Não há sanitização.
- Não encontrei nenhum Google Tag Manager (nenhum `GTM-`, nenhum `googletagmanager.com/gtm.js`), nenhum Meta Pixel, nenhum `fbq`.
- Não encontrei nenhum banner de consentimento de cookies em nenhuma tela.

### PostHog (não estava no diagnóstico inicial, mas já está em produção)

Encontrei um segundo sistema de medição, independente do GA4:

- No navegador: `components/PostHogProvider.tsx`. Inicializa com `NEXT_PUBLIC_POSTHOG_KEY` e `NEXT_PUBLIC_POSTHOG_HOST` (ambos documentados no `.env.example`, diferente do GA). Captura `$pageview` manualmente a cada troca de rota, com `$current_url` = caminho mais os parâmetros de busca da URL, sem filtro. Tem `respect_dnt: true` e mascara os campos de formulário na gravação de sessão (`maskAllInputs: true`), o que já é uma postura cuidadosa com privacidade, mas não filtra o que entra na URL do pageview.
- No servidor: `lib/posthog.ts`, com um `captureServerEvent(distinctId, event, properties)` que usa `session.user.id` como identificador. É chamado em `app/api/progress/route.ts` para os eventos `lesson_completed` e `course_completed`, com propriedades como `course_id`, `course_title`, `course_slug`, `lesson_id`, `certificate_id`, `total_lessons`. Não vi e-mail, nome, telefone ou CPF em nenhuma dessas chamadas.

Como o PostHog já roda em produção hoje (supondo que as variáveis estejam configuradas, o que também não tenho como confirmar), a regra de privacidade deste projeto se aplica a ele com a mesma força que ao GA4 e ao futuro Pixel. Meu entendimento é que a sanitização de URL da Etapa 1 deveria valer para os dois sistemas, não só para o GA4, mas isso muda o escopo original do prompt e prefiro confirmar com a usuária antes de tratar como certo.

### Sentry (monitoramento de erro, não é analytics de marketing, mas mexe com dados)

`sentry.server.config.ts` e `sentry.edge.config.ts` têm `sendDefaultPii: false` explícito, com o comentário "Não enviar dados pessoais (LGPD)". Não é escopo direto deste projeto, só registro que já existe essa preocupação na base de código.

## 2. Compra e pagamento

Este ponto tem uma diferença importante em relação ao que o diagnóstico inicial presumia: existem três formas de cobrança no código, não duas.

- **Stripe**: implementado em `app/api/checkout/route.ts`, branch `method === "stripe"`. Cria uma `checkout.session` com `success_url` e `cancel_url` limpos (sem identificador de sessão do Stripe anexado, o código não usa o placeholder `{CHECKOUT_SESSION_ID}` que o Stripe oferece). O webhook está em `app/api/webhooks/stripe/route.ts`, confirma o pagamento por `checkout.session.completed` e usa `metadata.enrollmentId`, não dado pessoal, para encontrar a matrícula.
- **Asaas** (PIX, boleto, cartão parcelado): é o que a tela de checkout (`CheckoutClient.tsx`) de fato oferece ao aluno hoje, o tipo `PaymentMethod` do componente só tem `"pix" | "boleto" | "parcelado"`. A URL de sucesso é passada para o Asaas como `callback.successUrl` em `lib/asaas.ts`, com `autoRedirect: true`. A URL que construímos é limpa, mas como o redirecionamento final é feito pela página hospedada do Asaas, não pelo nosso código, eu não tenho como garantir que o Asaas não acrescente parâmetros próprios nesse redirecionamento. Isso só se verifica testando na prática.
- **Mercado Pago**: existe um webhook pronto (`app/api/webhooks/mercadopago/route.ts`) e um fluxo de OAuth para conectar a conta de um instrutor (`app/api/auth/mercadopago/callback` e `connect`), além de um campo salvo no banco (`platformSetting.mp_access_token`) que é checado em `checkout/[slug]/page.tsx` para decidir se existe meio de pagamento disponível. Mas em nenhum lugar do código encontrei a criação de uma preferência ou de um pagamento do Mercado Pago voltado para o aluno. Ou seja: o webhook está pronto para receber eventos, mas eu não encontrei o que os geraria hoje. Pode ser um recurso em construção, pode ser algo que existiu e foi descontinuado, ou pode estar em algum outro caminho que eu não localizei. Preciso perguntar.

Não vi, em nenhum dos três fluxos, nenhuma emissão de evento de conversão de marketing (GA4, PostHog ou outro) no momento da compra. A confirmação de pagamento hoje dispara e-mail de confirmação e atualização de banco, só isso.

As URLs de sucesso e cancelamento que localizei:

- `${APP_URL}/dashboard/cursos/${courseSlug}?sucesso=1` (aluno logado)
- `${APP_URL}/entrar?callbackUrl=/dashboard/cursos/${courseSlug}&sucesso=1` (convidado, só no curso da live)
- `${APP_URL}/checkout/${courseSlug}?cancelado=1` (cancelamento do Stripe)

Nenhuma delas carrega e-mail ou identificador de transação. Isso não bate com a hipótese do prompt original de que a URL de retorno traria esse tipo de parâmetro, ao menos no que está no código. Ainda assim, mantenho a recomendação de sanitizar a URL antes de qualquer envio de página vista, como proteção contra o que o Asaas possa acrescentar por fora do nosso controle, e como proteção geral do site.

## 3. Indexação e SEO técnico

### robots.txt e sitemap.xml

Ambos existem e são gerados pelo App Router: `app/robots.ts` e `app/sitemap.ts`.

`robots.ts` libera tudo por padrão e bloqueia, nas três variações de idioma, as áreas de aluno, admin, API, autenticação e checkout. A lista está coerente com o prefixo de idioma usado (português sem prefixo, inglês e espanhol com `/en` e `/es`, conforme `i18n/routing.ts`).

`sitemap.ts` gera entradas para home, cursos, sobre, instrutores, FAQ, privacidade e termos, cada uma nas três variantes de idioma com hreflang cruzado entre elas, mais uma entrada por curso publicado no banco (também nas três variantes). Não consegui contar quantos cursos estão publicados porque não há banco de dados configurado neste ambiente, então não confirmei se o total bate com os 40 URLs que aparecem no Search Console. Fica como algo a comparar depois do deploy.

Duas páginas públicas que localizei não aparecem no sitemap: `/verificar` (verificação de certificado, o que faz sentido, não é conteúdo para descoberta) e `/dra-vera` e `/live` (que fazem menos sentido de ficar de fora, ver próximo ponto).

### Canonical e hreflang por página

A maioria das páginas públicas define `generateMetadata` com `alternates.canonical` e `alternates.languages` próprios, cobrindo pt, en, es e x-default: home, listagem de cursos, página de cada curso, sobre, instrutores, FAQ, termos e privacidade. Verifiquei o código de cada uma dessas páginas individualmente.

Duas exceções encontradas:

- **`app/[locale]/(standalone)/dra-vera/page.tsx`**: não tem `generateMetadata`. Sem isso, a página herda o `alternates.canonical` do layout raiz (`app/[locale]/layout.tsx`, linha 89), que aponta para `APP_URL`, ou seja, para a home. Na prática, o Google recebe o sinal de que essa página "é" a home, o que tende a te tirar do índice como página própria.
- **`app/[locale]/(live)/live/page.tsx`**: mesma situação, nenhuma `generateMetadata`, mesmo herdando canonical para a home.

Isso é evidência direta de código, não hipótese. O que é hipótese é o quanto isso pesa nos "39 não indexados": como a maior parte das outras páginas tem canonical correto, esse problema específico não parece suficiente para explicar sozinho um número tão grande de páginas fora do índice.

Encontrei ainda uma inconsistência menor em `app/[locale]/(public)/verificar/page.tsx`: o canonical é fixo, `"/verificar"`, igual para as três versões de idioma. Como o inglês e o espanhol usam prefixo (`/en/verificar`, `/es/verificar`), o canonical dessas duas variantes aponta, incorretamente, para a versão em português. É uma página de utilidade, sem prioridade alta, mas registro porque é o mesmo tipo de sinal que confunde o Google sobre qual URL é a "de verdade".

### noindex

Não encontrei uso de `noindex` em nenhuma página pública, nem indevido nem ausente onde faria sentido. A página de checkout (`app/[locale]/(public)/checkout/[slug]/page.tsx`) não tem `noindex` explícito, ela conta só com o bloqueio via `robots.txt`. Bloqueio por `robots.txt` impede o rastreamento, mas não garante que a URL nunca apareça indexada sem descrição caso alguém linke para ela de fora. Não é urgente, mas um `noindex` explícito seria mais seguro.

### Link morto encontrado

`components/Footer.tsx`, linha 78, tem um link para `/contato`, presente no rodapé de every página, nos três idiomas (o rótulo vem de tradução, `t("links.contact")`). Não existe nenhuma página em `app/[locale]/(public)/contato` nem em nenhum outro lugar do código que implemente essa rota. `i18n/routing.ts` também declara traduções para `/contato` (linhas 81 a 85), mas isso é só a declaração de rota, não a página em si. Clicar nesse link hoje deve resultar em 404. Isso é um achado concreto, não uma hipótese, e pode ser relevante tanto para experiência do usuário quanto para o Search Console reportar erros de rastreamento.

### Estrutura de rotas por idioma e redirecionamentos

O prefixo de idioma é controlado por `i18n/routing.ts` com `localePrefix: "as-needed"`: português sem prefixo (`/cursos`), inglês e espanhol com prefixo (`/en/courses`, `/es/cursos`). A detecção e o redirecionamento de prefixo ficam em `proxy.ts` (o antigo `middleware.ts` deste projeto, renomeado porque esta versão do Next.js descontinuou o nome `middleware`), que delega a um `next-intl` `createIntlMiddleware(routing)` e, por cima disso, faz proteção de rota autenticada.

Não encontrei nenhuma detecção automática de idioma do navegador que force redirecionamento (o `next-intl` por padrão pode fazer isso, mas eu não vi configuração de `localeDetection` custom, então o comportamento é o padrão da biblioteca).

Sobre http/https e www: não há nenhum redirecionamento configurado no código, nem em `next.config.ts` (não tem bloco `redirects()`), nem em `vercel.json` (que só tem a configuração de um cron job). O arquivo `lib/appUrl.ts`, criado no commit `aef8100` de 30 de julho, tem um comentário afirmando que "nuvemensino.com.br responde 308 e redireciona para www.nuvemensino.com.br" e que esse redirecionamento está "confirmado no ar". Eu não tenho como confirmar isso agora, porque não tenho acesso de rede a esse domínio nesta sessão: só posso registrar que é uma afirmação de comentário de código, presumivelmente checada pela pessoa que fez o commit na época, não algo que eu tenha verificado agora. Se esse redirecionamento estiver configurado fora do repositório (nas configurações de domínio da Vercel, ou no DNS), ele não aparece em lugar nenhum do código.

O domínio canônico assumido pelo código, incluindo o valor padrão usado quando a variável de ambiente não está definida, é `https://www.nuvemensino.com.br`, com www. Isso bate parcialmente com o que o diagnóstico inicial relatou: o fluxo do GA4 está cadastrado em http, sem "s" e (presumo, a informação não deixa claro) sem confirmar se é com ou sem www. Se o fluxo do GA4 estiver de fato em `http://nuvemensino.com.br` sem www, ele não corresponde ao domínio que o site realmente serve hoje segundo o código, o que já seria motivo suficiente para "nenhum dado recebido", independente de qualquer outra causa.

### Lista de páginas públicas e cobertura

Rotas públicas que localizei (grupo `(public)`, mais `(standalone)` e `(live)`):

| Rota | No sitemap | Canonical/hreflang próprios |
|---|---|---|
| `/` | sim | sim |
| `/cursos` | sim | sim |
| `/cursos/[slug]` (por curso) | sim | sim |
| `/sobre` | sim | sim |
| `/instrutores` | sim | sim |
| `/faq` | sim | sim |
| `/privacidade` | sim | sim |
| `/termos` | sim | sim |
| `/verificar` | não | parcial (canonical fixo, errado em en/es) |
| `/dra-vera` | não | não (herda canonical da home) |
| `/live` | não | não (herda canonical da home) |
| `/contato` | não existe a página | não existe a página |

Não tenho o número exato de cursos publicados (sem banco neste ambiente), então não dá para fechar a conta de quantos URLs o sitemap gera de fato. Se a usuária confirmar o número de cursos publicados, eu calculo o total exato e comparo com os "1 de 40" do Search Console.

Sobre por que só 1 de aproximadamente 40 páginas estaria indexada: com a maior parte das páginas tecnicamente corretas (canonical e hreflang presentes, robots.txt liberando o rastreamento, sitemap sendo gerado), a explicação mais provável não está, pelo que vejo no código, num problema espalhado pelas páginas em si. As hipóteses que o código sustenta, e que continuam sendo hipóteses, são:

1. A propriedade do Search Console (ou o fluxo do GA4) pode estar configurada contra uma variante de URL (http, ou sem www) que não é a que o site realmente serve hoje, o que faria o Google enxergar um site "fora do ar" na variante que ele está checando, mesmo com o site funcionando normalmente na variante correta.
2. A propriedade de domínio não verificada, mencionada no diagnóstico inicial, significa que o Search Console pode estar de fato enxergando só uma fatia do tráfego (a variante de URL específica da propriedade de prefixo), não o site inteiro.
3. Antes do commit de 30 de julho, partes do código tinham como valor padrão o domínio antigo `cursos.nuvemmedicina.com.br` (que não existe mais) ou a variante sem www, cada arquivo com um padrão diferente quando a variável de ambiente não estava definida. Se a variável de ambiente não estivesse definida em produção nessa época, o sitemap, o robots.txt ou os metadados podem ter sido gerados, por um tempo, apontando para um domínio incorreto ou inconsistente. Isso é uma hipótese histórica, não uma leitura do estado atual: hoje, com `lib/appUrl.ts`, o valor é único e consistente.

Não encontrei evidência de código que confirme qualquer uma dessas três hipóteses como fato. São possibilidades plausíveis diante do que os dados do Google mostram, nada mais.

## 4. Linha do tempo do histórico (git log)

Busquei commits entre 25 de julho e 15 de agosto de 2026 que tocam roteamento, metadados, robots, sitemap, middleware/proxy, redirecionamentos, domínio ou layout raiz:

- **30/07, commit `aef8100`**: "remove cursos.nuvemmedicina.com.br e unifica o endereco da plataforma". Cria `lib/appUrl.ts` como fonte única do domínio (`https://www.nuvemensino.com.br` como padrão). Antes desse commit, o mesmo valor padrão estava repetido em pelo menos 10 arquivos diferentes, com variações entre com/sem www e um deles ainda usando o domínio antigo `cursos.nuvemmedicina.com.br`, que segundo a mensagem do commit "não existe mais". Toca `app/robots.ts`, `app/sitemap.ts`, `app/[locale]/layout.tsx`, o checkout, os webhooks e a página de curso.
- **02/08, commit `71640af`**: "worker do pdfjs passa a existir na funcao da Vercel". Ajusta `next.config.ts` (`outputFileTracingIncludes`), não relacionado a domínio ou indexação, mas é o único outro commit no período que toca `next.config.ts`.

Linha do tempo completa de todos os commits entre 25/07 e 15/08, para contexto (não filtrada por tema):

O repositório teve atividade normal entre 26 de julho e 3 de agosto (correções de cupom, provas, gamificação, e-mails, flashcards). Depois do dia 3 de agosto, não há nenhum commit registrado até 16 de agosto, um intervalo de treze dias que cobre inteiramente a janela de 7 a 9 de agosto em que os cliques caíram. Ou seja: pelo histórico deste repositório, não houve deploy de código nenhum durante a queda observada. Isso não aponta uma causa, mas é evidência razoável de que a causa, seja ela qual for, não está em uma mudança de código feita durante a própria janela do evento.

Não interpreto essa ausência de commits como prova de que nada mudou em produção: alterações de variável de ambiente, configuração de domínio na Vercel, ou mudanças manuais no Google Analytics e no Search Console não deixam rastro no git.

## 5. Riscos de privacidade encontrados

- GA4 e PostHog, hoje, enviam a URL da página sem nenhuma filtragem de parâmetros de busca. Não encontrei parâmetro sensível nas URLs que o próprio código gera, mas o Asaas redireciona por fora do nosso controle depois do pagamento, e isso não pôde ser verificado neste ambiente.
- A tag do GA4, sem Consent Mode e sem restrição de rota, dispara em toda página do site, inclusive dentro da área do aluno (`/dashboard/...`) e do checkout, sempre que a variável de ambiente estiver definida.
- O PostHog no navegador também captura `$pageview` em toda navegação, incluindo área do aluno, sem filtro de parâmetros.
- Nenhum dos dois sistemas, pelo que revisei, envia nome, e-mail, telefone ou CPF diretamente nos eventos que encontrei. O identificador usado no PostHog do servidor é o ID interno do usuário (`session.user.id`), não um dado pessoal em si, mas é um identificador estável ligado à conta, o que vale registrar.

## 6. Terminologia científica encontrada (sem edição, ver arquivo separado)

Durante a leitura do código, apareceram menções a "Doenças Funcionais" e a uma divergência entre "Roma IV" e "Roma V" em conteúdo público. Não editei nada disso, é conteúdo científico. Listei os locais exatos em `docs/medicao/pendencias-dra-vera.md`.

## 7. Decisões que dependem da usuária

1. ~~O ID G-EFJPEPFDLC é o correto para produção, e a variável `NEXT_PUBLIC_GA_ID` está de fato configurada na Vercel com esse valor?~~ Respondida em 23 de setembro, com print da tela de variáveis de ambiente da Vercel: a variável `NEXT_PUBLIC_GA_ID` existe, mas o campo Valor está vazio, o `G-EFJPEPFDLC` foi digitado no campo Nota, que é só um comentário interno e não é lido pela aplicação. Além disso, o tipo da variável está como Segredo, quando precisa ser Config, porque uma variável com prefixo `NEXT_PUBLIC_` precisa entrar no código do navegador durante o build, e o tipo Segredo da Vercel não permite isso. Correção pendente do lado da usuária: mover o valor para o campo certo, trocar o tipo para Config, salvar e gerar um novo deploy.
2. ~~Existe container do Google Tag Manager?~~ Respondida em 23 de setembro, com print da própria conta do GTM: existe, conta "NU.V.E.M ENSINO", contêiner GTM-KX7V5WKL, associado ao domínio nuvemensino.com.br. A tela mostra "Qualidade de Contêiner: Sem dados recentes", confirmando o que a auditoria já indicava: o contêiner nunca foi instalado no site. Decisão registrada: usar o GTM como carregador único, com o GA4 configurado como tag dentro dele (apontando para G-EFJPEPFDLC), em vez do `gtag.js` direto que o código carrega hoje em `app/[locale]/layout.tsx`. Isso é trabalho de código, entra na Etapa 1, não deve ser feito colando o snippet manualmente em nenhuma tela, porque este é um site Next.js, não HTML solto.
3. O domínio canônico oficial é `https://www.nuvemensino.com.br`, com www, como o código já assume? Pedir para confirmar isso formalmente, já que é a base de tudo o que vem depois (sitemap, robots, canonical, redirecionamento).
4. Qual gateway de pagamento está de fato ativo hoje para o aluno comprar um curso? Pelo código, é o Asaas (PIX, boleto, cartão parcelado). O Stripe existe no backend mas não aparece na tela de checkout. O Mercado Pago tem só webhook e conexão de conta, sem criação de cobrança visível. Preciso que a usuária confirme qual desses está realmente em uso, e se o Mercado Pago é um recurso futuro ou algo que já funciona por um caminho que eu não encontrei.
5. Existe política de privacidade publicada? Existe: `/privacidade`, com metadados próprios. Não abri o conteúdo da página para não misturar leitura técnica com avaliação de texto jurídico, mas posso ler o conteúdo se a usuária quiser que eu confirme se ele já menciona medição e cookies, hoje aparentemente não menciona PostHog nem GA4 por nome, o que seria de se esperar caso o texto não tenha sido atualizado desde que esses sistemas entraram no ar.
6. O PostHog já está em produção hoje. Isso não estava no escopo original do prompt, que falava só de GA4, GTM e Pixel. A usuária quer que as regras de privacidade e sanitização de URL da Etapa 1 cubram também o PostHog, já que ele já roda e já captura URLs sem filtro?
7. Devo corrigir o link morto para `/contato` no rodapé já na Etapa 2, junto com o resto do SEO técnico, ou isso é uma tarefa separada, fora do escopo deste trabalho de medição?
8. Sobre a terminologia científica encontrada (Roma IV versus Roma V, e as menções a "Doenças Funcionais"): ver perguntas específicas em `docs/medicao/pendencias-dra-vera.md`.

## 8. Proposta de ordem das próximas etapas

Sem mudar a ordem geral já definida no prompt (Etapa 1 medição e consentimento, Etapa 2 SEO técnico, Etapa 3 eventos de conversão, Etapa 4 Meta Pixel, Etapa 5 UTM), sugiro duas adições pequenas dentro das etapas já previstas, não uma etapa nova:

- Na Etapa 1, ao decidir a sanitização de URL, decidir junto se ela cobre só o GA4 (escopo original) ou também o PostHog (achado desta auditoria), para não deixar uma lacuna de privacidade num sistema que já está ativo.
- Na Etapa 2, além do que o prompt já pede, incluir a correção do canonical ausente em `/dra-vera` e `/live`, e decidir o que fazer com o link morto para `/contato` (criar a página, ou trocar o link do rodapé por outra coisa, como um WhatsApp direto, que já existe em outras partes do site).

Fora isso, meu entendimento é que a auditoria confirma que a ordem proposta no prompt já é a certa: sem a Etapa 1 funcionando, não há dado nenhum para julgar o efeito das etapas seguintes.

## Perguntas em aberto, juntando tudo

As perguntas 1 a 8 da seção 7 acima. Aguardando resposta antes de iniciar a Etapa 1.
