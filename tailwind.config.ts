import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        obsidian: {
          DEFAULT: "#030303",
          50: "#161616",
          100: "#111111",
          200: "#0c0c0c",
          300: "#080808",
          900: "#030303",
        },
        hairline: {
          DEFAULT: "#222222",
          light: "#2e2e2e",
          subtle: "#181818",
        },
        signal: {
          primary: "#ededed",
          secondary: "#c5c5c5",
          muted: "#737373",
          dim: "#525252",
        },
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Playfair Display", "Georgia", "serif"],
        sans: ["var(--font-sans)", "Inter", "system-ui", "-apple-system", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
