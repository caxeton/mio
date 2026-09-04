import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        carbon: {
          950: "#0a0b0d",
          900: "#0e1013",
          850: "#131519",
          800: "#181b20",
          700: "#20242b",
          600: "#2c313a",
          500: "#3c424d",
          400: "#5a6270",
          300: "#7c8494",
          200: "#a8afba",
          100: "#d3d7dd",
        },
        neon: {
          blue: "#3ad4ff",
          cyan: "#5ffbf1",
          green: "#39ff88",
          amber: "#ffb454",
          pink: "#ff5f9e",
          red: "#ff4d5e",
          violet: "#b48dff",
        },
      },
      fontFamily: {
        mono: [
          "JetBrains Mono",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Consolas",
          "Liberation Mono",
          "monospace",
        ],
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(58, 212, 255, 0.15), 0 0 24px -8px rgba(58, 212, 255, 0.35)",
        "glow-green": "0 0 0 1px rgba(57, 255, 136, 0.15), 0 0 24px -8px rgba(57, 255, 136, 0.35)",
      },
      backgroundImage: {
        grid: "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
      },
      backgroundSize: {
        grid: "24px 24px",
      },
      animation: {
        blink: "blink 1.1s steps(1) infinite",
        scan: "scan 6s linear infinite",
      },
      keyframes: {
        blink: {
          "0%, 49%": { opacity: "1" },
          "50%, 100%": { opacity: "0" },
        },
        scan: {
          "0%": { backgroundPosition: "0 0" },
          "100%": { backgroundPosition: "0 -400px" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
