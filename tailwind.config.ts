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
        surface: {
          DEFAULT: "#0F1115",
          raised: "#1A1D23",
          muted: "#252a35",
          border: "#3A3F4B",
        },
        ship: {
          DEFAULT: "#00FF66",
          dim: "#00e55b",
          glow: "rgba(0, 255, 102, 0.35)",
        },
        focus: {
          DEFAULT: "#00F0FF",
          dim: "#00dbe9",
        },
        github: {
          DEFAULT: "#a371f7",
          dim: "#8957e5",
        },
        ai: {
          DEFAULT: "#7df4ff",
          dim: "#00eefc",
        },
        danger: {
          DEFAULT: "#ffb4ab",
          bg: "#93000a",
        },
        ink: {
          DEFAULT: "#dee2f1",
          muted: "#b9ccb5",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains)", "ui-monospace", "monospace"],
      },
      boxShadow: {
        ship: "0 0 20px rgba(0, 255, 102, 0.35)",
        focus: "0 0 16px rgba(0, 240, 255, 0.25)",
      },
      backgroundImage: {
        "glass-panel":
          "linear-gradient(145deg, rgba(26, 29, 35, 0.92) 0%, rgba(15, 17, 21, 0.88) 100%)",
      },
    },
  },
  plugins: [],
};

export default config;
