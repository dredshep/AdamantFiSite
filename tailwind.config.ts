import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // backgroundImage: {
      //   "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
      //   "gradient-conic":
      //     "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      // },

      backgroundImage: {
        "tubeshapes-dark": "url('/images/Adamant-bg-dark.png')",
        "tubeshapes-light": "url('/images/Adamant-bg-light.png')",
      },
      colors: {
        adamant: {
          accentText: "#A78E5A",
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
        },
      },
    },
  },
  plugins: [],
};
export default config;
