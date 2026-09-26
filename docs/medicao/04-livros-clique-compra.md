# Clique em "Comprar na Rubio" (página /livros)

A compra dos livros acontece inteiramente no site da Editora Rubio, fora do nosso domínio, então não existe evento de compra que a gente consiga medir do nosso lado. O clique no botão "Comprar na Rubio" é o sinal mais próximo de intenção de compra disponível, e é isso que fica registrado, para depois virar meta de conversão no Google Ads.

O código já manda para o `dataLayer` (`components/BuyBookLink.tsx`), a cada clique num botão de comprar:

```js
dataLayer.push({
  event: "select_content",
  content_type: "livro",
  item_id: "testes-respiratorios-em-gastrenterologia-hidrogenio-metano-e-helicobacter-pylori",
  item_name: "Testes Respiratórios em Gastrenterologia: Hidrogênio, Metano e Helicobacter Pylori",
});
```

`item_id` vem do próprio link do produto na Rubio (o nome do arquivo antes do `.html`), não é inventado. Sem dado pessoal em nenhum campo.

## No Tag Manager

1. **Acionadores** → **Novo** → **Evento personalizado**, nome do evento `select_content`, nome do acionador "Evento personalizado - select_content".
2. **Variáveis** → **Novo** (uma para cada):
   - `DLV - content_type`, camada de dados `content_type`
   - `DLV - item_id`, camada de dados `item_id`
   - `DLV - item_name`, camada de dados `item_name`
3. **Tags** → **Nova** → tipo **Google Analytics: evento do GA4**.
4. Nome da tag: `GA4 - select_content`.
5. ID da métrica: `G-EFJPEPFDLC`.
6. Nome do evento: `select_content`.
7. Parâmetros de evento:
   - `content_type` → `{{DLV - content_type}}`
   - `item_id` → `{{DLV - item_id}}`
   - `item_name` → `{{DLV - item_name}}`
   - `page_location` → `{{DLV - page_location}}` (mesma variável sanitizada da Etapa 1, pelo mesmo motivo já documentado na Etapa 3)
8. Acionamento: "Evento personalizado - select_content", do passo 1.
9. Salvar, testar no Preview (clicar em "Comprar" num livro e conferir se a tag dispara com os parâmetros certos) e só depois publicar.

## Para usar como meta no Google Ads

Depois de publicado e confirmado que o evento chega no GA4 (Administrador → Eventos, ou tempo real), no próprio GA4: **Administrador → Eventos → marcar `select_content` como conversão**, ou criar uma conversão personalizada filtrando por `content_type = livro`. Como o GA4 e o Google Ads dessa conta ainda não foram vinculados, também é preciso: **Google Ads → Ferramentas → Conversões → Importar → Google Analytics (GA4)**, selecionar essa conversão, e só então ela aparece disponível pra escolher como meta de otimização da campanha de livros.

## Mesmo clique, agora também pro Meta Pixel

Reaproveita o acionador `select_content` que você já criou acima, não precisa de nenhum código novo nem acionador novo, só mais uma tag.

1. **Tags** → **Nova** → **HTML personalizado**.
2. Código:

```html
<script>
fbq('trackCustom', 'ViewContent', {
  content_type: {{DLV - content_type}},
  content_name: {{DLV - item_name}},
  content_ids: [{{DLV - item_id}}]
});
</script>
```

3. Nome: `Meta Pixel - ViewContent Livro`
4. Acionamento: **select_content** (o mesmo acionador de cima, não precisa criar de novo).
5. Configurações avançadas → Consentimento → exigir `ad_storage` (mesma regra de sempre pras tags de HTML personalizado do Meta).
6. Configurações avançadas → Sequenciamento de tags → "Disparar uma tag antes desta" → `Meta Pixel - Base`.
7. Salvar, testar no Preview e publicar.

Isso alimenta o Pixel com um evento por livro clicado, disponível pra usar como meta de otimização na campanha de Meta Ads dos livros assim que houver volume suficiente (pelo menos ~50 eventos em 7 dias, recomendação do próprio Meta para uma conversão sair do modo de aprendizado).
