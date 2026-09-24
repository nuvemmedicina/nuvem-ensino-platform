# Etapa 4: passos manuais (Meta Pixel)

O GTM não tem um tipo de tag pronto do Google para o Meta Pixel (diferente do GA4). Por isso, as três tags do Meta usam o tipo **HTML personalizado**, com o código padrão que o próprio Meta fornece. São três tags reaproveitando os acionadores que já existem (`begin_checkout` e `sign_up` da Etapa 3), mais um novo para a página vista.

ID do Pixel: `1355104133372437`

## Atenção especial: consentimento

Diferente das tags do tipo "Tag do Google"/"Google Analytics: evento do GA4", uma tag **HTML personalizado não respeita o Consent Mode sozinha**. Se não configurarmos isso manualmente, o Pixel do Meta dispara mesmo sem a pessoa ter aceitado o cookie de publicidade, o que quebraria a regra de privacidade deste projeto. Por isso, **em cada uma das três tags abaixo**, depois de criar, é obrigatório:

1. Role até **"Configurações avançadas"** → **"Consentimento"**.
2. Marque **"Exigir consentimento adicional para a tag ser disparada"**.
3. Adicione o tipo de consentimento **`ad_storage`**.

Sem isso, pule para o próximo passo achando que terminou: a tag vai continuar disparando para todo mundo, aceite ou não.

## 1. Tag base do Pixel (visualização de página)

1. **Tags** → **Nova**.
2. Tipo: **HTML personalizado**.
3. Cole exatamente este código, sem alterar nada:

```html
<script>
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '1355104133372437');
fbq('track', 'PageView');
</script>
```

4. Nome da tag: `Meta Pixel - Base`
5. Acionamento: **Initialization - All Pages** (a mesma que a tag "GA4 - Configuração" usa).
6. Configurações avançadas → Consentimento → exigir `ad_storage` (ver seção acima).
7. Salvar.

## 2. Tag de início de checkout

1. **Tags** → **Nova** → **HTML personalizado**.
2. Código:

```html
<script>
fbq('track', 'InitiateCheckout', {
  value: {{DLV - value}},
  currency: {{DLV - currency}}
});
</script>
```

3. Nome: `Meta Pixel - InitiateCheckout`
4. Acionamento: **begin_checkout** (o mesmo acionador da Etapa 3, não precisa criar de novo).
5. Configurações avançadas → Consentimento → exigir `ad_storage`.
6. Configurações avançadas → **Sequenciamento de tags** → **"Disparar uma tag antes desta"** → marque a tag `Meta Pixel - Base`. Isso garante que o Pixel já esteja carregado antes desse evento tentar usar ele (sem isso, dá erro no navegador e o evento se perde).
7. Salvar.

## 3. Tag de cadastro

1. **Tags** → **Nova** → **HTML personalizado**.
2. Código:

```html
<script>
fbq('track', 'Lead');
</script>
```

3. Nome: `Meta Pixel - Lead`
4. Acionamento: **sign_up** (o mesmo acionador da Etapa 3).
5. Configurações avançadas → Consentimento → exigir `ad_storage`.
6. Configurações avançadas → Sequenciamento de tags → "Disparar uma tag antes desta" → `Meta Pixel - Base`.
7. Salvar.

## 4. Testar no Preview

Mesmo processo de sempre: conectar o Preview numa conexão nova, navegar pelo site, chegar até o checkout e o cadastro. O Tag Assistant mostra as tags de HTML personalizado igual às outras, então dá para conferir se disparam. Uma diferença: como é HTML personalizado, não tem a tela bonita de "parâmetros" que as tags do Google mostram, mas o status de disparado/não disparado aparece do mesmo jeito.

Para conferir que o Pixel está mesmo recebendo os eventos (não só que a tag disparou no GTM), instale a extensão **Meta Pixel Helper** no Chrome (Chrome Web Store, gratuita, da própria Meta) e veja se ela detecta o Pixel `1355104133372437` na página, com os eventos PageView/InitiateCheckout/Lead aparecendo.

## 5. Token da API de Conversões (evento de compra, do servidor)

O evento `Purchase` não passa pelo GTM, é mandado direto do servidor no momento em que o webhook da Asaas confirma o pagamento (mesma lógica do `purchase` do GA4 na Etapa 3).

1. No **Gerenciador de Eventos** do Meta Business, clique no Pixel (`1355104133372437`).
2. Vá em **Configurações**.
3. Role até **"API de Conversões"** → **"Gerar token de acesso"**.
4. Copie o token gerado.
5. Na Vercel, projeto `nuvem-ensino-platform` → **Settings** → **Environment Variables**, adicione:
   - `META_PIXEL_ID` = `1355104133372437` (tipo Config, marcado para Production, Preview e Development)
   - `META_CONVERSIONS_API_TOKEN` = o token copiado (tipo **Sensitive**, marcado para Production, Preview e Development)
6. Gere um novo deploy.

Sem essas duas variáveis, o código simplesmente não manda o evento de compra pro Meta, sem quebrar nada.

## 6. Publicar o contêiner

Depois de testar tudo no Preview, **Enviar** → nomear a versão → **Publicar**, igual sempre.

## Sobre o `Purchase` (não dá para testar no Preview)

Assim como o `purchase` do GA4, esse evento só é confirmado numa compra real (o webhook da Asaas precisa receber a confirmação de pagamento de verdade). Para conferir depois de uma venda real, use o **Gerenciador de Eventos** do Meta → aba **"Testar eventos"**, ou o relatório de eventos do próprio Pixel.
