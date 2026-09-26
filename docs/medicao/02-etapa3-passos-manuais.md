# Etapa 3: passos manuais (eventos de conversão)

Três eventos novos. Dois disparam no navegador e precisam de configuração no Tag Manager (`begin_checkout` e `sign_up`), igual fizemos na Etapa 1 para o `page_view`. O terceiro (`purchase`) é mandado direto do servidor para o GA4, não passa pelo Tag Manager, só precisa de duas variáveis de ambiente na Vercel.

## 1. `begin_checkout` (dispara ao clicar em pagar no checkout)

O código já manda para o `dataLayer`:

```js
dataLayer.push({
  event: "begin_checkout",
  value: 890,
  currency: "BRL",
  payment_method: "pix",
});
```

(o código também manda um campo `items` com o curso, mas por enquanto não precisa mapear isso no GTM, é só para referência futura, se um dia quisermos remontar o "carrinho" completo)

No Tag Manager:

1. **Acionadores** → **Novo** → tipo **Evento personalizado**.
2. Nome do acionador: `begin_checkout`.
3. Nome do evento: `begin_checkout`.
4. Salvar.
5. **Variáveis** → **Novo** (uma para cada):
   - `DLV - value`, camada de dados `value`
   - `DLV - currency`, camada de dados `currency`
   - `DLV - payment_method`, camada de dados `payment_method`
6. **Tags** → **Nova** → tipo **Google Analytics: evento do GA4**.
7. Nome da tag: `GA4 - begin_checkout`.
8. ID da métrica: `G-EFJPEPFDLC` (o mesmo de sempre).
9. Nome do evento: `begin_checkout`.
10. Parâmetros de evento:
    - `value` → `{{DLV - value}}`
    - `currency` → `{{DLV - currency}}`
    - `payment_method` → `{{DLV - payment_method}}`
11. **Ainda em "Parâmetros de evento"** (a mesma lista de `value`/`currency`/`payment_method`, não é uma seção separada): adicione mais uma linha, `page_location` → `{{DLV - page_location}}` (a mesma variável de camada de dados criada na Etapa 1). Interfaces mais antigas do GTM tinham uma seção separada chamada "Campos a definir" para isso; na interface atual (testado em 26/09/2026) não existe mais essa seção, o GA4 aceita `page_location` como um parâmetro de evento normal e usa o valor enviado no lugar do automático. **Isso é obrigatório aqui**: sem esse parâmetro, o GA4 preenche `page_location` sozinho com a URL crua do navegador no momento do disparo, ignorando a sanitização, porque essa tag não herda automaticamente o valor definido na tag "GA4 - page_view", cada tag de evento faz sua própria coleta automática desses campos. Isso é particularmente sensível aqui porque `begin_checkout` dispara em `/checkout/[slug]`, justamente uma das rotas que `lib/analyticsSanitize.ts` trata como sensível.
12. Acionamento: `begin_checkout` (o que criou no passo 1).
13. Salvar.

## 2. `sign_up` (dispara ao concluir o cadastro por e-mail)

O código manda:

```js
dataLayer.push({ event: "sign_up", method: "email" });
```

No Tag Manager, mesmo passo a passo do anterior, mais simples (só um parâmetro):

1. **Acionadores** → **Novo** → **Evento personalizado**, nome `sign_up`, nome do evento `sign_up`.
2. **Variáveis** → **Novo**: `DLV - method`, camada de dados `method`.
3. **Tags** → **Nova** → **Google Analytics: evento do GA4**.
4. Nome: `GA4 - sign_up`. ID da métrica: `G-EFJPEPFDLC`. Nome do evento: `sign_up`.
5. Parâmetros de evento: `method` → `{{DLV - method}}`, e mais uma linha `page_location` → `{{DLV - page_location}}`, mesmo motivo e mesma variável do passo 11 do `begin_checkout` acima.
7. Acionamento: `sign_up`.
8. Salvar.

## 3. `purchase` (não precisa de nada no Tag Manager)

Esse evento é mandado direto do servidor para o GA4, no momento em que o webhook da Asaas confirma que o pagamento foi realmente recebido (não quando o boleto é só gerado, nem quando o PIX aparece na tela, para não contar venda pendente como venda fechada). Só duas coisas pendentes do seu lado, na Vercel:

1. No GA4: **Administrador** → **Fluxos de dados** → clique no fluxo do site → copie o **Measurement ID** (já sabemos que é `G-EFJPEPFDLC`).
2. Ainda na mesma tela do fluxo de dados, role até **Measurement Protocol API secrets** → **Criar** → dê um nome (ex: "servidor de compras") → copie o **valor do secret** gerado (só aparece uma vez).
3. Na Vercel, no projeto `nuvem-ensino-platform` → **Settings** → **Environment Variables**, adicione:
   - `GA4_MEASUREMENT_ID` = `G-EFJPEPFDLC` (tipo Config, marcado para Production, Preview e Development)
   - `GA4_API_SECRET` = o valor copiado no passo 2 (tipo **Secreto**, marcado para Production, Preview e Development)
4. Gere um novo deploy depois de salvar (mesma lembrança de sempre: as variáveis `NEXT_PUBLIC_` e as lidas só pelo servidor só entram em vigor em um deploy novo, não em variáveis já salvas num deploy antigo).

Sem essas duas variáveis configuradas, o código simplesmente não manda o evento de compra (sem erro, sem quebrar nada, só fica sem essa medição até você configurar).

## Teste no Preview (Tag Assistant)

Para `begin_checkout` e `sign_up`: mesmo processo da Etapa 1, conectar o Preview, fazer a ação (chegar até o botão de pagar, ou terminar um cadastro de teste) e conferir se a tag aparece em "Tags disparadas".

Para `purchase`: não aparece no Tag Assistant, porque não passa pelo GTM. Para conferir, olhe o relatório em tempo real do GA4 depois de uma compra de teste (ou aguarde uma compra real), ou veja os eventos brutos em **Administrador → DebugView** do GA4 (funciona mesmo sem passar pelo GTM Preview, desde que o navegador de teste tenha o parâmetro de debug, algo que pode ser configurado depois se for útil).
