# Minuta: atualização da Política de Privacidade

**Status: rascunho para revisão jurídica, não publicado.** Este arquivo não é lido pelo site, é só uma proposta de texto. Ninguém deve copiar isso direto para `messages/{pt,en,es}.json` sem passar por quem cuida da parte legal/LGPD do site, conforme já registrado em `docs/medicao/00-auditoria.md`.

## O que mudou e por quê

Dois pontos do texto atual (`messages/pt.json`, seção `privacy`) ficaram desatualizados com o trabalho de medição:

1. **Seção 3, "Compartilhamento de dados"**: cita "processadores de pagamento Stripe e Mercado Pago". O processador ativo hoje é o **Asaas** (confirmado com a usuária na auditoria inicial). Também passa a referenciar a seção de Cookies, para não duplicar a lista de ferramentas em dois lugares.
2. **Seção 6, "Cookies"**: o texto atual é genérico ("cookies essenciais" e "cookies analíticos"), sem nomear nenhuma ferramenta e sem mencionar cookies de publicidade. Hoje o site usa de fato: Google Analytics 4 e PostHog (cookies de análise) e Meta Pixel (cookies de publicidade), cada categoria com consentimento próprio, que a pessoa pode aceitar ou recusar separadamente no banner de cookies do site (Etapas 1 e 4 do projeto de medição).

A data de "Última atualização" também precisa mudar, mas não inventei uma data: fica um espaço reservado, para preencher com a data real de publicação, depois da revisão.

Não toquei em nenhuma outra seção (direitos do titular, retenção, segurança etc.), só nos dois pontos que ficaram desatualizados pelo trabalho técnico feito.

## Português (`messages/pt.json`)

**Cabeçalho:**
```
Última atualização: [DATA DA PUBLICAÇÃO] · NUVEM ENSINO · CNPJ 42.679.051/0001-31
```

**Seção 3, "Compartilhamento de dados":**
```
Não vendemos seus dados. Compartilhamos informações com terceiros apenas quando
necessário para a prestação dos serviços, como o processador de pagamento (Asaas)
e as ferramentas de medição e publicidade descritas na seção 6, "Cookies", ou por
obrigação legal.
```

**Seção 6, "Cookies":**
```
Utilizamos cookies essenciais para o funcionamento da plataforma (autenticação e
preferências), sempre ativos. Com o seu consentimento, também usamos dois outros
tipos: cookies de análise (Google Analytics e PostHog), que ajudam a entender como
o site é usado para melhorar a experiência; e cookies de publicidade (Meta Pixel),
usados para mostrar anúncios mais relevantes em outras plataformas, sem identificar
quem você é. Nenhum dado de saúde é coletado por meio desses cookies. Você pode
aceitar, recusar ou revisar sua escolha a qualquer momento no banner de cookies do
site, e também desativar cookies diretamente nas configurações do seu navegador, o
que pode afetar algumas funcionalidades.
```

## English (`messages/en.json`)

**Header:**
```
Last updated: [PUBLICATION DATE] · NUVEM ENSINO · CNPJ 42.679.051/0001-31
```

**Section 3, "Data sharing":**
```
We do not sell your data. We share information with third parties only when
necessary for service provision, such as our payment processor (Asaas) and the
measurement and advertising tools described in section 6, "Cookies", or by legal
obligation.
```

**Section 6, "Cookies":**
```
We use essential cookies for platform operation (authentication and preferences),
always active. With your consent, we also use two other types: analytics cookies
(Google Analytics and PostHog), which help us understand how the site is used to
improve the experience; and advertising cookies (Meta Pixel), used to show more
relevant ads on other platforms, without identifying who you are. No health data
is collected through these cookies. You can accept, decline, or review your choice
at any time in the site's cookie banner, and also disable cookies directly in your
browser settings, which may affect some features.
```

## Español (`messages/es.json`)

**Encabezado:**
```
Última actualización: [FECHA DE PUBLICACIÓN] · NUVEM ENSINO · CNPJ 42.679.051/0001-31
```

**Sección 3, "Compartición de datos":**
```
No vendemos tus datos. Compartimos información con terceros solo cuando es
necesario para la prestación de los servicios, como el procesador de pago (Asaas)
y las herramientas de medición y publicidad descritas en la sección 6, "Cookies",
o por obligación legal.
```

**Sección 6, "Cookies":**
```
Utilizamos cookies esenciales para el funcionamiento de la plataforma
(autenticación y preferencias), siempre activas. Con tu consentimiento, también
usamos otros dos tipos: cookies de análisis (Google Analytics y PostHog), que
ayudan a entender cómo se usa el sitio para mejorar la experiencia; y cookies de
publicidad (Meta Pixel), usadas para mostrar anuncios más relevantes en otras
plataformas, sin identificar quién eres. Ningún dato de salud es recopilado por
medio de estas cookies. Puedes aceptar, rechazar o revisar tu elección en
cualquier momento en el banner de cookies del sitio, y también desactivar las
cookies directamente en la configuración de tu navegador, lo que puede afectar
algunas funcionalidades.
```

## Depois da revisão

Quando o texto final estiver aprovado, é só me pedir para aplicar em `messages/pt.json`, `messages/en.json` e `messages/es.json` (seções `privacy.sections[2]` e `privacy.sections[5]`, mais `privacy.lastUpdated`), com a data real de publicação.
