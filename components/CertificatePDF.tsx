import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  Svg,
  Path,
  Rect,
  Line,
} from "@react-pdf/renderer";

// Registra fontes do sistema (fallback seguro sem necessidade de fetch externo)
Font.register({
  family: "Times",
  fonts: [
    { src: "Times-Roman" },
    { src: "Times-Bold", fontWeight: "bold" },
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

// Paleta de cores da NU.V.E.M Ensino
const C = {
  teal:       "#00475e",
  tealLight:  "#00a3c4",
  tealMid:    "#006580",
  gold:       "#c49a28",
  goldLight:  "#f0d060",
  white:      "#ffffff",
  offwhite:   "#f8f6f0",
  gray:       "#6b7280",
  grayLight:  "#e5e7eb",
  dark:       "#111827",
};

const styles = StyleSheet.create({
  page: {
    backgroundColor: C.offwhite,
    fontFamily: "Helvetica",
    padding: 0,
    flexDirection: "column",
  },
  // Borda superior teal
  topBar: {
    backgroundColor: C.teal,
    height: 10,
    width: "100%",
  },
  // Borda inferior gold
  bottomBar: {
    backgroundColor: C.gold,
    height: 6,
    width: "100%",
    position: "absolute",
    bottom: 0,
    left: 0,
  },
  body: {
    flex: 1,
    paddingHorizontal: 60,
    paddingTop: 40,
    paddingBottom: 40,
    flexDirection: "column",
    alignItems: "center",
  },
  // Cabeçalho
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginBottom: 6,
  },
  brandName: {
    fontFamily: "Helvetica",
    fontWeight: "bold",
    fontSize: 13,
    color: C.teal,
    letterSpacing: 2,
  },
  brandSub: {
    fontFamily: "Helvetica",
    fontSize: 8,
    color: C.tealLight,
    letterSpacing: 1,
    marginBottom: 20,
    textAlign: "center",
  },
  dividerGold: {
    width: 80,
    height: 1.5,
    backgroundColor: C.gold,
    marginVertical: 12,
  },
  dividerThin: {
    width: "100%",
    height: 0.5,
    backgroundColor: C.grayLight,
    marginVertical: 14,
  },
  // Títulos
  certTitle: {
    fontFamily: "Times",
    fontSize: 32,
    color: C.teal,
    letterSpacing: 3,
    textAlign: "center",
    marginBottom: 4,
  },
  certSubtitle: {
    fontFamily: "Helvetica",
    fontSize: 10,
    color: C.gray,
    textAlign: "center",
    letterSpacing: 1,
    marginBottom: 24,
  },
  presentsLabel: {
    fontFamily: "Helvetica",
    fontSize: 10,
    color: C.gray,
    textAlign: "center",
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  studentName: {
    fontFamily: "Times",
    fontStyle: "italic",
    fontSize: 34,
    color: C.dark,
    textAlign: "center",
    marginBottom: 16,
  },
  bodyText: {
    fontFamily: "Helvetica",
    fontSize: 11,
    color: C.gray,
    textAlign: "center",
    lineHeight: 1.6,
    maxWidth: 420,
    marginBottom: 6,
  },
  courseTitle: {
    fontFamily: "Times",
    fontWeight: "bold",
    fontSize: 18,
    color: C.teal,
    textAlign: "center",
    marginBottom: 6,
    maxWidth: 420,
  },
  hoursText: {
    fontFamily: "Helvetica",
    fontSize: 10,
    color: C.gray,
    textAlign: "center",
    marginBottom: 24,
  },
  // Assinaturas
  signaturesRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginTop: 8,
    marginBottom: 20,
  },
  sigBlock: {
    alignItems: "center",
    width: 160,
  },
  sigLine: {
    width: 120,
    height: 0.75,
    backgroundColor: C.dark,
    marginBottom: 5,
  },
  sigName: {
    fontFamily: "Helvetica",
    fontWeight: "bold",
    fontSize: 9,
    color: C.dark,
    textAlign: "center",
    marginBottom: 2,
  },
  sigRole: {
    fontFamily: "Helvetica",
    fontSize: 8,
    color: C.gray,
    textAlign: "center",
  },
  // Rodapé
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    width: "100%",
    marginTop: "auto",
  },
  footerText: {
    fontFamily: "Helvetica",
    fontSize: 7,
    color: C.gray,
  },
  codeBox: {
    backgroundColor: C.teal,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 3,
  },
  codeText: {
    fontFamily: "Helvetica",
    fontWeight: "bold",
    fontSize: 7,
    color: C.white,
    letterSpacing: 1,
  },
});

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

// Ícone de nuvem simples em SVG
function CloudIcon() {
  return (
    <Svg width={32} height={22} viewBox="0 0 32 22">
      <Path
        d="M26 22H6a6 6 0 010-12c.34 0 .67.03 1 .08A8 8 0 0123 6a8 8 0 018 8 6 6 0 01-5 5.92V22z"
        fill={C.tealLight}
        opacity={0.6}
      />
    </Svg>
  );
}

export function CertificatePDF({
  studentName,
  courseTitle,
  hours,
  instructorName,
  issueDate,
  code,
}: Props) {
  return (
    <Document
      title={`Certificado — ${courseTitle}`}
      author="NU.V.E.M Ensino"
      subject="Certificado de Conclusão"
    >
      <Page size="A4" orientation="landscape" style={styles.page}>
        {/* Barra superior */}
        <View style={styles.topBar} />

        {/* Corpo */}
        <View style={styles.body}>
          {/* Logo / Brand */}
          <View style={styles.headerRow}>
            <CloudIcon />
            <Text style={styles.brandName}>NU.V.E.M ENSINO</Text>
          </View>
          <Text style={styles.brandSub}>MEDICINA · EDUCAÇÃO · EXCELÊNCIA</Text>

          <View style={styles.dividerGold} />

          <Text style={styles.certTitle}>CERTIFICADO</Text>
          <Text style={styles.certSubtitle}>DE CONCLUSÃO DE CURSO</Text>

          <Text style={styles.presentsLabel}>Certificamos que</Text>

          <Text style={styles.studentName}>{studentName}</Text>

          <Text style={styles.bodyText}>
            concluiu com êxito o curso
          </Text>

          <Text style={styles.courseTitle}>{courseTitle}</Text>

          <Text style={styles.hoursText}>
            com carga horária de {hours} hora{hours !== 1 ? "s" : ""} · Belo Horizonte,{" "}
            {formatDate(issueDate)}
          </Text>

          <View style={styles.dividerThin} />

          {/* Assinaturas */}
          <View style={styles.signaturesRow}>
            <View style={styles.sigBlock}>
              <View style={styles.sigLine} />
              <Text style={styles.sigName}>{instructorName}</Text>
              <Text style={styles.sigRole}>Instrutor Responsável</Text>
            </View>
            <View style={styles.sigBlock}>
              <View style={styles.sigLine} />
              <Text style={styles.sigName}>NU.V.E.M Ensino</Text>
              <Text style={styles.sigRole}>Diretoria Acadêmica</Text>
            </View>
          </View>

          {/* Rodapé */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Verifique a autenticidade em nuvemensino.com.br/verificar
            </Text>
            <View style={styles.codeBox}>
              <Text style={styles.codeText}>
                #{code.slice(0, 16).toUpperCase()}
              </Text>
            </View>
          </View>
        </View>

        {/* Barra inferior gold */}
        <View style={styles.bottomBar} />
      </Page>
    </Document>
  );
}
