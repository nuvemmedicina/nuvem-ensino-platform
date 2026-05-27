import {
  Document,
  Page,
  Text,
  View,
  Font,
  Image,
  Svg,
  Rect,
  Circle,
  Path,
} from "@react-pdf/renderer";
import path from "path";

// ── Fontes ─────────────────────────────────────────────────────────────────
Font.register({ family: "Helvetica", fonts: [{ src: "Helvetica" }, { src: "Helvetica-Bold", fontWeight: "bold" }] });
Font.register({ family: "Times",     fonts: [{ src: "Times-Roman" }, { src: "Times-Bold", fontWeight: "bold" }] });
Font.register({ family: "GreatVibes", src: path.join(process.cwd(), "public", "fonts", "GreatVibes-Regular.ttf") });

// ── Paleta ─────────────────────────────────────────────────────────────────
const C = {
  teal:      "#00475e",
  tealMid:   "#006580",
  tealLight: "#00a3c4",
  tealPale:  "#e8f4f8",
  gold:      "#c49a28",
  goldLight: "#f5e9c0",
  offwhite:  "#f5f3ec",
  white:     "#ffffff",
  dark:      "#1a1a1a",
  gray:      "#5a5a5a",
  grayLight: "#e8e6df",
  green:     "#16a34a",
  blue:      "#2563eb",
  red:       "#ef4444",
  purple:    "#635bff",
  mpBlue:    "#00b1ea",
};

// ── Helpers ─────────────────────────────────────────────────────────────────
const bold = { fontFamily: "Helvetica", fontWeight: "bold" } as const;
const reg  = { fontFamily: "Helvetica" } as const;

// ── Props ───────────────────────────────────────────────────────────────────
type Props = { logoUri?: string; isoSeal?: string };

const TOTAL = 10;

// ── Componentes base ────────────────────────────────────────────────────────

/** Rodape de slide */
function SlideFooter({ page, total }: { page: number; total: number }) {
  return (
    <View style={{ position: "absolute", bottom: 18, left: 0, right: 0, flexDirection: "row", alignItems: "center", paddingHorizontal: 36 }}>
      <View style={{ flex: 1, height: 0.5, backgroundColor: C.gold, opacity: 0.4 }} />
      <Text style={{ ...reg, fontSize: 7, color: C.gray, marginHorizontal: 10 }}>NU.V.E.M ENSINO — Confidencial</Text>
      <View style={{ flex: 1, height: 0.5, backgroundColor: C.gold, opacity: 0.4 }} />
      <Text style={{ ...reg, fontSize: 7, color: C.gray, marginLeft: 10 }}>{page}/{total}</Text>
    </View>
  );
}

/** Cabecalho de slide */
function SlideHeader({ cap, title, bg = C.teal }: { cap: string; title: string; bg?: string }) {
  return (
    <View style={{ backgroundColor: bg, paddingHorizontal: 40, paddingVertical: 20 }}>
      <Text style={{ ...reg, fontSize: 9, color: C.gold, letterSpacing: 2, marginBottom: 4 }}>{cap}</Text>
      <Text style={{ ...bold, fontSize: 22, color: C.white }}>{title}</Text>
    </View>
  );
}

/** Linha de topico com circulo colorido + letra inicial */
function BulletRow({ icon, title, desc, color = C.teal }: { icon: string; title: string; desc: string; color?: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-start", marginBottom: 10 }}>
      <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: color, alignItems: "center", justifyContent: "center", marginRight: 10, flexShrink: 0, marginTop: 1 }}>
        <Text style={{ ...bold, fontSize: 9, color: C.white }}>{icon}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ ...bold, fontSize: 9.5, color: C.dark, marginBottom: 2 }}>{title}</Text>
        <Text style={{ ...reg, fontSize: 8, color: C.gray, lineHeight: 1.5 }}>{desc}</Text>
      </View>
    </View>
  );
}

/** Card KPI */
function KpiCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent: string }) {
  return (
    <View style={{ flex: 1, backgroundColor: C.white, borderRadius: 8, padding: 12, borderLeftWidth: 3, borderLeftColor: accent, marginHorizontal: 4 }}>
      <Text style={{ ...reg, fontSize: 7, color: C.gray, marginBottom: 4, letterSpacing: 0.5 }}>{label.toUpperCase()}</Text>
      <Text style={{ ...bold, fontSize: 18, color: C.dark }}>{value}</Text>
      {sub && <Text style={{ ...reg, fontSize: 7, color: C.gray, marginTop: 2 }}>{sub}</Text>}
    </View>
  );
}

/** Barra de progresso */
function ProgressBar({ label, pct, color }: { label: string; pct: number; color: string }) {
  return (
    <View style={{ marginBottom: 8 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 2 }}>
        <Text style={{ ...reg, fontSize: 8, color: C.dark }}>{label}</Text>
        <Text style={{ ...bold, fontSize: 8, color }}>{pct}%</Text>
      </View>
      <View style={{ height: 5, backgroundColor: C.grayLight, borderRadius: 3 }}>
        <View style={{ height: 5, width: `${pct}%`, backgroundColor: color, borderRadius: 3 }} />
      </View>
    </View>
  );
}

/** Alerta/info box */
function InfoBox({ label, desc, bg, color }: { label: string; desc: string; bg: string; color: string }) {
  return (
    <View style={{ backgroundColor: bg, borderRadius: 6, padding: 8, marginTop: 6 }}>
      <Text style={{ ...bold, fontSize: 8, color }}>{label}</Text>
      <Text style={{ ...reg, fontSize: 7.5, color: C.gray, marginTop: 2, lineHeight: 1.4 }}>{desc}</Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SLIDE 1 — CAPA
// ─────────────────────────────────────────────────────────────────────────────
function SlideCover({ logoUri }: { logoUri?: string }) {
  return (
    <Page size="A4" orientation="landscape" style={{ backgroundColor: C.teal, flexDirection: "row" }}>
      <View style={{ width: 8, backgroundColor: C.gold }} />

      <View style={{ flex: 1, flexDirection: "column", padding: 50 }}>
        <View style={{ marginBottom: 36 }}>
          {logoUri ? (
            <Image src={logoUri} style={{ width: 140, height: 52, objectFit: "contain" }} />
          ) : (
            <Text style={{ ...bold, fontSize: 20, color: C.white, letterSpacing: 3 }}>NU.V.E.M ENSINO</Text>
          )}
        </View>

        <View style={{ flex: 1, justifyContent: "center" }}>
          <Text style={{ fontFamily: "GreatVibes", fontSize: 44, color: C.goldLight, marginBottom: 12 }}>
            Relatorio de Desenvolvimento
          </Text>
          <Text style={{ ...bold, fontSize: 28, color: C.white, lineHeight: 1.3, letterSpacing: 0.5, marginBottom: 20 }}>
            {"Nova Plataforma\nNU.V.E.M ENSINO"}
          </Text>
          <View style={{ width: 60, height: 2, backgroundColor: C.gold, marginBottom: 20 }} />
          <Text style={{ ...reg, fontSize: 12, color: C.white + "cc", lineHeight: 1.6 }}>Apresentado a Dra. Vera Angelo</Text>
          <Text style={{ ...reg, fontSize: 10, color: C.white + "88", marginTop: 4 }}>Maio de 2026</Text>
        </View>

        <Text style={{ ...reg, fontSize: 8, color: C.white + "55" }}>Documento confidencial — uso interno</Text>
      </View>

      <View style={{ width: 200, backgroundColor: C.tealMid, alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
        <Svg width={200} height={595} viewBox="0 0 200 595" style={{ position: "absolute", top: 0, left: 0 }}>
          <Circle cx="160" cy="80"  r="90"  fill={C.tealLight} opacity="0.15" />
          <Circle cx="30"  cy="300" r="120" fill={C.gold}      opacity="0.08" />
          <Circle cx="150" cy="500" r="100" fill={C.tealLight} opacity="0.12" />
          <Rect x="0" y="0" width="2" height="595" fill={C.gold} opacity="0.3" />
        </Svg>
        <View style={{ alignItems: "center" }}>
          {["TECNOLOGIA", "INOVACAO", "EDUCACAO"].map((w, i) => (
            <Text key={w} style={{ ...bold, fontSize: 11, color: i === 1 ? C.gold : C.white + "77", letterSpacing: 2, marginBottom: 10 }}>{w}</Text>
          ))}
        </View>
      </View>
    </Page>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SLIDE 2 — A GRANDE MIGRACAO
// ─────────────────────────────────────────────────────────────────────────────
function SlideMigracao() {
  const before = [
    ["WordPress",            "CMS pesado, atualizacoes constantes e conflitos de plugins"],
    ["WooCommerce",          "E-commerce generico, sem suporte nativo a cursos online"],
    ["Tutor LM",             "Plugin LMS engessado, interface datada, sem personalizacao"],
    ["Hospedagem compartilhada", "Lentidao em picos, sem escala automatica"],
    ["Temas prontos",        "Impossivel personalizar sem conhecimento tecnico avancado"],
    ["Pagamentos limitados", "Apenas metodos nacionais, sem integracao internacional"],
  ];
  const after = [
    ["Next.js 16 + React 19",    "Framework de ultima geracao, renderizacao hibrida e velocidade maxima"],
    ["Plataforma 100% proprietaria", "Codigo exclusivo, sem dependencia de plugins ou temas"],
    ["Design personalizado",     "Layout criado do zero para a identidade da NU.V.E.M ENSINO"],
    ["Vercel Edge Network",      "CDN global com escala automatica e 99,9% de disponibilidade"],
    ["Mercado Pago + Stripe",    "Pagamentos nacionais e internacionais integrados nativamente"],
    ["Banco Neon serverless",    "PostgreSQL elastico, expansao automatica conforme crescimento"],
  ];

  return (
    <Page size="A4" orientation="landscape" style={{ backgroundColor: C.offwhite, padding: 0 }}>
      <SlideHeader cap="CAPITULO 1" title="A Grande Migracao" />

      <View style={{ flex: 1, padding: 28, flexDirection: "row", gap: 16 }}>
        {/* Antes */}
        <View style={{ flex: 1, backgroundColor: C.white, borderRadius: 10, padding: 18, borderTopWidth: 3, borderTopColor: C.red }}>
          <Text style={{ ...bold, fontSize: 10, color: C.red, letterSpacing: 1, marginBottom: 14 }}>ANTES</Text>
          {before.map(([t, d]) => (
            <View key={t} style={{ flexDirection: "row", marginBottom: 8 }}>
              <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: C.red + "22", alignItems: "center", justifyContent: "center", marginRight: 8, flexShrink: 0, marginTop: 1 }}>
                <Text style={{ ...bold, fontSize: 8, color: C.red }}>x</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ ...bold, fontSize: 8.5, color: C.dark }}>{t}</Text>
                <Text style={{ ...reg, fontSize: 7.5, color: C.gray, lineHeight: 1.4 }}>{d}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Seta */}
        <View style={{ width: 36, alignItems: "center", justifyContent: "center" }}>
          <Svg width={36} height={36} viewBox="0 0 36 36">
            <Path d="M4 18 L28 18 M20 10 L28 18 L20 26" stroke={C.gold} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </Svg>
        </View>

        {/* Depois */}
        <View style={{ flex: 1, backgroundColor: C.white, borderRadius: 10, padding: 18, borderTopWidth: 3, borderTopColor: C.teal }}>
          <Text style={{ ...bold, fontSize: 10, color: C.teal, letterSpacing: 1, marginBottom: 14 }}>AGORA</Text>
          {after.map(([t, d]) => (
            <View key={t} style={{ flexDirection: "row", marginBottom: 8 }}>
              <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: C.teal + "22", alignItems: "center", justifyContent: "center", marginRight: 8, flexShrink: 0, marginTop: 1 }}>
                <Text style={{ ...bold, fontSize: 8, color: C.teal }}>v</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ ...bold, fontSize: 8.5, color: C.dark }}>{t}</Text>
                <Text style={{ ...reg, fontSize: 7.5, color: C.gray, lineHeight: 1.4 }}>{d}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <SlideFooter page={2} total={TOTAL} />
    </Page>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SLIDE 3 — VELOCIDADE
// ─────────────────────────────────────────────────────────────────────────────
function SlideVelocidade() {
  return (
    <Page size="A4" orientation="landscape" style={{ backgroundColor: C.offwhite, padding: 0 }}>
      <SlideHeader cap="CAPITULO 2" title="Velocidade & Performance" bg={C.tealMid} />

      <View style={{ flex: 1, padding: 24, flexDirection: "column" }}>
        <View style={{ flexDirection: "row", marginBottom: 18 }}>
          <KpiCard label="Carregamento"   value="< 1s"   sub="vs 4-8s no WordPress"   accent={C.teal} />
          <KpiCard label="Lighthouse"     value="100"   sub="Core Web Vitals"          accent={C.gold} />
          <KpiCard label="Uptime"         value="99.9%" sub="SLA Vercel Edge"          accent={C.teal} />
          <KpiCard label="Escala"         value="Inf."  sub="sem configuracao manual"  accent={C.gold} />
        </View>

        <View style={{ flexDirection: "row", gap: 18 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ ...bold, fontSize: 10, color: C.teal, marginBottom: 12 }}>Pilares de Performance</Text>
            <BulletRow icon="V" title="Server-Side Rendering (SSR)" desc="Paginas geradas no servidor a cada requisicao, sempre com dados frescos e HTML pre-renderizado para os crawlers." color={C.teal} />
            <BulletRow icon="T" title="Turbopack — Compilador Rust" desc="Substitui o Webpack. Hot-reload abaixo de 100ms no desenvolvimento, build de producao ate 10x mais rapido." color={C.tealMid} />
            <BulletRow icon="C" title="Vercel Edge Network" desc="CDN global em 100+ regioes. Os assets sao servidos a partir do servidor mais proximo do usuario em qualquer lugar do mundo." color={C.teal} />
            <BulletRow icon="M" title="Streaming de Video MUX" desc="Player com adaptive bitrate: qualidade ajustada automaticamente a velocidade de internet do aluno." color={C.gold} />
          </View>

          <View style={{ width: 240, backgroundColor: C.white, borderRadius: 10, padding: 18 }}>
            <Text style={{ ...bold, fontSize: 10, color: C.teal, marginBottom: 14 }}>Comparativo de Scores</Text>
            <Text style={{ ...bold, fontSize: 8, color: C.gray, marginBottom: 8 }}>Performance (Google PageSpeed)</Text>
            <ProgressBar label="Nova plataforma"   pct={98} color={C.teal} />
            <ProgressBar label="WordPress tipico"  pct={42} color={C.red} />
            <View style={{ marginTop: 10 }} />
            <Text style={{ ...bold, fontSize: 8, color: C.gray, marginBottom: 8 }}>SEO Score</Text>
            <ProgressBar label="Nova plataforma"   pct={100} color={C.teal} />
            <ProgressBar label="WordPress tipico"  pct={65}  color={C.red} />
            <View style={{ marginTop: 10 }} />
            <Text style={{ ...bold, fontSize: 8, color: C.gray, marginBottom: 8 }}>Acessibilidade</Text>
            <ProgressBar label="Nova plataforma"   pct={95} color={C.teal} />
            <ProgressBar label="WordPress tipico"  pct={58} color={C.red} />
          </View>
        </View>
      </View>

      <SlideFooter page={3} total={TOTAL} />
    </Page>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SLIDE 4 — DESIGN
// ─────────────────────────────────────────────────────────────────────────────
function SlideDesign() {
  const pages = [
    "Home publica com apresentacao dos cursos",
    "Pagina de cada curso com video de preview",
    "Checkout com multiplos metodos de pagamento",
    "Dashboard do aluno com progresso das aulas",
    "Player de aulas com controle de progresso",
    "Certificados PDF automaticos com QR code",
    "Painel administrativo completo",
    "Pagina de verificacao de certificados",
  ];
  const cores = [
    [C.teal,      "#00475e", "Teal Principal — textos e headers"],
    [C.tealLight, "#00a3c4", "Teal Medio — icones e destaques"],
    [C.gold,      "#c49a28", "Dourado — acentos e divisores"],
    [C.offwhite,  "#f5f3ec", "Off-white — fundo principal"],
    [C.dark,      "#1a1a1a", "Escuro — corpo de texto"],
  ];

  return (
    <Page size="A4" orientation="landscape" style={{ backgroundColor: C.offwhite, padding: 0 }}>
      <SlideHeader cap="CAPITULO 3" title="Design 100% Personalizado" />

      <View style={{ flex: 1, padding: 24, flexDirection: "row", gap: 18 }}>
        <View style={{ flex: 1.2 }}>
          <Text style={{ ...reg, fontSize: 10, color: C.gray, lineHeight: 1.6, marginBottom: 16 }}>
            Todo o visual foi construido do zero, sem temas prontos ou templates genericos.
            Cada detalhe reflete a identidade da NU.V.E.M ENSINO.
          </Text>
          <BulletRow icon="I" title="Identidade visual exclusiva" desc="Tipografia, paleta, icones e espacamentos definidos na especificacao da marca e aplicados de forma consistente em todas as telas." color={C.teal} />
          <BulletRow icon="R" title="100% responsivo" desc="Layout adaptativo para desktop, tablet e celular. O aluno tem a mesma experiencia em qualquer dispositivo." color={C.tealMid} />
          <BulletRow icon="C" title="Certificados personalizados" desc="PDF gerado automaticamente com nome em fonte caligrafica, assinatura digital, QR code de verificacao e selo ISO 9001." color={C.gold} />
          <BulletRow icon="D" title="Tema refinado" desc="Fundo off-white, tipografia serifada elegante e detalhes dourados para transmitir credibilidade e sofisticacao." color={C.teal} />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={{ ...bold, fontSize: 10, color: C.teal, marginBottom: 12 }}>Paleta de Cores Oficial</Text>
          {cores.map(([bg, hex, desc]) => (
            <View key={hex} style={{ flexDirection: "row", alignItems: "center", marginBottom: 7 }}>
              <View style={{ width: 28, height: 16, backgroundColor: bg, borderRadius: 4, borderWidth: 0.5, borderColor: "#00000020", marginRight: 10 }} />
              <Text style={{ ...bold, fontSize: 8, color: C.dark, width: 58 }}>{hex}</Text>
              <Text style={{ ...reg, fontSize: 7.5, color: C.gray }}>{desc}</Text>
            </View>
          ))}

          <View style={{ marginTop: 16, backgroundColor: C.white, borderRadius: 8, padding: 14 }}>
            <Text style={{ ...bold, fontSize: 8.5, color: C.teal, marginBottom: 8 }}>Paginas Desenvolvidas</Text>
            {pages.map((item) => (
              <View key={item} style={{ flexDirection: "row", marginBottom: 4 }}>
                <Text style={{ ...bold, fontSize: 8, color: C.gold, marginRight: 5 }}>&gt;</Text>
                <Text style={{ ...reg, fontSize: 8, color: C.dark }}>{item}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      <SlideFooter page={4} total={TOTAL} />
    </Page>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SLIDE 5 — PAGAMENTOS
// ─────────────────────────────────────────────────────────────────────────────
function SlidePagamentos() {
  const mpItems = ["PIX — confirmacao instantanea", "Boleto bancario", "Cartao de credito nacional", "Parcelamento em ate 12x"];
  const stripeItems = ["Cartao de credito internacional", "Visa, Mastercard, Amex e outros", "Alunos de qualquer pais do mundo", "Conversao automatica de moeda", "Checkout seguro PCI-DSS nivel 1"];
  const asaasItems = [
    ["Sem PIX estavel em sandbox", "A API de testes nao simula o fluxo PIX de forma confiavel, impossibilitando validar antes da producao."],
    ["Sem suporte internacional", "Opera exclusivamente com CPF/CNPJ brasileiro — sem possibilidade de receber de alunos no exterior."],
    ["Custo por boleto + cobranca minima", "Modelo de pricing menos favoravel para volumes menores no inicio da operacao."],
  ];
  const fluxo = ["Aluno escolhe curso", "Seleciona metodo", "Pagamento processado", "Matricula ativada", "Acesso imediato"];

  return (
    <Page size="A4" orientation="landscape" style={{ backgroundColor: C.offwhite, padding: 0 }}>
      <SlideHeader cap="CAPITULO 4" title="Meios de Pagamento" bg={C.tealMid} />

      <View style={{ flex: 1, padding: 24, flexDirection: "column" }}>
        <View style={{ flexDirection: "row", gap: 12, marginBottom: 16 }}>
          {/* Mercado Pago */}
          <View style={{ flex: 1, backgroundColor: C.white, borderRadius: 10, padding: 16, borderTopWidth: 3, borderTopColor: C.mpBlue }}>
            <Text style={{ ...bold, fontSize: 11, color: C.mpBlue, marginBottom: 4 }}>Mercado Pago</Text>
            <Text style={{ ...bold, fontSize: 7.5, color: C.gray, marginBottom: 10, letterSpacing: 0.5 }}>MERCADO NACIONAL</Text>
            {mpItems.map(t => (
              <View key={t} style={{ flexDirection: "row", marginBottom: 5 }}>
                <Text style={{ ...bold, fontSize: 8, color: C.mpBlue, marginRight: 5 }}>v</Text>
                <Text style={{ ...reg, fontSize: 8, color: C.dark }}>{t}</Text>
              </View>
            ))}
            <InfoBox label="Pendente: Conta PJ" desc="Para ativar os recebimentos e necessario vincular uma conta empresarial no Mercado Pago. A integracao ja esta pronta para producao." bg={C.tealPale} color={C.teal} />
          </View>

          {/* Stripe */}
          <View style={{ flex: 1, backgroundColor: C.white, borderRadius: 10, padding: 16, borderTopWidth: 3, borderTopColor: C.purple }}>
            <Text style={{ ...bold, fontSize: 11, color: C.purple, marginBottom: 4 }}>Stripe</Text>
            <Text style={{ ...bold, fontSize: 7.5, color: C.gray, marginBottom: 10, letterSpacing: 0.5 }}>PAGAMENTOS INTERNACIONAIS</Text>
            {stripeItems.map(t => (
              <View key={t} style={{ flexDirection: "row", marginBottom: 5 }}>
                <Text style={{ ...bold, fontSize: 8, color: C.purple, marginRight: 5 }}>v</Text>
                <Text style={{ ...reg, fontSize: 8, color: C.dark }}>{t}</Text>
              </View>
            ))}
            <InfoBox label="Pendente: Ativar conta Stripe" desc="Criar conta Stripe no modo live e inserir as chaves de API de producao. O codigo de integracao ja esta 100% implementado." bg="#ede9fe" color={C.purple} />
          </View>

          {/* Asaas */}
          <View style={{ flex: 1, backgroundColor: C.white, borderRadius: 10, padding: 16, borderTopWidth: 3, borderTopColor: C.red }}>
            <Text style={{ ...bold, fontSize: 11, color: C.red, marginBottom: 4 }}>Por que saimos do Asaas?</Text>
            <Text style={{ ...bold, fontSize: 7.5, color: C.gray, marginBottom: 10, letterSpacing: 0.5 }}>MOTIVOS DA DECISAO</Text>
            {asaasItems.map(([t, d]) => (
              <View key={t} style={{ marginBottom: 8 }}>
                <View style={{ flexDirection: "row" }}>
                  <Text style={{ ...bold, fontSize: 8, color: C.red, marginRight: 5 }}>x</Text>
                  <Text style={{ ...bold, fontSize: 8, color: C.dark }}>{t}</Text>
                </View>
                <Text style={{ ...reg, fontSize: 7, color: C.gray, lineHeight: 1.4, marginTop: 1, marginLeft: 13 }}>{d}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Fluxo */}
        <View style={{ backgroundColor: C.teal + "12", borderRadius: 8, padding: 12, flexDirection: "row", alignItems: "center", flexWrap: "wrap" }}>
          <Text style={{ ...bold, fontSize: 8.5, color: C.teal, marginRight: 12 }}>Fluxo de pagamento:</Text>
          {fluxo.map((s, i) => (
            <View key={s} style={{ flexDirection: "row", alignItems: "center" }}>
              {i > 0 && <Text style={{ ...bold, fontSize: 10, color: C.gold, marginHorizontal: 6 }}>&gt;</Text>}
              <Text style={{ ...reg, fontSize: 8, color: C.dark }}>{s}</Text>
            </View>
          ))}
        </View>
      </View>

      <SlideFooter page={5} total={TOTAL} />
    </Page>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SLIDE 6 — SEO & IA
// ─────────────────────────────────────────────────────────────────────────────
function SlideSeo() {
  const ias = [
    ["ChatGPT / GPT-4",  "Indexa conteudo estruturado de sites com boa autoridade. Quanto mais rico e bem formatado o conteudo, maior a chance de citacao em respostas."],
    ["Perplexity AI",    "Crawler especializado em fontes confiaveis. Prioriza HTTPS, velocidade abaixo de 2s e conteudo tecnico de qualidade."],
    ["Google Gemini",    "Integrado ao Search. Sites com Core Web Vitals excelentes e Schema Markup recebem destaque nas respostas de IA."],
    ["Bing Copilot",     "Microsoft rastreia ativamente para alimentar o Copilot. Dominio verificado no Bing Webmaster Tools aumenta a visibilidade."],
  ];

  return (
    <Page size="A4" orientation="landscape" style={{ backgroundColor: C.offwhite, padding: 0 }}>
      <SlideHeader cap="CAPITULO 5" title="SEO & Visibilidade em IAs" />

      <View style={{ flex: 1, padding: 24, flexDirection: "row", gap: 18 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ ...bold, fontSize: 11, color: C.teal, marginBottom: 14 }}>SEO Tecnico Avancado</Text>
          <BulletRow icon="M" title="Meta tags dinamicas por curso" desc="Cada curso tem titulo, descricao e imagem Open Graph unicos, gerados automaticamente. Ideal para compartilhamentos em redes sociais." color={C.teal} />
          <BulletRow icon="S" title="Sitemap automatico" desc="Next.js gera sitemap.xml dinamicamente incluindo todas as paginas de cursos e instrutores. Mecanismos de busca sao notificados a cada novo conteudo." color={C.tealMid} />
          <BulletRow icon="P" title="Core Web Vitals perfeitos" desc="LCP, FID e CLS todos no verde. O Google prioriza sites com excelente experiencia do usuario nos resultados de busca." color={C.teal} />
          <BulletRow icon="H" title="HTTPS + dominio proprio" desc="nuvemensino.com.br com certificado SSL A+ renovado automaticamente pela Vercel. Sinal de confianca para motores de busca." color={C.gold} />
          <BulletRow icon="A" title="Analytics com PostHog" desc="Monitoramento de comportamento para otimizar paginas com menor conversao e identificar oportunidades de crescimento." color={C.tealMid} />
        </View>

        <View style={{ flex: 1, backgroundColor: C.white, borderRadius: 10, padding: 20 }}>
          <Text style={{ ...bold, fontSize: 11, color: C.teal, marginBottom: 8 }}>Indicacao por Inteligencias Artificiais</Text>
          <Text style={{ ...reg, fontSize: 8.5, color: C.gray, lineHeight: 1.6, marginBottom: 14 }}>
            Com a estrutura tecnica correta, a plataforma esta preparada para ser citada e recomendada por
            sistemas de IA generativa quando alguem pesquisa sobre cursos de motilidade digestiva,
            manometria ou fisioterapia respiratoria.
          </Text>
          {ias.map(([ia, desc]) => (
            <View key={ia} style={{ marginBottom: 10, paddingBottom: 10, borderBottomWidth: 0.5, borderBottomColor: C.grayLight }}>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 3 }}>
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: C.teal, marginRight: 7 }} />
                <Text style={{ ...bold, fontSize: 9, color: C.dark }}>{ia}</Text>
              </View>
              <Text style={{ ...reg, fontSize: 7.5, color: C.gray, lineHeight: 1.5, marginLeft: 13 }}>{desc}</Text>
            </View>
          ))}
          <View style={{ backgroundColor: C.goldLight, borderRadius: 6, padding: 8 }}>
            <Text style={{ ...bold, fontSize: 8, color: C.teal }}>
              A estrutura tecnica esta pronta. Quanto mais conteudo rico for adicionado (cursos, FAQs), maior sera a presenca nos resultados de IA.
            </Text>
          </View>
        </View>
      </View>

      <SlideFooter page={6} total={TOTAL} />
    </Page>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SLIDE 7 — STACK TECNOLOGICO
// ─────────────────────────────────────────────────────────────────────────────
function SlideStack() {
  const cols: [string, [string, string][]][] = [
    ["FRAMEWORK & FRONTEND", [
      ["Next.js 16.2",   "Framework React mais usado no mundo. SSR, SSG, API routes e streaming integrados nativamente."],
      ["React 19",       "Ultima versao com Server Components. Reduz drasticamente o JavaScript enviado ao navegador."],
      ["TypeScript",     "Tipagem estatica elimina erros em producao antes que acontecam."],
      ["Tailwind CSS",   "Estilizacao utilitaria com consistencia total. Zero CSS morto em producao."],
      ["Turbopack",      "Compilador em Rust da Vercel. Hot-reload abaixo de 100ms, builds ate 10x mais rapidos."],
    ]],
    ["BACKEND & BANCO DE DADOS", [
      ["Prisma ORM",      "Queries seguras e tipadas com migrations automaticas. Sincronizado com o banco em tempo real."],
      ["Neon PostgreSQL", "Banco serverless na AWS us-east-1. Escala de zero a milhares de conexoes sem configuracao."],
      ["NextAuth v5",     "Autenticacao com Google OAuth, e-mail+senha, recuperacao de senha e tokens seguros JWT."],
      ["API Routes",      "Endpoints de pagamento, webhook e geracao de PDF rodando no mesmo projeto, sem servidor separado."],
    ]],
    ["INFRAESTRUTURA & SERVICOS", [
      ["Vercel",          "Deploy com CI/CD automatico. Cada commit gera um preview. Producao em segundos."],
      ["MUX",             "Streaming profissional com adaptive bitrate, thumbnails automaticos e analytics de video."],
      ["Resend",          "E-mails transacionais via API moderna: confirmacao, recuperacao de senha, notificacoes."],
      ["Sentry",          "Monitoramento de erros em producao com alertas em tempo real."],
      ["PostHog",         "Analytics: funil de conversao, heatmaps e replay de sessao para otimizacao continua."],
    ]],
  ];

  return (
    <Page size="A4" orientation="landscape" style={{ backgroundColor: C.offwhite, padding: 0 }}>
      <SlideHeader cap="CAPITULO 6" title="Stack Tecnologico de Ponta" bg={C.tealMid} />

      <View style={{ flex: 1, padding: 22 }}>
        <Text style={{ ...reg, fontSize: 9, color: C.gray, marginBottom: 16, lineHeight: 1.6 }}>
          A plataforma utiliza o que ha de mais moderno no ecossistema de desenvolvimento web para LMS.
          Cada tecnologia foi escolhida por confiabilidade, escalabilidade e suporte de longo prazo.
        </Text>

        <View style={{ flexDirection: "row", gap: 12 }}>
          {cols.map(([title, items]) => (
            <View key={title} style={{ flex: 1, backgroundColor: C.white, borderRadius: 10, padding: 14 }}>
              <Text style={{ ...bold, fontSize: 8, color: C.teal, marginBottom: 12, letterSpacing: 0.5 }}>{title}</Text>
              {items.map(([t, d]) => (
                <View key={t} style={{ marginBottom: 10 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 2 }}>
                    <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: C.gold, marginRight: 6 }} />
                    <Text style={{ ...bold, fontSize: 8.5, color: C.dark }}>{t}</Text>
                  </View>
                  <Text style={{ ...reg, fontSize: 7.5, color: C.gray, lineHeight: 1.4, marginLeft: 11 }}>{d}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>
      </View>

      <SlideFooter page={7} total={TOTAL} />
    </Page>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SLIDE 8 — DASHBOARD DO ALUNO
// ─────────────────────────────────────────────────────────────────────────────
function SlideDashboard() {
  const cursos = [
    ["Manometria, pHmetria e Impedancia", "72", C.teal],
    ["Testes Respiratorios Avancados",    "100", C.green],
    ["Cavidade Oral e Degluticao",        "28", C.gold],
  ];
  const menus = ["Meus Cursos", "Certificados", "Ao Vivo", "Perfil"];

  return (
    <Page size="A4" orientation="landscape" style={{ backgroundColor: C.offwhite, padding: 0 }}>
      <SlideHeader cap="PAGINA EXCLUSIVA" title="Dashboard do Aluno — /dashboard" />

      <View style={{ flex: 1, padding: 22, flexDirection: "row", gap: 16 }}>
        {/* Mockup */}
        <View style={{ flex: 1.3, backgroundColor: C.white, borderRadius: 10, overflow: "hidden", borderWidth: 1, borderColor: C.grayLight }}>
          <View style={{ backgroundColor: C.offwhite, borderBottomWidth: 1, borderBottomColor: C.grayLight, padding: 10, flexDirection: "row", alignItems: "center" }}>
            <View style={{ width: 55, height: 16, backgroundColor: C.teal + "30", borderRadius: 3, marginRight: 8 }} />
            <View style={{ flex: 1 }} />
            {menus.map((m, i) => (
              <View key={m} style={{ marginLeft: 12, paddingBottom: 2, borderBottomWidth: 1.5, borderBottomColor: i === 0 ? C.teal : "transparent" }}>
                <Text style={{ ...reg, fontSize: 7, color: i === 0 ? C.teal : C.gray }}>{m}</Text>
              </View>
            ))}
          </View>
          <View style={{ padding: 14 }}>
            <Text style={{ ...bold, fontSize: 11, color: C.dark, marginBottom: 14 }}>Ola, Ana Paula</Text>
            {cursos.map(([title, pct, color]) => (
              <View key={title} style={{ backgroundColor: C.offwhite, borderRadius: 6, padding: 10, marginBottom: 8, flexDirection: "row", alignItems: "center" }}>
                <View style={{ width: 34, height: 34, backgroundColor: (color as string) + "22", borderRadius: 6, marginRight: 10 }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ ...bold, fontSize: 7.5, color: C.dark, marginBottom: 4 }}>{title}</Text>
                  <View style={{ height: 4, backgroundColor: C.grayLight, borderRadius: 2 }}>
                    <View style={{ height: 4, width: pct + "%", backgroundColor: color as string, borderRadius: 2 }} />
                  </View>
                  <Text style={{ ...reg, fontSize: 6.5, color: C.gray, marginTop: 2 }}>{pct}% concluido</Text>
                </View>
              </View>
            ))}
            <View style={{ marginTop: 4, backgroundColor: C.goldLight, borderRadius: 6, padding: 8, flexDirection: "row", alignItems: "center" }}>
              <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: C.gold, alignItems: "center", justifyContent: "center", marginRight: 8 }}>
                <Text style={{ ...bold, fontSize: 9, color: C.white }}>C</Text>
              </View>
              <View>
                <Text style={{ ...bold, fontSize: 7.5, color: C.teal }}>1 Certificado disponivel</Text>
                <Text style={{ ...reg, fontSize: 7, color: C.gray }}>Testes Respiratorios — Baixar PDF</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Descricao */}
        <View style={{ flex: 1 }}>
          <Text style={{ ...bold, fontSize: 11, color: C.teal, marginBottom: 14 }}>Funcionalidades do Dashboard</Text>
          <BulletRow icon="C" title="Cursos com progresso visual" desc="O aluno ve todos os cursos matriculados com barra de progresso em tempo real. A plataforma rastreia cada aula assistida automaticamente." color={C.teal} />
          <BulletRow icon="V" title="Player de aulas integrado" desc="Videos em streaming com MUX, controle de posicao, velocidade e avanco automatico para a proxima aula ao concluir." color={C.tealMid} />
          <BulletRow icon="P" title="Certificados em PDF" desc="Emitidos automaticamente ao concluir 100% do curso. PDF personalizado com assinatura, QR code e codigo de verificacao unico." color={C.gold} />
          <BulletRow icon="A" title="Aulas ao vivo" desc="Integrado com sessoes ao vivo agendadas pelo admin. O aluno acessa o link diretamente pela plataforma." color={C.teal} />
          <BulletRow icon="U" title="Perfil editavel" desc="Nome e dados pessoais atualizaveis. Autenticacao via Google ou e-mail+senha com recuperacao automatica." color={C.tealMid} />
          <InfoBox label="Acesso protegido" desc="O dashboard so e acessivel por alunos autenticados. Tentativa de acesso sem login redireciona automaticamente para /entrar." bg={C.teal + "10"} color={C.teal} />
        </View>
      </View>

      <SlideFooter page={8} total={TOTAL} />
    </Page>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SLIDE 9 — PAINEL ADMIN
// ─────────────────────────────────────────────────────────────────────────────
function SlideAdmin() {
  const sideMenu = ["Visao Geral", "Cursos", "Matriculas", "Usuarios", "Relatorios", "Aulas ao Vivo"];
  const kpis = [
    ["Receita/mes", "R$ 12.450", C.teal],
    ["Matriculas",  "38 ativas", C.gold],
    ["Alunos 30d",  "+7 novos",  C.teal],
    ["Conversao",   "84%",       C.green],
  ];

  return (
    <Page size="A4" orientation="landscape" style={{ backgroundColor: C.offwhite, padding: 0 }}>
      <SlideHeader cap="PAGINA EXCLUSIVA" title="Painel Administrativo — /admin" bg={C.tealMid} />

      <View style={{ flex: 1, padding: 22, flexDirection: "row", gap: 16 }}>
        {/* Mockup */}
        <View style={{ flex: 1.3, backgroundColor: C.white, borderRadius: 10, overflow: "hidden", borderWidth: 1, borderColor: C.grayLight, flexDirection: "row" }}>
          {/* Sidebar */}
          <View style={{ width: 88, backgroundColor: C.teal, padding: 10 }}>
            <View style={{ height: 20, backgroundColor: C.white + "30", borderRadius: 3, marginBottom: 16 }} />
            {sideMenu.map((m, i) => (
              <View key={m} style={{ paddingVertical: 5, paddingHorizontal: 5, borderRadius: 4, marginBottom: 2, backgroundColor: i === 0 ? C.white + "22" : "transparent" }}>
                <Text style={{ ...reg, fontSize: 6.5, color: i === 0 ? C.white : C.white + "88" }}>{m}</Text>
              </View>
            ))}
          </View>
          {/* Conteudo */}
          <View style={{ flex: 1, padding: 12 }}>
            <Text style={{ ...bold, fontSize: 9, color: C.dark, marginBottom: 10 }}>Visao Geral — maio 2026</Text>
            <View style={{ flexDirection: "row", gap: 5, marginBottom: 10 }}>
              {kpis.map(([l, v, c]) => (
                <View key={l} style={{ flex: 1, backgroundColor: C.offwhite, borderRadius: 4, padding: 6, borderLeftWidth: 2, borderLeftColor: c as string }}>
                  <Text style={{ ...reg, fontSize: 5.5, color: C.gray }}>{l}</Text>
                  <Text style={{ ...bold, fontSize: 8.5, color: C.dark }}>{v}</Text>
                </View>
              ))}
            </View>
            {/* Grafico barras mockup */}
            <View style={{ backgroundColor: C.offwhite, borderRadius: 4, padding: 8, marginBottom: 8 }}>
              <Text style={{ ...bold, fontSize: 5.5, color: C.gray, marginBottom: 5, letterSpacing: 0.5 }}>RECEITA POR MES</Text>
              <View style={{ flexDirection: "row", alignItems: "flex-end", height: 36, gap: 4 }}>
                {[30, 45, 60, 55, 80, 100].map((h, i) => (
                  <View key={i} style={{ flex: 1, backgroundColor: C.teal + "66", borderRadius: 2, height: `${h}%` }} />
                ))}
              </View>
              <View style={{ flexDirection: "row", gap: 4, marginTop: 3 }}>
                {["dez", "jan", "fev", "mar", "abr", "mai"].map(m => (
                  <Text key={m} style={{ flex: 1, ...reg, fontSize: 5, color: C.gray, textAlign: "center" }}>{m}</Text>
                ))}
              </View>
            </View>
            {/* Tabela pagamentos */}
            <Text style={{ ...bold, fontSize: 5.5, color: C.gray, marginBottom: 4, letterSpacing: 0.5 }}>ULTIMOS PAGAMENTOS</Text>
            {["Ana P.   Manometria      R$150   PIX", "Carlos S.  Testes Resp.    R$200   Stripe"].map(r => (
              <View key={r} style={{ paddingVertical: 3, borderBottomWidth: 0.5, borderBottomColor: C.grayLight }}>
                <Text style={{ ...reg, fontSize: 6, color: C.dark }}>{r}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Descricao */}
        <View style={{ flex: 1 }}>
          <Text style={{ ...bold, fontSize: 11, color: C.teal, marginBottom: 14 }}>Recursos do Painel Admin</Text>
          <BulletRow icon="D" title="Dashboard financeiro em tempo real" desc="KPIs de receita mensal, matriculas ativas, novos alunos e taxa de conversao. Grafico dos ultimos 6 meses com comparativo de crescimento." color={C.teal} />
          <BulletRow icon="G" title="Gestao completa de cursos" desc="Criar, editar, publicar/despublicar cursos. Upload de videos via MUX com processamento automatico em multiplas resolucoes." color={C.gold} />
          <BulletRow icon="U" title="Gestao de usuarios" desc="Lista completa de alunos com filtros por status. Visualizacao de matriculas e pagamentos por usuario." color={C.tealMid} />
          <BulletRow icon="P" title="Controle de pagamentos" desc="Status de cada matricula (ativa, concluida, cancelada). Historico com metodo, valor e data de cada pagamento." color={C.teal} />
          <BulletRow icon="L" title="Aulas ao vivo" desc="Agendar e gerenciar sessoes ao vivo com link de acesso para os alunos matriculados." color={C.tealMid} />
          <InfoBox label="Acesso restrito" desc="O painel admin so esta disponivel para usuarios com role ADMIN. Qualquer outro acesso e bloqueado automaticamente com redirecionamento." bg={C.teal + "10"} color={C.teal} />
        </View>
      </View>

      <SlideFooter page={9} total={TOTAL} />
    </Page>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SLIDE 10 — PROXIMOS PASSOS & CONCLUSAO
// ─────────────────────────────────────────────────────────────────────────────
function SlideProximos({ logoUri }: { logoUri?: string }) {
  const passos = [
    { n: "1", title: "Conta PJ no Mercado Pago",                 color: C.mpBlue,  desc: "Criar/vincular conta empresarial (CNPJ) no Mercado Pago e inserir as chaves de producao. A integracao PIX + Boleto + Cartao Nacional ja esta 100% implementada." },
    { n: "2", title: "Ativar conta Stripe (pagamentos internacionais)", color: C.purple, desc: "Criar conta Stripe no modo live, verificar o negocio e substituir as chaves de teste pelas de producao. Alunos do mundo todo poderao pagar com cartao internacional." },
    { n: "3", title: "MUX Webhook em producao",                  color: C.teal,    desc: "Configurar o webhook de video do MUX para o dominio de producao, garantindo atualizacao automatica do status dos videos apos o processamento." },
    { n: "4", title: "Verificar dominio no Google Search Console", color: C.gold,   desc: "Adicionar nuvemensino.com.br no Search Console e submeter o sitemap para indexacao imediata. Aumenta a velocidade de aparicao nos resultados de busca." },
    { n: "5", title: "Sentry e PostHog em producao",             color: C.green,   desc: "Ativar o monitoramento de erros e analytics com as chaves de producao para visibilidade completa do comportamento real dos usuarios." },
  ];
  const entregues = [
    "Plataforma completa em Next.js 16 + React 19",
    "Design 100% personalizado para a marca",
    "Autenticacao segura (Google + e-mail)",
    "Cursos com video em streaming (MUX)",
    "Pagamentos nacionais e internacionais",
    "Certificados PDF com QR code",
    "Dashboard do aluno e painel admin",
    "SEO avancado e estrutura para IA",
    "E-mails transacionais (Resend)",
    "Monitoramento (Sentry + PostHog)",
  ];

  return (
    <Page size="A4" orientation="landscape" style={{ backgroundColor: C.offwhite, padding: 0 }}>
      <SlideHeader cap="CAPITULO 7" title="Proximos Passos & Conclusao" />

      <View style={{ flex: 1, padding: 22, flexDirection: "row", gap: 18 }}>
        {/* Proximos passos */}
        <View style={{ flex: 1.4 }}>
          <Text style={{ ...bold, fontSize: 11, color: C.teal, marginBottom: 14 }}>O que falta para o go-live?</Text>
          {passos.map(({ n, title, color, desc }) => (
            <View key={n} style={{ flexDirection: "row", marginBottom: 10 }}>
              <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: color, alignItems: "center", justifyContent: "center", marginRight: 10, flexShrink: 0 }}>
                <Text style={{ ...bold, fontSize: 8, color: C.white }}>{n}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ ...bold, fontSize: 8.5, color: C.dark, marginBottom: 2 }}>{title}</Text>
                <Text style={{ ...reg, fontSize: 7.5, color: C.gray, lineHeight: 1.5 }}>{desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Conclusao */}
        <View style={{ flex: 1, flexDirection: "column" }}>
          <View style={{ backgroundColor: C.teal, borderRadius: 12, padding: 18, marginBottom: 14 }}>
            <Text style={{ fontFamily: "GreatVibes", fontSize: 28, color: C.goldLight, marginBottom: 8 }}>Conclusao</Text>
            <Text style={{ ...reg, fontSize: 8.5, color: C.white + "dd", lineHeight: 1.7 }}>
              A NU.V.E.M ENSINO agora possui uma plataforma LMS proprietaria de alto nivel, construida com
              as mesmas tecnologias utilizadas pelas maiores edtechs do mundo.
            </Text>
            <View style={{ height: 1, backgroundColor: C.gold + "66", marginVertical: 10 }} />
            <Text style={{ ...reg, fontSize: 8.5, color: C.white + "dd", lineHeight: 1.7 }}>
              A migracao do WordPress eliminou as limitacoes tecnicas, abriu o mercado internacional via
              Stripe e posicionou a marca para crescimento acelerado com SEO de primeira linha e
              visibilidade crescente em ferramentas de IA.
            </Text>
          </View>

          <View style={{ backgroundColor: C.white, borderRadius: 10, padding: 14, flex: 1 }}>
            <Text style={{ ...bold, fontSize: 9, color: C.teal, marginBottom: 8 }}>Resumo do que foi entregue</Text>
            {entregues.map((item) => (
              <View key={item} style={{ flexDirection: "row", marginBottom: 4 }}>
                <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: C.teal, alignItems: "center", justifyContent: "center", marginRight: 7, marginTop: 1 }}>
                  <Text style={{ ...bold, fontSize: 7, color: C.white }}>v</Text>
                </View>
                <Text style={{ ...reg, fontSize: 8, color: C.dark }}>{item}</Text>
              </View>
            ))}
          </View>

          {logoUri && (
            <View style={{ alignItems: "center", marginTop: 10 }}>
              <Image src={logoUri} style={{ width: 90, height: 34, objectFit: "contain" }} />
            </View>
          )}
        </View>
      </View>

      <SlideFooter page={10} total={TOTAL} />
    </Page>
  );
}

// ── DOCUMENTO ───────────────────────────────────────────────────────────────
export function PresentationPDF({ logoUri, isoSeal }: Props) {
  return (
    <Document
      title="Relatorio de Desenvolvimento — NU.V.E.M ENSINO"
      author="NU.V.E.M ENSINO"
      subject="Apresentacao da Nova Plataforma LMS"
    >
      <SlideCover logoUri={logoUri} />
      <SlideMigracao />
      <SlideVelocidade />
      <SlideDesign />
      <SlidePagamentos />
      <SlideSeo />
      <SlideStack />
      <SlideDashboard />
      <SlideAdmin />
      <SlideProximos logoUri={logoUri} />
    </Document>
  );
}
