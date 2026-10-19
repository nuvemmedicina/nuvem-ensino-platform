import { Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";

// Declaração de matrícula que o aluno baixa na área do aluno.
// Sempre em português: é um documento para órgãos e empregadores no Brasil.

const AZUL = "#1f3a5c";
const TEXTO = "#222222";
const CINZA = "#6b7280";

const s = StyleSheet.create({
  page: { paddingTop: 56, paddingBottom: 70, paddingHorizontal: 60, fontFamily: "Helvetica", fontSize: 11, color: TEXTO },
  cabecalho: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingBottom: 14, borderBottomWidth: 1.5, borderBottomColor: AZUL },
  logo: { width: 60 },
  empresa: { fontSize: 8.5, color: CINZA, textAlign: "right", lineHeight: 1.6 },
  titulo: { marginTop: 30, marginBottom: 20, fontSize: 19, fontFamily: "Helvetica-Bold", color: AZUL, textAlign: "center", letterSpacing: 1.5 },
  paragrafo: { lineHeight: 1.35, textAlign: "justify" },
  negrito: { fontFamily: "Helvetica-Bold" },
  caixa: { marginTop: 18, marginBottom: 16, backgroundColor: "#f3f4f6", borderRadius: 4, paddingVertical: 12, paddingHorizontal: 14 },
  linha: { flexDirection: "row", marginVertical: 2 },
  rotulo: { width: 150, fontFamily: "Helvetica-Bold", lineHeight: 1.35 },
  valor: { flex: 1, lineHeight: 1.35 },
  data: { marginTop: 16, textAlign: "right" },
  assinatura: { marginTop: 34, alignItems: "center" },
  assinaturaImg: { width: 110, height: 40, objectFit: "contain" },
  assinaturaLinha: { width: 250, borderTopWidth: 0.8, borderTopColor: TEXTO, marginTop: 2, marginBottom: 6 },
  assinaturaNome: { fontFamily: "Helvetica-Bold" },
  assinaturaEmpresa: { fontSize: 9.5, marginTop: 3 },
  rodape: { position: "absolute", bottom: 40, left: 60, right: 60, borderTopWidth: 0.5, borderTopColor: "#e5e7eb", paddingTop: 10, fontSize: 8, color: CINZA, textAlign: "center" },
});

export type DeclaracaoMatriculaProps = {
  nome: string;
  /** CPF já formatado (000.000.000-00) */
  cpf: string;
  /** Sem gênero no cadastro, o texto usa a forma neutra "matriculado(a)". */
  genero?: "F" | "M";
  curso: string;
  cargaHoraria: number;
  periodo?: string;
  dataMatricula: string;
  codigo: string;
  /** Curso com certificado da Faculdade FACOP (Course.showCertificationSeals) */
  certificacaoFacop?: boolean;
  /** "Belo Horizonte, <data por extenso>." já montado */
  localEData: string;
  logoUri?: string;
  assinaturaUri?: string;
};

export function DeclaracaoMatriculaPDF(p: DeclaracaoMatriculaProps) {
  const flexao = (f: string, m: string, neutro: string) => (p.genero === "F" ? f : p.genero === "M" ? m : neutro);
  const inscrito = flexao("inscrita", "inscrito", "inscrito(a)");
  const matriculado = flexao("matriculada", "matriculado", "matriculado(a)");

  const linhas: [string, string][] = [
    ["Curso:", p.curso],
    ["Carga horária:", `${p.cargaHoraria} horas`],
    ...(p.periodo ? ([["Período:", p.periodo]] as [string, string][]) : []),
    ["Data da matrícula:", p.dataMatricula],
    ["Situação:", "Matrícula ativa"],
    ["Código da matrícula:", p.codigo],
  ];

  return (
    <Document title="Declaração de matrícula" author="NU.V.E.M ENSINO LTDA" language="pt-BR">
      <Page size="A4" style={s.page}>
        <View style={s.cabecalho}>
          {/* eslint-disable-next-line jsx-a11y/alt-text -- Image do react-pdf não tem alt */}
          {p.logoUri ? <Image src={p.logoUri} style={s.logo} /> : <Text style={s.negrito}>NU.V.E.M Ensino</Text>}
          <View>
            <Text style={s.empresa}>NU.V.E.M ENSINO LTDA</Text>
            <Text style={s.empresa}>CNPJ 42.679.051/0001-31</Text>
          </View>
        </View>

        <Text style={s.titulo}>DECLARAÇÃO DE MATRÍCULA</Text>

        <Text style={s.paragrafo}>
          Declaramos, para os devidos fins, que <Text style={s.negrito}>{p.nome}</Text>, {inscrito} no CPF sob o nº{" "}
          <Text style={s.negrito}>{p.cpf}</Text>, encontra-se regularmente {matriculado} no curso abaixo, oferecido pela
          NU.V.E.M Ensino.
        </Text>

        <View style={s.caixa}>
          {linhas.map(([rotulo, valor]) => (
            <View key={rotulo} style={s.linha}>
              <Text style={s.rotulo}>{rotulo}</Text>
              <Text style={s.valor}>{valor}</Text>
            </View>
          ))}
        </View>

        {p.certificacaoFacop && (
          <Text style={[s.paragrafo, { marginBottom: 10 }]}>
            O certificado de conclusão do curso é emitido pela Faculdade FACOP, instituição credenciada pelo Ministério
            da Educação (MEC).
          </Text>
        )}
        <Text>Por ser expressão da verdade, firmamos a presente declaração.</Text>
        <Text style={s.data}>{p.localEData}</Text>

        <View style={s.assinatura} wrap={false}>
          {/* eslint-disable-next-line jsx-a11y/alt-text -- Image do react-pdf não tem alt */}
          {p.assinaturaUri ? <Image src={p.assinaturaUri} style={s.assinaturaImg} /> : <View style={{ height: 40 }} />}
          <View style={s.assinaturaLinha} />
          <Text style={s.assinaturaNome}>Dra. Vera Ângelo</Text>
          <Text style={s.assinaturaEmpresa}>NU.V.E.M ENSINO LTDA</Text>
        </View>

        <Text style={s.rodape} fixed>
          NU.V.E.M ENSINO LTDA · CNPJ 42.679.051/0001-31 · nuvemensino.com.br
        </Text>
      </Page>
    </Document>
  );
}
