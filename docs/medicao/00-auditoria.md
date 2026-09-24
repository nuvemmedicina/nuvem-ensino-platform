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

**Atualização de 23 de setembro, com print do Search Console.** A usuária mostrou a tela de visão geral do Search Console com o seletor de propriedades aberto. Existem três propriedades: `nuvemmedicina.com.br` (propriedade de domínio, verificada, é a marca da clínica, outro site), `https://nuvemensino.com.br/` (propriedade de prefixo de URL, verificada, sem www, é a que está sendo usada e mostra o "1 indexada, 39 não indexadas") e `nuvemensino.com.br` (propriedade de domínio, não verificada). A propriedade em uso não tem www, enquanto o código usa `https://www.nuvemensino.com.br`, com www, como domínio canônico. Isso é evidência direta, não mais só hipótese, de que a propriedade sendo monitorada é uma variante de URL diferente da que o site realmente serve. Continua sendo hipótese, porque ainda não vi o relatório completo de indexação com o motivo dado pelo Google para cada uma das 39 páginas, o quanto isso explica o "1 de 40": se o domínio sem www realmente redireciona 308 para o com www, como afirma o comentário em `lib/appUrl.ts`, cada URL dessa propriedade bateria num redirecionamento ao ser rastreada, o que é consistente com ficar fora do índice nessa propriedade específica, mesmo que a versão com www esteja indexada em algum lugar que ninguém está olhando, já que a propriedade de domínio que cobriria as duas variantes de uma vez nunca foi verificada.

No mesmo print, o gráfico de desempenho mostra a queda de cliques de forma visual: de um pico de quase 15 cliques por dia para uma linha reta em zero a partir de 08/08/2026, permanecendo assim até pelo menos 13/09/2026. Isso confirma visualmente o que o diagnóstico inicial já relatava sobre a queda entre 7 e 9 de agosto, sem que isso, por si só, aponte uma causa.

Encaminhei à usuária o pedido de abrir o relatório completo de indexação (dentro dessa mesma propriedade sem www) para ver o motivo que o Google atribui a cada uma das 39 páginas não indexadas, o que deve confirmar ou afastar essa hipótese com mais segurança.

**Atualização, ainda em 23 de setembro, com prints da Vercel e do Registro.br.** Dois achados novos:

Primeiro, confirmação: a tela de Domínios do projeto na Vercel mostra a linha `nuvemensino.com.br` com "308 www.nuvemensino.com.br". Isso confirma, agora por evidência direta e não só pelo comentário em `lib/appUrl.ts`, que o redirecionamento do domínio sem www para o com www existe de fato, configurado na própria Vercel, não em código da aplicação. `www.nuvemensino.com.br` aparece como o domínio de Produção.

Segundo, uma complicação: no painel do Registro.br, os servidores de DNS do domínio são `ns1.dns-parking.com` e `ns2.dns-parking.com`, um serviço de terceiro que não é nem o Registro.br nem a Vercel. Isso significa que o registro TXT de verificação da propriedade de domínio no Search Console não pode ser adicionado nem pelo painel do Registro.br nem pelo painel da Vercel, precisa ser feito na conta desse provedor de DNS específico, cujo acesso ainda não identificamos. Perguntei à usuária se ela reconhece esse serviço. Como alternativa mais rápida, sem depender de DNS, propus criar uma segunda propriedade de prefixo de URL no Search Console para `https://www.nuvemensino.com.br/`, verificada por tag HTML (o token já está em `verification.google` no código, deve verificar na hora), para pelo menos enxergar dados da variante de URL que o site realmente usa enquanto o acesso ao DNS não é resolvido.

**Atualização, ainda em 23 de setembro: o `dns-parking.com` é a Hostinger, e não é só hospedagem abandonada.** A usuária tem uma conta na Hostinger com um WordPress antigo, confirmado por ela como abandonado e descartável. Mas o painel de DNS dessa mesma conta (`hpanel.hostinger.com`, tela Domínios, DNS/Servidores de Nome) mostra que é ali que a zona de DNS de `nuvemensino.com.br` de fato vive hoje, com registros em uso real, não abandonados:

- `CNAME www` apontando para a Vercel (`....vercel-dns-017.com`), o que faz `www.nuvemensino.com.br` funcionar
- Um registro A na raiz (`@`) para `216.198.79.1`, provavelmente também apontando para a Vercel, dado que o domínio raiz responde com o redirecionamento 308 confirmado na Vercel
- `MX @` para `SMTP.GOOGLE.COM` e SPF incluindo `_spf.google.com`, ou seja, o e-mail do domínio (`cursos@nuvemensino.com.br` e outros) roda hoje pelo Google Workspace usando esse DNS
- Registros DKIM para três serviços de envio distintos: Hostinger, Resend (`resend._domainkey`, condizente com `RESEND_API_KEY` do `.env.example`) e Mailchimp
- Registro DMARC, e um subdomínio `enviar` com SPF e MX apontando para Amazon SES
- Um segundo registro `google-site-verification` já existente em `@`, com um código diferente do que está no código-fonte e do que o Search Console está pedindo agora para a propriedade de domínio, de origem não identificada
- Duas entradas antigas, `cursos` e `ftp`, apontando para um IP da própria Hostinger (`145.223.25.40`), essas sim parecem resquício do site antigo

Conclusão registrada: a conta da Hostinger tem duas funções separadas, hospedagem de site (o WordPress, confirmado descartável) e zona de DNS (ativa, crítica, sustentando o site na Vercel e o e-mail do domínio inteiro). Cancelar a conta sem migrar a zona de DNS primeiro derrubaria e-mail e possivelmente o site. Orientei a usuária a não cancelar agora, e a tratar a saída da Hostinger como um projeto à parte, com migração completa dos registros para outro provedor de DNS antes de qualquer cancelamento, fora do escopo desta tarefa de medição. Orientei também a adicionar, sem apagar o TXT de verificação existente, um novo registro TXT em `@` com o valor `google-site-verification=4uvseus2L5dSqz1irnL5_X0AE9souRF6j0d9gzFyWL8`, para finalmente verificar a propriedade de domínio no Search Console.

**Atualização, ainda em 23 de setembro: propriedade de domínio verificada.** A usuária confirmou que a verificação passou. Isso responde, na prática, boa parte da pergunta 3 da seção 7: o Search Console agora enxerga o domínio inteiro, todas as variantes de www e protocolo juntas, em vez de só a fatia sem www que gerava o "1 indexada, 39 não indexadas". Próximo passo para fechar essa investigação: pedir à usuária um print do relatório de indexação e do desempenho dentro dessa propriedade de domínio recém-verificada, agora sim para ver o número real e, se possível, o motivo que o Google dá para cada página fora do índice.

**Atualização, ainda em 23 de setembro, com a exportação do relatório de Desempenho da propriedade de domínio (arquivo `nuvemensino.com.br-Performance-on-Search-2026-09-23.zip`, período "Últimos 3 meses").** Este é o achado mais significativo da auditoria até agora, maior do que o descompasso de www sozinho. A lista de páginas com cliques e impressões nos últimos 3 meses mostra tráfego de busca chegando a **três hosts diferentes**, não dois:

1. `www.nuvemensino.com.br`, o site atual, auditado nesta sessão inteira.
2. `nuvemensino.com.br` sem www, mas com estrutura de URL que não existe no site atual (por exemplo `/faq` sem prefixo de curso, e posts de blog como `/aumento-global-de-doencas-inflamatorias-intestinais-no-seculo-xxi/`). Pode ser resíduo de indexação anterior ao redirecionamento 308 confirmado na Vercel, ainda não descartado pelo Google, não uma leitura confirmada de conteúdo servido hoje.
3. **`cursos.nuvemensino.com.br`**, um subdomínio até então não mencionado nesta auditoria, com estrutura típica de loja WordPress (`/produto/`, `/loja/`, `/checkout/`, `/painel/`, `/cadastro-de-alunos/`, `/reembolso_devolucoes/`, PDFs em `/wp-content/uploads/2024/10/`). Recebeu cliques reais nos últimos 3 meses (9 cliques e 85 impressões só na página inicial desse subdomínio). Não é o mesmo domínio removido do código pelo commit `aef8100` (aquele era `cursos.nuvemmedicina.com.br`, da Medicina, este é `cursos.nuvemensino.com.br`, do Ensino).

Tentei verificar diretamente se `cursos.nuvemensino.com.br` e `nuvemensino.com.br` estão de fato no ar hoje, usando a ferramenta de busca na web deste ambiente, mas o acesso a esses domínios está bloqueado pela política de rede da sessão (só alcança o GitHub). Pedi à usuária para abrir as duas URLs direto no navegador e relatar o que aparece. Isso ainda é hipótese, não fato confirmado: pode ser um site antigo genuinamente no ar e competindo por indexação com o site atual, ou pode ser só entradas antigas que o Google ainda não descartou de um domínio hoje fora do ar. As duas leituras mudam a ação corretiva.

Dado complementar, sem relação direta com causa: a consulta de busca "nuvem ensino" (marca) responde por 219 dos aproximadamente 379 cliques totais do período, na posição 1.09. Termos sem marca aparecem nas impressões mas praticamente não geram clique ainda, compatível com uma indexação ainda desorganizada.

**Atualização, ainda em 23 de setembro: confirmado, `cursos.nuvemensino.com.br` está fora do ar.** A usuária tentou abrir o endereço direto no navegador e recebeu `ERR_SSL_PROTOCOL_ERROR`, confirmou que era o site antigo e autorizou a remoção. Não é concorrência ativa nem risco de matrícula ou pagamento duplicado, é só resíduo técnico. Registrado como oportunidade futura, fora do escopo de agora: configurar redirecionamento de `cursos.nuvemensino.com.br` para as páginas equivalentes em `www.nuvemensino.com.br`, em vez de só derrubar o subdomínio, para o Google entender que o conteúdo mudou de lugar em vez de simplesmente sumir. Isso se encaixa na Etapa 2, de SEO técnico.

**Atualização: registros `A cursos` e `A ftp` excluídos na Hostinger**, ambos apontando para o IP antigo `145.223.25.40`. A usuária confirmou a exclusão dos dois. A própria Hostinger avisa que a propagação pode levar até 24 horas.

**Atualização, ainda em 23 de setembro, com a Inspeção de URL do Search Console para `https://nuvemensino.com.br/`.** O motivo exato que o Google dá para essa URL não estar indexada é "Página com redirecionamento". Isso não é um problema, é o comportamento esperado de uma URL que existe só para redirecionar: o URL canônico declarado (`https://www.nuvemensino.com.br/`) e o selecionado pelo Google são iguais, ou seja, o Google entende corretamente que essa não é a página de verdade. Isso reabre a leitura do "1 de 40": é provável que boa parte das 39 páginas não indexadas sejam exatamente páginas antigas do domínio sem www, corretamente marcadas como redirecionamento, não uma falha de indexação real. A pergunta que resta é se a versão com www está de fato indexada, ainda não verificado.

A mesma tela listou como "página de referência" (quem aponta para essa URL) os endereços `nuvemensino.com.br/sitemap.xml` e `nuvemensino.com.br/page-sitemap.xml`, este último com nome típico do WordPress com Yoast SEO, confirmando que existia um WordPress publicado direto no domínio sem www antes da migração para a Vercel.

Investigando por que o Google ainda cita a URL sem www como referência, encontrei no próprio código dois lugares com o domínio fixo sem www, ainda em uso hoje, não resíduo antigo: os dados estruturados (JSON-LD) da página inicial, em `app/[locale]/(public)/page.tsx`, e o link de verificação gravado no QR code de cada certificado, em `app/api/certificates/[id]/pdf/route.ts`. Os dois foram corrigidos para usar `APP_URL` (commit `beda628`), a mesma fonte única do domínio já usada no resto do código desde 30 de julho. `tsc --noEmit` e `eslint` passaram limpos nos dois arquivos.

**Atualização sobre o sitemap.** Na tela de Sitemaps do Search Console, o sitemap que o Google de fato processou com sucesso e usou para contar os 39 URLs é o antigo, enviado em maio de 2026 em `nuvemensino.com.br/sitemap.xml` (sem www). O sitemap novo, enviado agora pela usuária em `www.nuvemensino.com.br/sitemap.xml`, ainda não tinha sido lido pelo Google no momento da captura de tela ("Última leitura" em branco), e mostrava "Não foi possível buscar o sitemap", que pode ser só um status provisório antes da primeira tentativa real de leitura, não necessariamente uma falha. Pedido à usuária para confirmar se `https://www.nuvemensino.com.br/sitemap.xml` abre normalmente no navegador, antes de tratar isso como problema.

A usuária abriu `www.nuvemensino.com.br/sitemap.xml` direto no navegador e carregou normalmente. Contagem manual das URLs listadas: 21 páginas fixas (7 páginas × 3 idiomas) mais 18 páginas de curso (6 cursos publicados × 3 idiomas), total **39**, o mesmo número relatado como não indexado no relatório antigo. Forte indício de que são as mesmas 39 páginas, antes só monitoradas pelo endereço errado.

**Atualização, conclusão desta linha de investigação: `https://www.nuvemensino.com.br/` está indexada.** Inspeção de URL do Search Console para essa URL retornou "A página está indexada", com o sitemap novo (`www.nuvemensino.com.br/sitemap.xml`) já associado corretamente, e o URL canônico selecionado pelo Google é o próprio URL inspecionado (ou seja, o Google já trata essa versão como a real, autoritativa). Nas páginas de referência apareceu também `https://www.nuvemmedicina.com.br/ensino`, confirmando que o site institucional da clínica linka para a plataforma de ensino, consistente com o contexto passado no início desta tarefa.

Conclusão: a causa técnica do "1 de 40" não era o site ser inindexável, era a combinação de propriedade errada monitorada no Search Console (sem www), sitemap antigo sem www sendo o único lido pelo Google, e dois pontos do código ainda citando o domínio sem www. As três causas já foram corrigidas ou estão propagando. O que falta agora é o Google recrawlear e atualizar o índice, fora do nosso controle direto, exceto pelo botão "Solicitar indexação" na própria tela de inspeção, sugerido à usuária para a home e para páginas de curso prioritárias.

**Atualização: página de curso individual, status diferente.** A inspeção de `https://www.nuvemensino.com.br/cursos/testes-respiratorios-h2-ch4-h2s-outubro` retornou "Detectada, mas não indexada no momento", com "Último rastreamento: N/D", ou seja, o Google já sabe que a URL existe (via o sitemap novo e via o link do site da nuvemmedicina.com.br/ensino) mas ainda não chegou a rastreá-la. É o estado normal de página nova ou de sitemap recém-reenviado aguardando a fila de rastreamento do Google, não indica problema técnico na página em si. Sugerido à usuária usar "Solicitar indexação" também aqui.

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
3. ~~O domínio canônico oficial é `https://www.nuvemensino.com.br`, com www, como o código já assume?~~ Confirmado por evidência ao longo desta sessão: redirecionamento 308 verificado na Vercel, propriedade de domínio verificada no Search Console, e `https://www.nuvemensino.com.br/` confirmado indexado com esse exato URL como canônico selecionado pelo Google.
4. ~~Qual gateway de pagamento está de fato ativo hoje?~~ Respondida pela usuária em 23 de setembro: **Asaas**. Bate com o que o código mostra (CheckoutClient só oferece PIX, boleto e parcelado via Asaas). Stripe e Mercado Pago seguem como código presente mas não ativo na tela de checkout, tratar como não usados até segunda ordem.
5. ~~Existe política de privacidade publicada, e ela já menciona medição e cookies?~~ A usuária pediu para eu ler o conteúdo (respondeu "sim"). Lido em `messages/pt.json`, seção `privacy`: existe uma seção 6, "Cookies", mencionando cookies essenciais e "cookies analíticos para entender o uso do site", mas de forma genérica, sem citar GA4, GTM, PostHog ou qualquer ferramenta por nome, e sem nenhuma menção a Consent Mode ou banner de consentimento. A seção 3, "Compartilhamento de dados", cita como processadores de pagamento "Stripe e Mercado Pago", o que não bate com a resposta da pergunta 4 (o processador ativo hoje é o Asaas, não mencionado no texto). Não editei o texto, é conteúdo legal/LGPD, registrado aqui para decisão da usuária: atualizar a política (nomear as ferramentas de medição reais e corrigir o processador de pagamento) faz parte natural da Etapa 1, quando o Consent Mode e o banner forem implementados, mas exige revisão jurídica antes de publicar texto novo, como o próprio prompt original já previa.
6. ~~O PostHog já está em produção hoje...~~ A usuária pediu a recomendação. Dada em 23 de setembro: cobrir os dois, GA4 e PostHog, na mesma função de sanitização de URL da Etapa 1. Razão: a regra de privacidade deste projeto não faz exceção por ferramenta, e o PostHog é quem está de fato em produção hoje, capturando URL completa a cada navegação; deixar de fora o sistema que já roda, e sanitizar só o que ainda nem coletou (GA4), inverteria a prioridade de risco. O custo extra é pequeno: a mesma função central de sanitização passa a ser chamada nos dois lugares (o `gtag`/GTM e o `ph.capture("$pageview")` do PostHog), sem duplicar lógica. Decisão registrada para a Etapa 1: sanitizar URL para os dois sistemas.
7. ~~Devo corrigir o link morto para `/contato`?~~ Respondida em 23 de setembro: a usuária pediu para criar a página. Feito, ver atualização abaixo (commit `94fb873`).
8. Sobre a terminologia científica encontrada (Roma IV versus Roma V, e as menções a "Doenças Funcionais"): ver perguntas específicas em `docs/medicao/pendencias-dra-vera.md`.

**Atualização: página `/contato` criada (commit `94fb873`).** `i18n/routing.ts` já declarava as três traduções de rota (`/contato`, `/en/contact`, `/es/contacto`), só faltava a página. Conteúdo reaproveita apenas dados já publicados em outros lugares do site: e-mail (`cursos@nuvemensino.com.br`) e WhatsApp (`wa.me/5531972291029`), os mesmos usados no rodapé e no CTA final do FAQ, mais a cidade ("Belo Horizonte, MG") do rodapé. Segue o mesmo padrão de metadados (canonical, hreflang) das demais páginas públicas e foi adicionada ao `app/sitemap.ts`.

Durante a montagem da página, apareceu um achado à parte: **três números de telefone diferentes** em lugares distintos do site. O rodapé usa `+5531972291029` (exibido como "(31) 7229-1029", note que falta o "9" inicial no texto exibido, embora o link em si esteja correto). A política de privacidade (seção 8, "Contato") cita "(31) 2537-3131". O FAQ cita duas vezes "WhatsApp (31) 99726-1029", um terceiro número, diferente até do WhatsApp usado no rodapé. Não tenho como saber qual está correto sem a usuária confirmar, e a regra deste projeto proíbe inventar ou escolher esse tipo de dado sozinho. Por segurança, a página `/contato` nova usa só e-mail e WhatsApp (o link `wa.me`, que é o mesmo em rodapé e FAQ), sem exibir nenhum número de telefone fixo. Pendência para a usuária: confirmar os três números e, se fizer sentido, alinhar os textos do rodapé, do FAQ e da política de privacidade.

**Atualização: número confirmado e unificado em todo o site (commit `b3e4fc1`).** A usuária confirmou o número correto, `(31) 97229-1029`. Corrigido o texto exibido no rodapé e em seis e-mails transacionais (`lib/email.ts`), que já usavam o link certo mas mostravam o número sem o "9" inicial. Corrigidos também os dois números divergentes no FAQ, na política de privacidade e nos termos de uso, nas três traduções (pt/en/es). `tsc --noEmit` limpo, `eslint` limpo em `lib/email.ts`; `Footer.tsx` tem 3 erros de lint pré-existentes, não relacionados a esta alteração (confirmado revertendo a mudança e rodando o lint de novo, os mesmos erros continuam), sobre a estrutura de componentes internos do arquivo, não sobre o texto alterado.

**Atualização: deploy novo confirmado depois da correção do `NEXT_PUBLIC_GA_ID`.** A usuária confirmou que já rodou. Passo seguinte, do lado dela: abrir o relatório em tempo real do GA4 e confirmar o recebimento de dados, e verificar se o aviso de "nenhum dado recebido" no fluxo desaparece.

## 8. Proposta de ordem das próximas etapas

Sem mudar a ordem geral já definida no prompt (Etapa 1 medição e consentimento, Etapa 2 SEO técnico, Etapa 3 eventos de conversão, Etapa 4 Meta Pixel, Etapa 5 UTM), sugiro duas adições pequenas dentro das etapas já previstas, não uma etapa nova:

- Na Etapa 1, ao decidir a sanitização de URL, decidir junto se ela cobre só o GA4 (escopo original) ou também o PostHog (achado desta auditoria), para não deixar uma lacuna de privacidade num sistema que já está ativo.
- Na Etapa 2, além do que o prompt já pede, incluir a correção do canonical ausente em `/dra-vera` e `/live`, e decidir o que fazer com o link morto para `/contato` (criar a página, ou trocar o link do rodapé por outra coisa, como um WhatsApp direto, que já existe em outras partes do site).

Fora isso, meu entendimento é que a auditoria confirma que a ordem proposta no prompt já é a certa: sem a Etapa 1 funcionando, não há dado nenhum para julgar o efeito das etapas seguintes.

## 11. Etapa 2: SEO técnico

Correções feitas com base nos achados da seção 3 desta auditoria:

- **`/dra-vera` e `/live`**: as duas páginas herdavam o canonical do layout raiz (apontando para a home). Adicionado `alternates.canonical` próprio em cada uma, apontando para a própria URL. Não adicionei `hreflang`/tradução para inglês e espanhol, porque as duas páginas têm conteúdo fixo só em português (não usam `next-intl`), apesar de tecnicamente acessíveis com prefixo `/en` e `/es`. Inventar um hreflang para uma tradução que não existe seria pior do que não ter hreflang nenhum.
- **`/verificar`**: o canonical era um texto fixo (`"/verificar"`) igual para as três versões de idioma, então as variantes `/en/verificar` e `/es/verificar` apontavam incorretamente para a versão em português. Convertido de `metadata` estático para `generateMetadata`, calculando o canonical certo por locale.
- **Sitemap**: `/dra-vera` e `/live` adicionados, como entrada única (mesma razão da falta de hreflang acima, não fazia sentido usar o helper de 3 idiomas para uma página sem tradução).
- **Checkout**: adicionado `robots: { index: false, follow: false }` explícito na página de checkout, que antes contava só com o bloqueio do `robots.txt` (que impede rastreamento, mas não impede indexação de uma URL sem descrição caso alguém linke de fora).

Testes existentes (`npm test`) e checagens de tipo/lint seguem limpos, sem relação direta com essas mudanças (são de metadados, não de lógica testada). Não editei a página `/verificar` além do metadata, campo de código funcional intocado.

## 12. Etapa 3: eventos de conversão

Três eventos, cada um investigado no código antes de decidir como implementar (ver `docs/medicao/02-etapa3-passos-manuais.md` para a configuração pendente no Tag Manager e na Vercel):

- **`begin_checkout`**: dispara no navegador, no clique do botão de pagar (`CheckoutClient.tsx`). Manda `value`, `currency` e `payment_method`, sem nenhum dos dados pessoais que o mesmo formulário coleta (CPF, WhatsApp, nome, e-mail continuam só na chamada para `/api/checkout`, nunca no `dataLayer`).
- **`sign_up`**: dispara no navegador, ao concluir o cadastro por e-mail (`app/[locale]/(auth)/cadastro/page.tsx`). Sem dado pessoal, só confirma que um cadastro aconteceu.
- **`purchase`**: esse foi o mais delicado. Fui conferir como a confirmação de pagamento realmente funciona antes de decidir onde disparar o evento: boleto e cartão parcelado redirecionam de volta pro site assim que a cobrança é *gerada*, não quando é *paga*, e o PIX nem redireciona (fica um QR code na tela, confirmação só chega depois). A única fonte confiável de "pagamento realmente recebido", para os três métodos, é o webhook da Asaas (`app/api/webhooks/asaas/route.ts`, eventos `PAYMENT_CONFIRMED`/`PAYMENT_RECEIVED`). Por isso o evento de compra é mandado direto do servidor pro GA4 (API de Medição / Measurement Protocol, `lib/ga4MeasurementProtocol.ts`), de dentro do próprio webhook, nunca da página `?sucesso=1`, que teria contado boleto/PIX pendente como venda fechada.

  Para correlacionar a compra a um visitante do GA4 sem usar dado pessoal, o código lê o `client_id` do cookie `_ga` no navegador (`lib/gaClientId.ts`, um identificador técnico aleatório do próprio Google, não é nome nem e-mail) no momento do `begin_checkout`, e guarda ele junto do registro de pagamento (`Payment.gaClientId`, nova coluna, migração `20260924120000_add_payment_ga_client_id`). Esse cookie só existe se a pessoa aceitou o cookie de analytics, então, sem consentimento, o campo fica vazio e o evento de compra simplesmente não é enviado (a venda continua registrada normalmente no banco, só não entra na medição).

  Dados enviados no evento: `value` (valor realmente pago), `currency`, `payment_method`, `coupon` (código, se teve), e os dados do curso (`item_id` = slug, `item_name`, `item_category`, `price`). Nada de CPF, e-mail, nome, telefone, nem os identificadores de transação da Asaas/Stripe.

  Não populei os campos `Enrollment.utmSource/utmMedium/utmCampaign` (existem no schema, mas nunca foram preenchidos em lugar nenhum do código), porque isso é especificamente o que a Etapa 5 (parâmetros UTM) do prompt original propõe fazer, não quis adiantar fora de ordem.

Pendências do lado da usuária, listadas com detalhe em `02-etapa3-passos-manuais.md`: criar os dois acionadores e as duas tags novas no GTM (`begin_checkout`, `sign_up`), e configurar `GA4_MEASUREMENT_ID` e `GA4_API_SECRET` na Vercel (o segundo precisa ser gerado no próprio GA4, eu não tenho como criar).

`npx tsc --noEmit`, `npx eslint` nos arquivos alterados e `npm test` (9 testes) seguem limpos. `npx prisma generate` rodado para o TypeScript reconhecer a coluna nova (sem banco neste ambiente para testar a migração de fato, ela roda sozinha no próximo deploy, o `build` do projeto já chama `prisma migrate deploy` via `scripts/migrate-deploy.mjs`).

## Perguntas em aberto, juntando tudo

As perguntas 1 a 8 da seção 7 acima. Aguardando resposta antes de iniciar a Etapa 1.

## 9. Achado fora do escopo original: projeto duplicado na Vercel

Ao abrir o PR #29 e buscar o link de pré-visualização, apareceram **dois projetos** na Vercel ligados ao mesmo repositório do GitHub: `nuvem-ensino-platform` (o principal, usado a sessão inteira) e `nuvem-ensino-platform-714m`, gerando deploy de pré-visualização próprio para o mesmo PR. A usuária não reconhece a origem desse segundo projeto e acha que parece uma versão antiga.

**Atualização:** a usuária conferiu Configurações → Domínios do projeto `nuvem-ensino-platform-714m`, e o único domínio listado é o padrão gerado pela própria Vercel (`nuvem-ensino-platform-714m.vercel.app`), sem nenhum domínio real (`nuvemensino.com.br` e variantes) apontando para lá. Seguro de remover quando a usuária quiser, sem risco para o site em produção. Não é urgente, fica como faxina futura.

**Atualização final, 24 de setembro: projeto excluído.** Antes de remover, reconferido mais uma vez (a usuária desconfiou que o teste do dia anterior pudesse ter usado o projeto errado): os dois projetos têm builds automáticos para os mesmos commits, porque os dois estão ligados ao mesmo repositório do GitHub, mas só o `nuvem-ensino-platform` tem `nuvemensino.com.br` e `www.nuvemensino.com.br` na aba Domains, confirmado por print dos dois projetos lado a lado. O `nuvem-ensino-platform-714m` nunca serviu o site real, era só build desperdiçado. A usuária excluiu o projeto pela tela Settings → Delete Project. Sem impacto no site em produção.

## 10. Script do GTM confirmado no ar na pré-visualização

Causa raiz do "GTM-KX7V5WKL não encontrado" no Tag Assistant: a variável `NEXT_PUBLIC_GTM_ID` na Vercel estava marcada só para o ambiente Produção, não para Pré-visualização. Como variáveis com prefixo `NEXT_PUBLIC_` são gravadas no código durante o build, o deploy de pré-visualização do PR foi gerado sem o ID do contêiner, então o script do GTM nunca era inserido na página. Corrigido pela usuária (marcou também Pré-visualização e Desenvolvimento) e um novo deploy foi disparado na linha certa da lista de Deployments (havia risco de clicar em Redeploy numa linha de Produção de outro PR por engano, a lista mistura os dois).

Confirmado por código-fonte (Ctrl+U na URL de pré-visualização, busca por "googletagmanager"): antes da correção, 0 ocorrências; depois do redeploy, 3 ocorrências, confirmando que o script do GTM agora está presente na página. Próximo passo: testar no modo Preview do próprio Tag Manager (Tag Assistant) se a tag "GA4 - page_view" dispara corretamente, e só depois publicar o contêiner.

**Atualização: dois bugs reais encontrados e corrigidos durante o teste no Tag Assistant.**

1. A tag "GA4 - page_view" tinha sido criada com o tipo errado no Tag Manager ("Tag do Google", o mesmo tipo da tag de configuração), sem campos de nome de evento nem parâmetros, disparando sozinha no carregamento da página com o pageview automático do Google, sem passar pela nossa sanitização de URL. Corrigido pela usuária no próprio painel do GTM: trocado para o tipo "Google Analytics: evento do GA4", com nome do evento `page_view`, os três parâmetros mapeados (`page_location`, `page_referrer`, `page_path`) e o ID de métrica `G-EFJPEPFDLC`. Confirmado no Tag Assistant que o gatilho certo (`page_view - Evento personalizado`) está em uso.

2. Bug de código, corrigido no commit `f8e90e4`: a função `pushConsentUpdate` em `lib/consent.ts` mandava para o `dataLayer` um evento comum (`{event: "consent_update", analytics_storage: choice}`), formato que o Consent Mode do Google não reconhece. O comando correto é `gtag('consent', 'update', {...})`, que no dataLayer vira um array de comando, não um objeto de evento. Sem essa correção, aceitar o banner gravava a escolha no navegador da visitante mas o Google continuava enxergando `analytics_storage` como negado, e a tag do GA4 nunca disparava mesmo depois do aceite. Corrigido para empilhar o array no formato certo. Deploy da correção confirmado concluído pela Vercel às 20:04 UTC de 23 de setembro (commit `f8e90e4`, os dois projetos Vercel).

**Atualização, 24 de setembro: disparo confirmado no navegador, dois problemas reais a mais encontrados e corrigidos.**

1. **Bug de código, commit `d92fe7c`.** O script de consent default sempre mandava `analytics_storage: 'denied'`, mesmo para quem já tinha aceitado antes, porque cada carregamento completo de página cria um `dataLayer` novo, e o clique no banner só atualiza o carregamento em que aconteceu. Numa navegação interna (SPA) isso passava despercebido, mas em qualquer carregamento novo (recarregar, abrir de novo, conectar pelo Tag Assistant) o consentimento voltava a negado. Corrigido lendo o mesmo `localStorage` de `lib/consent.ts` antes de declarar o padrão. Subido direto para a `main` pelo PR #30.

2. **Erro de configuração no acionador do GTM, sem relação com o código.** O acionador "page_view" (usado pela tag "GA4 - page_view") não disparava mesmo com tudo aparentemente certo. A causa real só apareceu depois de reconectar o Tag Assistant do zero (a sessão de teste anterior, com mais de uma hora e dezenas de eventos, estava presa numa versão desatualizada do acionador): numa conexão nova, o filtro passou a aparecer como `page_view é igual a page_view`, os dois em verde, tag disparando "Concluída". Lição para próximos testes: se um acionador parecer certo na tela de edição mas continuar falhando no Preview, desconfiar da sessão do Tag Assistant estar velha antes de desconfiar do código, reconectar do zero resolve.

Com os dois problemas corrigidos, a tag "GA4 - page_view" dispara corretamente após o consentimento, com os três parâmetros sanitizados preenchidos com dados reais da página. Etapa 1 tecnicamente funcionando.

**Atualização final: contêiner publicado, dado confirmado no GA4.** A usuária publicou o contêiner no GTM e conferiu o relatório em tempo real do GA4 (`nuvemensino.com.br`, propriedade GA4): 1 usuário ativo, país Brasil, chegando de verdade. Etapa 1 (medição com Consent Mode v2, GTM, sanitização de URL) concluída e validada de ponta a ponta.
