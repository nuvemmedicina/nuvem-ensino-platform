# Etapa 1: passos manuais no Google Tag Manager e no GA4

O código já está pronto e publicado (branch `claude/medicao-e-indexacao`, commit `23f385e`). Ele carrega o contêiner do Tag Manager (`GTM-KX7V5WKL`) e, a cada troca de página, avisa o `dataLayer` com o evento `page_view`, já com a URL sanitizada (sem nenhum parâmetro de busca fora de `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`, e sem nenhum parâmetro em rotas sensíveis como `/dashboard`, `/checkout`, `/admin`, `/instrutor` e as páginas de login e cadastro).

O que falta é configuração de dentro do próprio painel do Tag Manager, que eu não tenho como fazer. Sem isso, o GA4 continua sem receber dado nenhum, mesmo com o código certo.

## 1. Variável de ambiente na Vercel

Antes de tudo, adicione a variável nova (é diferente da antiga, `NEXT_PUBLIC_GA_ID`, que o código não lê mais):

- Chave: `NEXT_PUBLIC_GTM_ID`
- Valor: `GTM-KX7V5WKL`
- Tipo: **Config**, não Segredo (mesma lição de antes: prefixo `NEXT_PUBLIC_` precisa ir para o navegador)
- Ambiente: Produção

Depois de salvar, gere um novo deploy, do mesmo jeito que fez para o GA4.

## 2. Dentro do Tag Manager (tagmanager.google.com, contêiner GTM-KX7V5WKL)

**2.1. Variáveis.** Em Variáveis, crie três Variáveis de Camada de Dados (Data Layer Variable):

| Nome da variável | Nome da variável de camada de dados |
|---|---|
| DLV - page_location | `page_location` |
| DLV - page_referrer | `page_referrer` |
| DLV - page_path | `page_path` |

**2.2. Acionador (Trigger).** Em Acionadores, crie um novo:
- Tipo: Evento personalizado
- Nome do evento: `page_view`
- Nome do acionador: "Evento personalizado - page_view"

**2.3. Tag de configuração do GA4.** Em Tags, crie uma nova:
- Tipo: Google Tag (ou "Configuração do Google Analytics: GA4", dependendo da versão da interface)
- ID de medição: `G-EFJPEPFDLC`
- **Importante:** desmarque a opção "Enviar um evento page_view quando esta configuração for carregada". O código já envia o `page_view` manualmente, com a URL sanitizada, então essa opção automática enviaria a URL crua do navegador por cima, duplicando e ignorando a sanitização.
- Acionador: Todas as páginas (Initialization - All Pages, ou All Pages)
- Nome da tag: "GA4 - Configuração"

**2.4. Tag de evento page_view.** Crie outra tag:
- Tipo: Evento do Google Analytics: GA4
- Tag de configuração: a tag criada no passo 2.3
- Nome do evento: `page_view`
- Parâmetros do evento:
  - `page_location` = `{{DLV - page_location}}`
  - `page_referrer` = `{{DLV - page_referrer}}`
  - `page_path` = `{{DLV - page_path}}`
- Acionador: "Evento personalizado - page_view", do passo 2.2
- Nome da tag: "GA4 - page_view"

**2.5. Testar antes de publicar.** Clique em Visualizar (Preview), abra o site (depois do deploy com a variável nova), navegue entre duas ou três páginas, e confira na tela de depuração do Tag Manager:
- Se a tag "GA4 - page_view" dispara a cada navegação
- Se o valor de `page_location` mostrado é a URL sanitizada (sem parâmetro estranho, e sem nenhum parâmetro em página de dashboard ou checkout)
- Se o estado de consentimento aparece como negado antes de você aceitar o banner no site, e passa a permitido depois de clicar em Aceitar

**2.6. Publicar.** Só depois de testar, clique em Enviar (Submit) e publique a versão. Nada do que foi configurado vale enquanto não for publicado.

## 3. Depois de publicado

- Abra o relatório em tempo real do GA4 e confirme que os dados chegam.
- Navegue pelo site você mesma, teste o banner de consentimento (aparece na primeira visita, esconde depois de aceitar ou recusar, e não aparece de novo na mesma aba).
- Teste especificamente uma URL de retorno de pagamento ou um link com parâmetro estranho (por exemplo, `/cursos/algum-curso?ref=teste123`) e confira, na tela de depuração do Tag Manager, que `ref=teste123` não aparece em nenhum lugar, só ficaria se fosse `utm_source` e afins.

## 4. Pendências que não são deste código

- **Texto do banner de consentimento**: está em `messages/pt.json`, `en.json` e `es.json`, sob a chave `consent`. Foi escrito para ser simples e direto, sem jargão e sem prometer nada, mas precisa de revisão jurídica antes de considerar definitivo, como já estava previsto desde o início deste trabalho.
- **Marcar eventos-chave no GA4**: ainda não existem eventos personalizados (só a visualização de página, como a Etapa 1 pedia), isso entra na Etapa 3.
- **Exclusão de tráfego interno e de referências**: configuração de dentro do próprio GA4, no painel de Administrador, não depende de código.
