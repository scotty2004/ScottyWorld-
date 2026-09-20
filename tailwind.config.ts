import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "Helvetica Neue", "Arial", "sans-serif"],
      },
      colors: {
        background: "rgb(var(--background) / <alpha-value>)",
        foreground: "rgb(var(--foreground) / <alpha-value>)",
        card: "rgb(var(--card) / <alpha-value>)",
        border: "rgb(var(--border) / <alpha-value>)",
        // shadcn-style aliases so every existing page (admin included) is styled
        muted: { DEFAULT: "rgb(var(--soft) / <alpha-value>)", foreground: "rgb(var(--muted) / <alpha-value>)" },
        soft: "rgb(var(--soft) / <alpha-value>)",
        subtle: "rgb(var(--muted) / <alpha-value>)",
        primary: { DEFAULT: "#1d4fe8", foreground: "#ffffff" },
        brand: {
          50: "#eff4ff",
          100: "#dbe6ff",
          200: "#bcd0ff",
          400: "#5b8bff",
          500: "#2b5cf0",
          600: "#1d4fe8",
          700: "#173fc0",
          900: "#0c1f66",
        },
        navy: { 900: "#060d1f", 800: "#0a1530", 700: "#0f1d40", 600: "#15275a" },
      },
      boxShadow: {
        card: "0 1px 2px rgba(15,23,42,.04), 0 4px 14px rgba(15,23,42,.05)",
        glow: "0 0 40px rgba(43,92,240,.35)",
        float: "0 10px 30px rgba(29,79,232,.35)",
      },
      borderRadius: { "2xl": "1rem", "3xl": "1.5rem" },
      keyframes: {
        "fade-up": { from: { opacity: "0", transform: "translateY(6px)" }, to: { opacity: "1", transform: "none" } },
        pulse3: { "0%,80%,100%": { opacity: ".25" }, "40%": { opacity: "1" } },
      },
      animation: { "fade-up": "fade-up .25s ease-out both", pulse3: "pulse3 1.2s infinite both" },
    },
  },
  plugins: [],
};

export default config;
