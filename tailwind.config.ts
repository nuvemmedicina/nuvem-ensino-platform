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
          DEFAULT: "#1B2E4B",
          foreground: "#FFFFFF",
          dark: "#111D30",
          light: "#2D4A73",
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
          light: "#181828",
          card: "#1A1A2E",
          border: "#2A2A3E",
        },
        background: "#FAFAF9",
        foreground: "#1B2E4B",
        surface: "#FFFFFF",
        muted: "#6B7280",
        border: "#E5E7EB",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        serif: ["var(--font-cormorant)", "Georgia", "serif"],
      },
    },
  },
};

export default config;
