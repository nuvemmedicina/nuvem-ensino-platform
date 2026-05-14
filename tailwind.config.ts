import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#1A1A2E",
          foreground: "#FFFFFF",
          dark: "#0F0F1F",
          light: "#2A2A4E",
        },
        secondary: {
          DEFAULT: "#2563EB",
          foreground: "#FFFFFF",
          dark: "#1D4ED8",
          light: "#3B82F6",
        },
        accent: {
          DEFAULT: "#D97706",
          foreground: "#FFFFFF",
          dark: "#B45309",
          light: "#F59E0B",
        },
        gold: {
          DEFAULT: "#C9A96E",
          light: "#DFC28F",
          dark: "#A8874E",
          muted: "#C9A96E33",
        },
        canvas: {
          DEFAULT: "#0F0F1A",
          light: "#1A1A2E",
          card: "#1A1A2E",
          border: "#2A2A3E",
        },
        background: "#F5F0E8",
        foreground: "#1A1A2E",
        surface: "#FFFFFF",
        muted: "#54595F",
        border: "#E8E0D5",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        serif: ["var(--font-cormorant)", "Georgia", "serif"],
      },
    },
  },
};

export default config;
