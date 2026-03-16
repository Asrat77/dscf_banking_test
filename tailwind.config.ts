import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // QA Workbench Palette
        workbench: {
          50: "#f8fafc", // Slate-50 - Background
          100: "#f1f5f9", // Slate-100 - Panel Background
          200: "#e2e8f0", // Slate-200 - Borders
          300: "#cbd5e1", // Slate-300 - Input Borders
          400: "#94a3b8", // Slate-400 - Icon/Muted text
          500: "#64748b", // Slate-500 - Secondary Text
          600: "#475569", // Slate-600 - Primary Text
          700: "#334155", // Slate-700 - Headings
          800: "#1e293b", // Slate-800 - Contrast Elements
          900: "#0f172a", // Slate-900 - Strong Contrast
        },
        // Functional Colors for QA states
        action: {
          DEFAULT: "#0f766e", // Teal-700 - Primary Action
          hover: "#0d9488",   // Teal-600
          light: "#ccfbf1",   // Teal-100
        },
        validation: {
          success: "#059669", // Emerald-600
          warning: "#d97706", // Amber-600
          error: "#dc2626",   // Red-600
          info: "#0284c7",    // Sky-600
        }
      },
      fontFamily: {
        // Use CSS variables for fonts
        primary: ['var(--font-inter)', 'sans-serif'],
        mono: ['var(--font-jetbrains-mono)', 'monospace'],
      },
      boxShadow: {
        "panel": "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
        "card": "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
        "float": "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
      },
      animation: {
        "enter-rail": "slideRight 0.4s ease-out",
        "enter-workspace": "fadeIn 0.6s ease-out",
      },
      keyframes: {
        slideRight: {
          "0%": { transform: "translateX(-20px)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      }
    },
  },
  plugins: [],
};

export default config;
