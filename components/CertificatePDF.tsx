"use client";

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  Svg,
  Path,
  Circle,
  Rect,
  Line,
} from "@react-pdf/renderer";

// Fontes built-in do PDF — registradas para uso com variantes
Font.register({
  family: "Times",
  fonts: [
    { src: "Times-Roman" },
    { src: "Times-Bold",   fontWeight: "bold" },
    { src: "Times-Italic", fontStyle: "italic" },
  ],
});
Font.register({
  family: "Helvetica",
  fonts: [
    { src: "Helvetica" },
    { src: "Helvetica-Bold", fontWeight: "bold" },
  ],
});

// ── Paleta ─────────────────────────────────────────────────────────────────
const C = {
  teal:      "#00475e",
  tealMid:   "#006580",
  tealLight: "#00a3c4",
  gold:      "#c49a28",
  goldLight: "#f0d060",
  white:     "#ffffff",
  offwhite:  "#f5f3ec",
  gray:      "#6b7280",
  grayLight: "#e2e0d8",
  dark:      "#111827",
};

// ── Estilos ─────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  page: {
    backgroundColor: C.offwhite,
    fontFamily: "Helvetica",
    padding: 0,
    flexDirection: "column",
    position: "relative",
  },

  // Moldura decorativa (borda interna)
  innerBorder: {
    position: "absolute",
    top: 18,
    left: 18,
    right: 18,
    bottom: 18,
    borderWidth: 0.75,
    borderColor: C.gold,
    borderStyle: "solid",
  },

  // Cantos decorativos — quadradinhos dourados
  cornerTL: { position: "absolute", top: 14, left: 14, width: 10, height: 10, borderTopWidth: 2, borderLeftWidth: 2, borderColor: C.gold },
  cornerTR: { position: "absolute", top: 14, right: 14, width: 10, height: 10, borderTopWidth: 2, borderRightWidth: 2, borderColor: C.gold },
  cornerBL: { position: "absolute", bottom: 14, left: 14, width: 10, height: 10, borderBottomWidth: 2, borderLeftWidth: 2, borderColor: C.gold },
  cornerBR: { position: "absolute", bottom: 14, right: 14, width: 10, height: 10, borderBottomWidth: 2, borderRightWidth: 2, borderColor: C.gold },

  // Barra superior
  topBar: { backgroundColor: C.teal, height: 10, width: "100%" },
  bottomBar: { backgroundColor: C.gold, height: 6, width: "100%", position: "absolute", bottom: 0, left: 0 },

  // ISO Seal — canto superior direito
  isoSeal: {
    position: "absolute",
    top: 28,
    right: 36,
    alignItems: "center",
    justifyContent: "center",
    width: 64,
    height: 64,
  },
  isoText: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },

  // Corpo central
  body: {
    flex: 1,
    paddingHorizontal: 70,
    paddingTop: 28,
    paddingBottom: 32,
    flexDirection: "column",
    alignItems: "center",
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginBottom: 4,
  },
  brandName: {
    fontFamily: "Helvetica",
    fontWeight: "bold",
    fontSize: 13,
    color: C.teal,
    letterSpacing: 2.5,
  },
  brandSub: {
    fontFamily: "Helvetica",
    fontSize: 7.5,
    color: C.tealLight,
    letterSpacing: 1.5,
    marginBottom: 14,
    textAlign: "center",
  },

  dividerGold: {
    width: 90,
    height: 1.5,
    backgroundColor: C.gold,
    marginVertical: 10,
  },
  dividerThin: {
    width: "100%",
    height: 0.5,
    backgroundColor: C.grayLight,
    marginVertical: 12,
  },

  certTitle: {
    fontFamily: "Times",
    fontSize: 36,
    color: C.teal,
    letterSpacing: 5,
    textAlign: "center",
    marginBottom: 2,
  },
  certSubtitle: {
    fontFamily: "Helvetica",
    fontSize: 9,
    color: C.gray,
    textAlign: "center",
    letterSpacing: 2,
    marginBottom: 20,
  },
  presentsLabel: {
    fontFamily: "Helvetica",
    fontSize: 10,
    color: C.gray,
    textAlign: "center",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  studentName: {
    fontFamily: "Times",
    fontStyle: "italic",
    fontSize: 36,
    color: C.dark,
    textAlign: "center",
    marginBottom: 14,
  },
  bodyText: {
    fontFamily: "Helvetica",
    fontSize: 10.5,
    color: C.gray,
    textAlign: "center",
    lineHeight: 1.5,
    marginBottom: 4,
  },
  courseTitle: {
    fontFamily: "Times",
    fontWeight: "bold",
    fontSize: 20,
    color: C.teal,
    textAlign: "center",
    marginBottom: 6,
    maxWidth: 440,
  },
  hoursText: {
    fontFamily: "Helvetica",
    fontSize: 9.5,
    color: C.gray,
    textAlign: "center",
    marginBottom: 16,
  },

  // Assinaturas
  signaturesRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginTop: 4,
    marginBottom: 16,
  },
  sigBlock: { alignItems: "center", width: 170 },
  sigLine:  { width: 130, height: 0.75, backgroundColor: C.dark, marginBottom: 5 },
  sigName:  { fontFamily: "Helvetica", fontWeight: "bold", fontSize: 9, color: C.dark, textAlign: "center", marginBottom: 2 },
  sigRole:  { fontFamily: "Helvetica", fontSize: 7.5, color: C.gray, textAlign: "center" },

  // Rodapé
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    width: "100%",
    marginTop: "auto",
  },
  footerText: { fontFamily: "Helvetica", fontSize: 6.5, color: C.gray },
  codeBox: { backgroundColor: C.teal, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 3 },
  codeText: { fontFamily: "Helvetica", fontWeight: "bold", fontSize: 6.5, color: C.white, letterSpacing: 1 },
});

// ── Logo real da NU.V.E.M (path do icone-nuvem.svg) ────────────────────────
function BrandLogo() {
  return (
    <Svg width={46} height={33} viewBox="0 0 488.69 349.04">
      <Path
        d="M429.63,238.95h-149.91v-25.02h12.34c1.82,0,3.51-.95,4.46-2.52.93-1.57.98-3.53.12-5.14l-35.62-66.65c-.9-1.69-2.67-2.76-4.6-2.76s-3.68,1.07-4.58,2.76l-35.62,66.65c-.86,1.61-.81,3.57.12,5.14.93,1.57,2.64,2.52,4.46,2.52h12.33v66.92c0,1.37.54,2.7,1.52,3.68.98.98,2.31,1.52,3.68,1.52h6.36l-21.06,39.4-21.04-39.4h6.36c2.88,0,5.22-2.34,5.22-5.2v-36.69c0-2.88-2.34-5.21-5.22-5.21h-118.36c-33.93,0-58.93-13.11-70.4-36.93-10.23-21.22-8.14-48.38,5.32-69.15,12.06-18.63,31-28.88,53.37-28.88h.02c3.57,0,7.25.27,10.94.8l1.31.18c2.44.35,4.78-1.06,5.62-3.36l.48-1.31c9.62-26,30.96-43.5,55.74-45.67,18.31-1.6,36.28,5.53,49.78,19.58l1.69,1.76c1.21,1.24,2.95,1.81,4.66,1.51,1.7-.3,3.15-1.43,3.86-3.03l1.01-2.28c16.11-36.38,46.2-58.09,80.53-58.09,7.23,0,14.6.96,21.92,2.86,37.82,9.81,75.34,46.01,73.94,104.72l-.05,2.14c-.03,1.52.6,3,1.75,4.01,1.13,1.02,2.65,1.49,4.17,1.28l1.96-.27c4.84-.68,9.6-1.01,14.14-1.01,23.62,0,41.9,9,52.89,26.04,11.29,17.5,12.86,41.67,3.92,60.17-7.76,16.07-21.81,24.91-39.55,24.91M476.79,146.12c-7.81-12.1-26.53-32.4-64.19-32.4-2.74,0-5.56.11-8.43.33-.87-26.33-9.21-50.54-24.25-70.33-15.18-19.94-36.51-34.29-60.06-40.41-8.46-2.22-17-3.32-25.4-3.32-36.9,0-69.69,21.46-88.88,57.8-15.37-12.66-34.35-18.89-53.76-17.18-28.34,2.49-53.08,21.37-65.41,49.62-30.34-2.55-56.35,10.11-72.39,34.88-16.11,24.87-18.55,57.5-6.19,83.12,13.91,28.89,43.32,44.79,82.79,44.79h109.77v18.95h-12.34c-1.82,0-3.51.96-4.46,2.53-.93,1.57-.98,3.51-.12,5.12l35.62,66.65c.91,1.7,2.67,2.76,4.58,2.76s3.69-1.06,4.6-2.76l35.63-66.65c.86-1.61.8-3.56-.14-5.12-.95-1.57-2.64-2.53-4.46-2.53h-12.34v-66.91c.01-1.39-.53-2.71-1.51-3.68-.98-.98-2.29-1.52-3.68-1.52h-6.36l21.04-39.41,21.06,39.41h-6.36c-2.88,0-5.22,2.32-5.22,5.2v42.76c0,2.88,2.34,5.2,5.22,5.2h158.5c22.94,0,41.87-11.94,51.94-32.77,11.03-22.82,9.1-52.62-4.78-74.14"
        fill={C.teal}
      />
    </Svg>
  );
}

// ── Selo ISO 9001 ───────────────────────────────────────────────────────────
function Iso9001Seal() {
  return (
    <View style={s.isoSeal}>
      {/* Círculos SVG do selo */}
      <Svg width={64} height={64} viewBox="0 0 64 64">
        {/* Fundo teal */}
        <Circle cx={32} cy={32} r={30} fill={C.teal} />
        {/* Anel dourado externo */}
        <Circle cx={32} cy={32} r={30} fill="none" stroke={C.gold} strokeWidth={2} />
        {/* Anel dourado interno */}
        <Circle cx={32} cy={32} r={24} fill="none" stroke={C.gold} strokeWidth={0.75} />
        {/* Linha horizontal decorativa */}
        <Line x1={16} y1={36} x2={48} y2={36} stroke={C.goldLight} strokeWidth={0.5} />
        {/* Triângulo / chevron superior */}
        <Path d="M32 10 L36 18 L28 18 Z" fill={C.gold} />
      </Svg>

      {/* Texto sobreposto com posição absoluta */}
      <View style={s.isoText}>
        <Text style={{ fontFamily: "Helvetica", fontSize: 6, color: C.goldLight, letterSpacing: 1, textAlign: "center", marginBottom: 1 }}>
          QUALIDADE
        </Text>
        <Text style={{ fontFamily: "Helvetica", fontWeight: "bold", fontSize: 8.5, color: C.white, letterSpacing: 0.5, textAlign: "center" }}>
          ISO 9001
        </Text>
        <Text style={{ fontFamily: "Helvetica", fontSize: 5.5, color: C.goldLight, letterSpacing: 0.5, textAlign: "center", marginTop: 1 }}>
          CERTIFICADO
        </Text>
      </View>
    </View>
  );
}

// ── Props ───────────────────────────────────────────────────────────────────
type Props = {
  studentName: string;
  courseTitle: string;
  hours: number;
  instructorName: string;
  issueDate: Date;
  code: string;
};

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

// ── Componente principal ───────────────────────────────────────────────────
export function CertificatePDF({ studentName, courseTitle, hours, instructorName, issueDate, code }: Props) {
  return (
    <Document title={`Certificado — ${courseTitle}`} author="NU.V.E.M Ensino" subject="Certificado de Conclusão">
      <Page size="A4" orientation="landscape" style={s.page}>

        {/* Barra superior teal */}
        <View style={s.topBar} />

        {/* Moldura interna dourada */}
        <View style={s.innerBorder} />

        {/* Cantos decorativos */}
        <View style={s.cornerTL} />
        <View style={s.cornerTR} />
        <View style={s.cornerBL} />
        <View style={s.cornerBR} />

        {/* Selo ISO 9001 */}
        <Iso9001Seal />

        {/* Corpo */}
        <View style={s.body}>

          {/* Logo + Nome */}
          <View style={s.headerRow}>
            <BrandLogo />
            <Text style={s.brandName}>NU.V.E.M ENSINO</Text>
          </View>
          <Text style={s.brandSub}>MEDICINA · EDUCAÇÃO · EXCELÊNCIA</Text>

          <View style={s.dividerGold} />

          <Text style={s.certTitle}>CERTIFICADO</Text>
          <Text style={s.certSubtitle}>DE CONCLUSÃO DE CURSO</Text>

          <Text style={s.presentsLabel}>Certificamos que</Text>

          <Text style={s.studentName}>{studentName}</Text>

          <Text style={s.bodyText}>concluiu com êxito o curso</Text>

          <Text style={s.courseTitle}>{courseTitle}</Text>

          <Text style={s.hoursText}>
            com carga horária de {hours} hora{hours !== 1 ? "s" : ""} · Belo Horizonte, {formatDate(issueDate)}
          </Text>

          <View style={s.dividerThin} />

          {/* Assinaturas */}
          <View style={s.signaturesRow}>
            <View style={s.sigBlock}>
              <View style={s.sigLine} />
              <Text style={s.sigName}>{instructorName}</Text>
              <Text style={s.sigRole}>Instrutor Responsável</Text>
            </View>
            <View style={s.sigBlock}>
              <View style={s.sigLine} />
              <Text style={s.sigName}>NU.V.E.M Ensino</Text>
              <Text style={s.sigRole}>Diretoria Acadêmica</Text>
            </View>
          </View>

          {/* Rodapé */}
          <View style={s.footer}>
            <Text style={s.footerText}>
              Verifique a autenticidade em nuvemensino.com.br/verificar
            </Text>
            <View style={s.codeBox}>
              <Text style={s.codeText}>#{code.slice(0, 16).toUpperCase()}</Text>
            </View>
          </View>
        </View>

        {/* Barra inferior dourada */}
        <View style={s.bottomBar} />
      </Page>
    </Document>
  );
}
