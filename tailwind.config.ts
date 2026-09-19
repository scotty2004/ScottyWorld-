import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        background: "rgb(var(--background) / <alpha-value>)",
        foreground: "rgb(var(--foreground) / <alpha-value>)",
        muted: "rgb(var(--muted) / <alpha-value>)",
        card: "rgb(var(--card) / <alpha-value>)",
        border: "rgb(var(--border) / <alpha-value>)",
        brand: {
          50: "#f5f7ff",
          100: "#e8ecff",
          500: "#635bff",
          600: "#5548f5",
          700: "#4639d8"
        }
      },
      boxShadow: {
        glow: "0 0 40px rgba(99,91,255,.16)"
      }
    }
  },
  plugins: []
};

export default config;