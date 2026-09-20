// "Conteúdo de apoio": os 6 guias de interpretação do app original.

export type LibraryTopic = {
  t: string;
  sub: string;
  lead: string;
  steps: string[];
  quote: string;
  tip: string;
};

export const libraryPt: LibraryTopic[] = [
  {
    t: "SIBO",
    sub: "Como ler a janela de 90 minutos",
    lead: "O ponto central é comparar cada leitura de H₂ com o valor basal e observar quando ocorre a elevação.",
    steps: [
      "Use glicose ou lactulose conforme o protocolo apresentado no material.",
      "Observe as leituras de 15 a 90 minutos: elevação de H₂ acima do critério nessa janela sustenta resultado positivo.",
      "Uma elevação somente aos 120 minutos deve ser interpretada com cuidado, pois o material descreve esse momento como esperado quando o substrato chega ao cólon.",
      "Se não houver elevação de H₂ durante todo o exame, considere a possibilidade de não respondedor e avaliação com CH₄.",
    ],
    quote: "“Espera-se elevação aos 120 minutos, quando o substrato chega ao cólon.”",
    tip: "Na prática do jogo: antes de olhar o pico máximo, localize o minuto em que a curva começou a subir.",
  },
  {
    t: "IMO",
    sub: "Não procure apenas uma subida em relação ao basal",
    lead: "Para IMO, o material enfatiza o valor absoluto do CH₄, e não a necessidade de uma grande variação da curva.",
    steps: [
      "Acompanhe a linha de CH₄ durante toda a monitorização.",
      "CH₄ ≥10 ppm em qualquer momento pode preencher o critério apresentado, inclusive em jejum.",
      "Sintomas não são obrigatórios para considerar o teste positivo.",
      "H₂ baixo não exclui IMO: o documento apresenta exemplo com H₂ baixo e CH₄ elevado.",
    ],
    quote: "“Elevação dos níveis de CH4 ≥ 10 ppm a qualquer momento da monitorização, mesmo em jejum.”",
    tip: "Atalho visual: olhe primeiro para a linha verde e pergunte se ela toca ou ultrapassa 10 ppm.",
  },
  {
    t: "Lactose",
    sub: "Má absorção não é sinônimo de intolerância",
    lead: "O documento usa a combinação entre elevação do H₂ e sintomas para separar os conceitos.",
    steps: [
      "Compare o H₂ ao basal durante a monitorização até 180 minutos.",
      "Elevação do H₂ dentro do critério sem sintomas é compatível com má absorção no enquadramento apresentado.",
      "Quando a elevação ocorre junto de sintomas, o material classifica como intolerância.",
      "Sintomas importantes com H₂ baixo levantam a possibilidade de não respondedor ao H₂; o documento sugere repetir com CH₄.",
    ],
    quote: "“Paciente referiu diarreia e flatulência intensa, que poderia estar relacionados a não respondedor ao H2.”",
    tip: "Sempre leia gráfico e sintomas juntos antes de usar a palavra “intolerância”.",
  },
  {
    t: "Frutose",
    sub: "Curva + sintomas + tempo",
    lead: "Para frutose, o material orienta leituras de 30 em 30 minutos até 180 minutos e diferencia má absorção de intolerância pela presença de sintomas.",
    steps: [
      "Confira primeiro se o basal é adequado conforme o material.",
      "Procure elevação de H₂ ≥20 ppm acima do basal.",
      "Sem sintomas, o documento enquadra a elevação como má absorção.",
      "Com sintomas, a mesma elevação é enquadrada como intolerância.",
      "H₂ baixo com sintomas pode indicar não respondedor; considerar avaliação com CH₄.",
    ],
    quote: "“Sintomas devem ser pesquisados até 24h do início do teste.”",
    tip: "Não encerre mentalmente a leitura aos 90 ou 120 minutos: neste protocolo a monitorização vai até 180 minutos.",
  },
  {
    t: "Sacarose",
    sub: "Confira a linha basal antes de aceitar o limiar desenhado",
    lead: "O material traz um exemplo particularmente útil de erro de registro gráfico.",
    steps: [
      "Leituras são feitas de 30 em 30 minutos até 180 minutos.",
      "Compare a elevação do H₂ com o basal real, não apenas com uma linha de referência desenhada no gráfico.",
      "O exemplo do documento mostra primeira leitura fora da linha basal, tornando o nível de intolerância registrado incorreto.",
      "A ausência ou presença de sintomas continua importante para diferenciar má absorção de intolerância.",
    ],
    quote: "“Ao se examinar com cuidado o registro, observa-se que a primeira leitura não está na linha basal.”",
    tip: "Antes de classificar: basal → diferença em ppm → janela temporal → sintomas.",
  },
  {
    t: "Qualidade técnica",
    sub: "Quando a curva não deve ser aceita automaticamente",
    lead: "O documento mostra que um gráfico pode parecer interpretável e ainda conter um problema de coleta ou leitura.",
    steps: [
      "Uma queda isolada em uma curva ascendente pode decorrer de sopro fraco.",
      "O material recomenda repetir a leitura, idealmente com outro aparelho; se não for possível, repetir com o mesmo.",
      "Cheque a qualidade do sopro e registre a maior mensuração.",
      "Leituras em zero durante toda a monitorização podem representar erro de calibração ou não respondedor ao H₂.",
    ],
    quote: "“Checar com cuidado a qualidade do sopro e anotar o valor da maior mensuração.”",
    tip: "Curvas biologicamente estranhas devem disparar uma checagem técnica antes da conclusão diagnóstica.",
  },
];

export const libraryEs: LibraryTopic[] = [
  {
    t: "SIBO",
    sub: "Cómo leer la ventana de 90 minutos",
    lead: "El punto central es comparar cada lectura de H₂ con el valor basal y observar cuándo ocurre la elevación.",
    steps: [
      "Use glucosa o lactulosa según el protocolo presentado en el material.",
      "Observe las lecturas de 15 a 90 minutos: una elevación de H₂ por encima del criterio en esta ventana sustenta un resultado positivo.",
      "Una elevación solamente a los 120 minutos debe interpretarse con cautela, porque el material describe ese momento como esperado cuando el sustrato llega al colon.",
      "Si no hay elevación de H₂ durante toda la prueba, considere la posibilidad de un no respondedor y la evaluación con CH₄.",
    ],
    quote: "“Se espera elevación a los 120 minutos, cuando el sustrato llega al colon.”",
    tip: "Antes de mirar el pico máximo, localice el minuto en que la curva comenzó a subir.",
  },
  {
    t: "IMO",
    sub: "No busque solamente un aumento respecto del basal",
    lead: "Para IMO, el material enfatiza el valor absoluto de CH₄ y no la necesidad de una gran variación de la curva.",
    steps: [
      "Siga la línea de CH₄ durante toda la monitorización.",
      "CH₄ ≥10 ppm en cualquier momento puede cumplir el criterio presentado, incluso en ayunas.",
      "Los síntomas no son obligatorios para considerar la prueba positiva.",
      "Un H₂ bajo no excluye IMO: el documento presenta un ejemplo con H₂ bajo y CH₄ elevado.",
    ],
    quote: "“Elevación de los niveles de CH4 ≥ 10 ppm en cualquier momento de la monitorización, incluso en ayunas.”",
    tip: "Atajo visual: mire primero la línea de CH₄ y pregúntese si alcanza o supera 10 ppm.",
  },
  {
    t: "Lactosa",
    sub: "Malabsorción no es sinónimo de intolerancia",
    lead: "El documento utiliza la combinación entre elevación de H₂ y síntomas para separar los conceptos.",
    steps: [
      "Compare el H₂ con el basal durante la monitorización hasta 180 minutos.",
      "La elevación de H₂ dentro del criterio sin síntomas es compatible con malabsorción en el marco presentado.",
      "Cuando la elevación ocurre junto con síntomas, el material la clasifica como intolerancia.",
      "Síntomas importantes con H₂ bajo plantean la posibilidad de un no respondedor al H₂; el documento sugiere repetir incluyendo CH₄.",
    ],
    quote: "“El paciente refirió diarrea y flatulencia intensa, que podrían estar relacionadas con un no respondedor al H2.”",
    tip: "Lea siempre el gráfico y los síntomas juntos antes de utilizar la palabra “intolerancia”.",
  },
  {
    t: "Fructosa",
    sub: "Curva + síntomas + tiempo",
    lead: "Para fructosa, el material orienta lecturas cada 30 minutos hasta 180 minutos y diferencia malabsorción de intolerancia por la presencia de síntomas.",
    steps: [
      "Compruebe primero si el basal es adecuado según el material.",
      "Busque una elevación de H₂ ≥20 ppm sobre el basal.",
      "Sin síntomas, el documento clasifica la elevación como malabsorción.",
      "Con síntomas, la misma elevación se clasifica como intolerancia.",
      "H₂ bajo con síntomas puede indicar un no respondedor; considere la evaluación con CH₄.",
    ],
    quote: "“Los síntomas deben investigarse hasta 24 h desde el inicio de la prueba.”",
    tip: "No termine mentalmente la lectura a los 90 o 120 minutos: en este protocolo la monitorización llega hasta 180 minutos.",
  },
  {
    t: "Sacarosa",
    sub: "Compruebe la línea basal antes de aceptar el umbral dibujado",
    lead: "El material presenta un ejemplo especialmente útil de error de registro gráfico.",
    steps: [
      "Las lecturas se realizan cada 30 minutos hasta 180 minutos.",
      "Compare la elevación de H₂ con el basal real, no solamente con una línea de referencia dibujada en el gráfico.",
      "El ejemplo del documento muestra la primera lectura fuera de la línea basal, haciendo incorrecto el nivel de intolerancia registrado.",
      "La ausencia o presencia de síntomas sigue siendo importante para diferenciar malabsorción de intolerancia.",
    ],
    quote: "“Al examinar cuidadosamente el registro, se observa que la primera lectura no está en la línea basal.”",
    tip: "Antes de clasificar: basal → diferencia en ppm → ventana temporal → síntomas.",
  },
  {
    t: "Calidad técnica",
    sub: "Cuándo no aceptar automáticamente la curva",
    lead: "El documento muestra que un gráfico puede parecer interpretable y aun contener un problema de toma o lectura.",
    steps: [
      "Una caída aislada en una curva ascendente puede deberse a un soplo débil.",
      "El material recomienda repetir la lectura, idealmente con otro equipo; si no es posible, repetir con el mismo.",
      "Compruebe la calidad del soplo y registre la medición más alta.",
      "Lecturas en cero durante toda la monitorización pueden representar un error de calibración o un no respondedor al H₂.",
    ],
    quote: "“Comprobar cuidadosamente la calidad del soplo y anotar el valor de la medición más alta.”",
    tip: "Las curvas biológicamente extrañas deben activar una comprobación técnica antes de la conclusión diagnóstica.",
  },
];

export function libraryFor(lang: "pt" | "es"): LibraryTopic[] {
  return lang === "es" ? libraryEs : libraryPt;
}
