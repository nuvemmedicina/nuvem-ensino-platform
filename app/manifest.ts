import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "NU.V.E.M Ensino",
    short_name: "NU.V.E.M",
    description:
      "Plataforma de formação médica com excelência em ensino clínico para profissionais de saúde.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#F0F0F0",
    theme_color: "#00475E",
    categories: ["education", "medical"],
    icons: [
      {
        src: "/icone-nuvem.png",
        sizes: "any",
        type: "image/png",
      },
      {
        src: "/icone-nuvem.png",
        sizes: "any",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
