import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  Image,
} from "@react-pdf/renderer";
import path from "path";

// ── Fontes ──────────────────────────────────────────────────────────────────
Font.register({
  family: "Helvetica",
  fonts: [
    { src: "Helvetica" },
    { src: "Helvetica-Bold", fontWeight: "bold" },
  ],
});

Font.register({
  family: "GreatVibes",
  src: path.join(process.cwd(), "public", "fonts", "GreatVibes-Regular.ttf"),
});

// ── Paleta ───────────────────────────────────────────────────────────────────
const C = {
  teal:     "#00475e",
  tealMid:  "#1a6a7a",
  gold:     "#c49a28",
  offwhite: "#f5f3ec",
  gray:     "#5a5a5a",
  dark:     "#1a1a1a",
};

// ── Estilos ──────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  page: {
    backgroundColor: C.offwhite,
    fontFamily: "Helvetica",
    width: 841,
    height: 595,
    padding: 0,
    flexDirection: "column",
  },

  // Barra dourada no topo esquerdo
  topGoldAccent: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 200,
    height: 3.5,
    backgroundColor: C.gold,
  },

  // Layout principal: duas colunas
  mainRow: {
    flexDirection: "row",
    flex: 1,
  },

  // ── Coluna esquerda ──────────────────────────────────────────────────────
  leftCol: {
    width: "65%",
    paddingLeft: 48,
    paddingRight: 28,
    paddingTop: 38,
    paddingBottom: 28,
    flexDirection: "column",
  },

  certHeader: {
    fontFamily: "Helvetica",
    fontWeight: "bold",
    fontSize: 16,
    color: C.teal,
    letterSpacing: 1.2,
    lineHeight: 1.4,
    marginBottom: 14,
  },

  studentName: {
    fontFamily: "GreatVibes",
    fontSize: 54,
    color: C.dark,
    marginBottom: 4,
  },

  nameUnderline: {
    width: "90%",
    height: 1.5,
    backgroundColor: C.gold,
    marginBottom: 18,
  },

  bodyNormal: {
    fontFamily: "Helvetica",
    fontSize: 11,
    color: C.tealMid,
    lineHeight: 1.65,
  },
  bodyBold: {
    fontFamily: "Helvetica",
    fontWeight: "bold",
    fontSize: 11,
    color: C.tealMid,
  },

  descText: {
    fontFamily: "Helvetica",
    fontSize: 8.5,
    color: C.gray,
    lineHeight: 1.6,
    marginTop: 10,
  },

  // ── Rodapé ───────────────────────────────────────────────────────────────
  footer: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginTop: "auto",
  },

  // QR Code
  qrBlock: {
    alignItems: "center",
    width: 72,
    marginRight: 16,
  },
  qrLabel: {
    fontFamily: "Helvetica",
    fontWeight: "bold",
    fontSize: 5.5,
    color: C.teal,
    letterSpacing: 0.4,
    textAlign: "center",
    marginTop: 3,
  },
  qrSub: {
    fontFamily: "Helvetica",
    fontSize: 5,
    color: C.gray,
    textAlign: "center",
  },

  // Assinatura
  sigBlock: {
    alignItems: "flex-start",
    marginRight: 20,
  },
  sigLine: {
    width: 130,
    height: 0.75,
    backgroundColor: C.dark,
    marginBottom: 3,
  },
  sigCompany: {
    fontFamily: "Helvetica",
    fontSize: 6.5,
    color: C.teal,
    marginBottom: 1,
  },
  sigName: {
    fontFamily: "Helvetica",
    fontWeight: "bold",
    fontSize: 6.5,
    color: C.dark,
  },

  // Data — alinhada ao fundo junto com as assinaturas
  dateBlock: {
    alignItems: "center",
  },
  dateValue: {
    fontFamily: "Helvetica",
    fontSize: 7.5,
    color: C.dark,
    textAlign: "center",
    marginBottom: 3,
  },
  dateLine: {
    width: 110,
    height: 0.75,
    backgroundColor: C.dark,
    marginBottom: 3,
  },
  dateLabel: {
    fontFamily: "Helvetica",
    fontSize: 6.5,
    color: C.gray,
    letterSpacing: 1,
    textAlign: "center",
  },

  // ── Coluna direita ───────────────────────────────────────────────────────
  rightCol: {
    width: "35%",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 30,
    paddingBottom: 30,
    paddingRight: 30,
    paddingLeft: 10,
  },

  // Separador vertical dourado
  divider: {
    position: "absolute",
    left: 0,
    top: 30,
    bottom: 30,
    width: 1,
    backgroundColor: C.gold,
    opacity: 0.35,
  },
});

// ── Props ────────────────────────────────────────────────────────────────────
type Props = {
  studentName: string;
  courseTitle: string;
  hours: number;
  instructorName: string;
  issueDate: Date;
  code: string;
  courseDescription?: string;
  qrCodeDataUri?: string;
  instructorSignature?: string;
  directorSignature?: string;
  isInstructorDirector?: boolean;
  isoSeal?: string;
  logoUri?: string;
};

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

// ── Componente principal ─────────────────────────────────────────────────────
export function CertificatePDF({
  studentName,
  courseTitle,
  hours,
  instructorName,
  issueDate,
  code,
  courseDescription,
  qrCodeDataUri,
  instructorSignature,
  directorSignature,
  isInstructorDirector,
  isoSeal,
  logoUri,
}: Props) {
  const dateStr = formatDate(issueDate);
  const description =
    courseDescription ||
    `Este certificado atesta que ${studentName} concluiu com êxito o ${courseTitle}, ` +
    `com carga horária de ${hours} hora${hours !== 1 ? "s" : ""}, adquirindo os conhecimentos e competências ` +
    `essenciais para o exercício profissional qualificado.`;

  return (
    <Document
      title={`Certificado — ${courseTitle}`}
      author="NU.V.E.M Ensino"
      subject="Certificado de Conclusão"
    >
      <Page size="A4" orientation="landscape" style={s.page}>

        {/* Acento dourado no topo esquerdo */}
        <View style={s.topGoldAccent} />

        <View style={s.mainRow}>

          {/* ── COLUNA ESQUERDA ──────────────────────────────────── */}
          <View style={s.leftCol}>

            <Text style={s.certHeader}>
              {"ESTE CERTIFICADO É ORGULHOSAMENTE\nAPRESENTADO A"}
            </Text>

            <Text style={s.studentName}>{studentName}</Text>
            <View style={s.nameUnderline} />

            {/* Texto principal */}
            <View>
              <Text style={s.bodyNormal}>
                {"que concluiu com sucesso o "}
                <Text style={s.bodyBold}>{courseTitle}</Text>
                {", ministrado pela "}
                <Text style={s.bodyBold}>{instructorName}</Text>
                {"."}
              </Text>
            </View>

            {/* Descrição */}
            <Text style={s.descText}>{description}</Text>

            {/* ── RODAPÉ ──────────────────────────────────────────── */}
            <View style={s.footer}>

              {/* QR Code */}
              <View style={s.qrBlock}>
                {qrCodeDataUri ? (
                  <Image
                    src={qrCodeDataUri}
                    style={{ width: 64, height: 64, objectFit: "contain" }}
                  />
                ) : (
                  <View style={{
                    width: 64, height: 64,
                    borderWidth: 1, borderColor: C.teal,
                    alignItems: "center", justifyContent: "center",
                  }}>
                    <Text style={{ fontSize: 6, color: C.teal }}>QR</Text>
                  </View>
                )}
                <Text style={s.qrLabel}>CERTIFICADO{"\n"}DIGITAL</Text>
                <Text style={s.qrSub}>Leia o QR CODE</Text>
              </View>

              {/* Assinaturas */}
              {isInstructorDirector ? (
                <View style={s.sigBlock}>
                  {directorSignature && (
                    <Image
                      src={directorSignature}
                      style={{ width: 110, height: 38, objectFit: "contain", marginBottom: 2 }}
                    />
                  )}
                  <View style={s.sigLine} />
                  <Text style={s.sigCompany}>NU.V.E.M ENSINO LTDA</Text>
                  <Text style={s.sigName}>{instructorName}</Text>
                </View>
              ) : (
                <>
                  <View style={s.sigBlock}>
                    {instructorSignature && (
                      <Image
                        src={instructorSignature}
                        style={{ width: 110, height: 38, objectFit: "contain", marginBottom: 2 }}
                      />
                    )}
                    <View style={s.sigLine} />
                    <Text style={s.sigCompany}>NU.V.E.M ENSINO LTDA</Text>
                    <Text style={s.sigName}>{instructorName}</Text>
                  </View>
                  <View style={s.sigBlock}>
                    {directorSignature && (
                      <Image
                        src={directorSignature}
                        style={{ width: 110, height: 38, objectFit: "contain", marginBottom: 2 }}
                      />
                    )}
                    <View style={s.sigLine} />
                    <Text style={s.sigCompany}>NU.V.E.M ENSINO LTDA</Text>
                    <Text style={s.sigName}>Dra. Vera Ângelo</Text>
                  </View>
                </>
              )}

              {/* Data */}
              <View style={s.dateBlock}>
                <Text style={s.dateValue}>{dateStr}</Text>
                <View style={s.dateLine} />
                <Text style={s.dateLabel}>DATA</Text>
              </View>

            </View>
            {/* fim footer */}

          </View>
          {/* fim coluna esquerda */}

          {/* ── COLUNA DIREITA ──────────────────────────────────── */}
          <View style={s.rightCol}>

            {/* Linha divisória vertical dourada */}
            <View style={s.divider} />

            {/* Selo ISO 9001 */}
            {isoSeal ? (
              <Image
                src={isoSeal}
                style={{ width: 80, height: 80, objectFit: "contain" }}
              />
            ) : (
              <View style={{
                width: 80, height: 80, borderRadius: 40,
                backgroundColor: C.gold, alignItems: "center", justifyContent: "center",
              }}>
                <Text style={{ fontFamily: "Helvetica", fontWeight: "bold", fontSize: 14, color: "#fff" }}>ISO</Text>
                <Text style={{ fontFamily: "Helvetica", fontWeight: "bold", fontSize: 12, color: "#fff" }}>9001</Text>
              </View>
            )}

            {/* Logo oficial */}
            {logoUri ? (
              <Image
                src={logoUri}
                style={{ width: 130, height: 90, objectFit: "contain" }}
              />
            ) : (
              <View style={{ alignItems: "center" }}>
                <Text style={{ fontFamily: "Helvetica", fontWeight: "bold", fontSize: 14, color: C.teal, letterSpacing: 2 }}>nu.vem</Text>
                <Text style={{ fontFamily: "Helvetica", fontSize: 9, color: C.teal, letterSpacing: 3 }}>ensino</Text>
              </View>
            )}

            {/* Código do certificado */}
            <View style={{ alignItems: "center" }}>
              <Text style={{
                fontFamily: "Helvetica",
                fontSize: 6,
                color: C.gray,
                letterSpacing: 0.5,
                textAlign: "center",
                marginBottom: 2,
              }}>
                CÓD. DE VERIFICAÇÃO
              </Text>
              <Text style={{
                fontFamily: "Helvetica",
                fontWeight: "bold",
                fontSize: 7,
                color: C.teal,
                letterSpacing: 1,
                textAlign: "center",
              }}>
                {code.slice(0, 16).toUpperCase()}
              </Text>
            </View>

          </View>
          {/* fim coluna direita */}

        </View>

      </Page>
    </Document>
  );
}
