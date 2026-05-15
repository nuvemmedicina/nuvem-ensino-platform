import { ImageResponse } from "next/og";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";
export const alt = "NU.V.E.M Ensino — Formação Médica de Excelência";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  // Foto das sócias fundadoras
  let photoDataUri: string | null = null;
  try {
    const photoPath = path.join(process.cwd(), "public", "socias-fundadoras.jpg");
    if (fs.existsSync(photoPath)) {
      const photoBuffer = fs.readFileSync(photoPath);
      photoDataUri = `data:image/jpeg;base64,${photoBuffer.toString("base64")}`;
    }
  } catch {
    photoDataUri = null;
  }

  // Fontes (woff — woff2 não é suportado pelo Satori/next-og)
  const interLightBuf    = fs.readFileSync(path.join(process.cwd(), "public", "fonts", "Inter-Light.woff"));
  const interSemiBoldBuf = fs.readFileSync(path.join(process.cwd(), "public", "fonts", "Inter-SemiBold.woff"));
  const interLight    = interLightBuf.buffer.slice(interLightBuf.byteOffset, interLightBuf.byteOffset + interLightBuf.byteLength);
  const interSemiBold = interSemiBoldBuf.buffer.slice(interSemiBoldBuf.byteOffset, interSemiBoldBuf.byteOffset + interSemiBoldBuf.byteLength);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          fontFamily: "Inter",
          backgroundColor: "#00475e",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Foto das sócias — lado direito, cobrindo metade */}
        {photoDataUri && (
          <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "52%", display: "flex" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photoDataUri}
              alt=""
              style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }}
            />
            {/* Gradiente sobre a foto para suavizar a transição */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "linear-gradient(90deg, #00475e 0%, rgba(0,71,94,0.55) 45%, rgba(0,71,94,0.15) 100%)",
              }}
            />
          </div>
        )}

        {/* Grade sutil de fundo */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(203,228,230,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(203,228,230,0.05) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        {/* Conteúdo esquerdo */}
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "56px 64px",
            width: photoDataUri ? "58%" : "100%",
            height: "100%",
          }}
        >
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 46,
                height: 46,
                borderRadius: 12,
                background: "rgba(203,228,230,0.12)",
                border: "1px solid rgba(203,228,230,0.2)",
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488.69 349.04" width={30} height={22}>
                <path fill="#cbe4e6" d="M429.63,238.95h-149.91v-25.02h12.34c1.82,0,3.51-.95,4.46-2.52.93-1.57.98-3.53.12-5.14l-35.62-66.65c-.9-1.69-2.67-2.76-4.6-2.76s-3.68,1.07-4.58,2.76l-35.62,66.65c-.86,1.61-.81,3.57.12,5.14.93,1.57,2.64,2.52,4.46,2.52h12.33v66.92c0,1.37.54,2.7,1.52,3.68.98.98,2.31,1.52,3.68,1.52h6.36l-21.06,39.4-21.04-39.4h6.36c2.88,0,5.22-2.34,5.22-5.2v-36.69c0-2.88-2.34-5.21-5.22-5.21h-118.36c-33.93,0-58.93-13.11-70.4-36.93-10.23-21.22-8.14-48.38,5.32-69.15,12.06-18.63,31-28.88,53.37-28.88h.02c3.57,0,7.25.27,10.94.8l1.31.18c2.44.35,4.78-1.06,5.62-3.36l.48-1.31c9.62-26,30.96-43.5,55.74-45.67,18.31-1.6,36.28,5.53,49.78,19.58l1.69,1.76c1.21,1.24,2.95,1.81,4.66,1.51,1.7-.3,3.15-1.43,3.86-3.03l1.01-2.28c16.11-36.38,46.2-58.09,80.53-58.09,7.23,0,14.6.96,21.92,2.86,37.82,9.81,75.34,46.01,73.94,104.72l-.05,2.14c-.03,1.52.6,3,1.75,4.01,1.13,1.02,2.65,1.49,4.17,1.28l1.96-.27c4.84-.68,9.6-1.01,14.14-1.01,23.62,0,41.9,9,52.89,26.04,11.29,17.5,12.86,41.67,3.92,60.17-7.76,16.07-21.81,24.91-39.55,24.91M476.79,146.12c-7.81-12.1-26.53-32.4-64.19-32.4-2.74,0-5.56.11-8.43.33-.87-26.33-9.21-50.54-24.25-70.33-15.18-19.94-36.51-34.29-60.06-40.41-8.46-2.22-17-3.32-25.4-3.32-36.9,0-69.69,21.46-88.88,57.8-15.37-12.66-34.35-18.89-53.76-17.18-28.34,2.49-53.08,21.37-65.41,49.62-30.34-2.55-56.35,10.11-72.39,34.88-16.11,24.87-18.55,57.5-6.19,83.12,13.91,28.89,43.32,44.79,82.79,44.79h109.77v18.95h-12.34c-1.82,0-3.51.96-4.46,2.53-.93,1.57-.98,3.51-.12,5.12l35.62,66.65c.91,1.7,2.67,2.76,4.58,2.76s3.69-1.06,4.6-2.76l35.63-66.65c.86-1.61.8-3.56-.14-5.12-.95-1.57-2.64-2.53-4.46-2.53h-12.34v-66.91c.01-1.39-.53-2.71-1.51-3.68-.98-.98-2.29-1.52-3.68-1.52h-6.36l21.04-39.41,21.06,39.41h-6.36c-2.88,0-5.22,2.32-5.22,5.2v42.76c0,2.88,2.34,5.2,5.22,5.2h158.5c22.94,0,41.87-11.94,51.94-32.77,11.03-22.82,9.1-52.62-4.78-74.14" />
              </svg>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
              <span style={{ color: "#cbe4e6", fontSize: 10, fontWeight: 600, letterSpacing: "0.3em", textTransform: "uppercase", opacity: 0.8 }}>NU.V.E.M</span>
              <span style={{ color: "#ffffff", fontSize: 18, fontWeight: 300 }}>Ensino</span>
            </div>
          </div>

          {/* Título central */}
          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            <div style={{ width: 48, height: 3, background: "#c49a28", borderRadius: 2 }} />
            <span
              style={{
                color: "#ffffff",
                fontSize: 54,
                fontWeight: 300,
                lineHeight: 1.15,
                letterSpacing: "-0.5px",
              }}
            >
              {"Formação Médica\nde "}
              <span style={{ color: "#cbe4e6", fontStyle: "italic" }}>Excelência</span>
            </span>
            <span
              style={{
                color: "rgba(203,228,230,0.7)",
                fontSize: 19,
                fontWeight: 400,
                lineHeight: 1.5,
              }}
            >
              Gastroenterologia · Motilidade Digestiva{"\n"}Fisioterapia Pélvica
            </span>
          </div>

          {/* Rodapé */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                background: "rgba(203,228,230,0.1)",
                border: "1px solid rgba(203,228,230,0.2)",
                borderRadius: 8,
                padding: "5px 14px",
              }}
            >
              <span style={{ color: "#cbe4e6", fontSize: 12, fontWeight: 600 }}>ISO 9001</span>
            </div>
            <span style={{ color: "rgba(203,228,230,0.45)", fontSize: 13 }}>
              nuvemensino.com.br
            </span>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Inter", data: interLight,    style: "normal", weight: 300 },
        { name: "Inter", data: interSemiBold, style: "normal", weight: 600 },
      ],
    }
  );
}
