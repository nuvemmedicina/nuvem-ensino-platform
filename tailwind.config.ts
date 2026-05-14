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
          DEFAULT: "#00475E",
          foreground: "#FFFFFF",
          dark: "#002A38",
          light: "#1A6880",
        },
        accent: {
          DEFAULT: "#CBE4E6",
          foreground: "#00475E",
          dark: "#A8CDD0",
          light: "#E4F3F4",
        },
        canvas: {
          DEFAULT: "#002A38",
          light: "#00475E",
          card: "#003D52",
          border: "#1A6880",
        },
        background: "#F0F0F0",
        foreground: "#00475E",
        surface: "#FFFFFF",
        muted: "#54595F",
        border: "#B3B3B3",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        serif: ["var(--font-cormorant)", "Georgia", "serif"],
      },
    },
  },
};

export default config;
