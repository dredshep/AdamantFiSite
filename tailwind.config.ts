import type { Config } from "tailwindcss";

const config = {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      backgroundImage: {
        "tubeshapes-dark": "url('/images/Adamant-bg-dark.png')",
        "tubeshapes-light": "url('/images/Adamant-bg-light.png')",
      },
      colors: {
        adamant: {
          accentText: "#A78E5A",
          accentBg: "#a88f5b",
          dark: "#8A754A",
          contrastDark: "#3F331D",
          gradientBright: "#A68C57",
          gradientDark: "#B59D6B",
          box: {
            dark: "#0C0C20",
            light: "#0D0C22",
            buttonDark: "#100F20",
            buttonLight: "#151426",
            border: "#30364E",
          },
          app: {
            box: "#30364e",
            boxHighlight: "#444a5f",
            input: "#181b27",
            selectTrigger: "#242732",
            buttonDisabled: "#888ea6",
          },
        },
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;

export default config;
