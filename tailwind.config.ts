import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Cormorant Garamond"', "serif"],
        sans: ['"Montserrat"', "sans-serif"],
      },
      colors: {
        paper: "#EAE8E3",
        ink: "#2B2926",
        clay: "#595045",
        moss: "#4A4F44",
        rust: "#8C5E45",
        charcoal: "#1F1E1D",
        forest: "#1F2520",
      },
      backgroundImage: {
        grain:
          "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.08'/%3E%3C/svg%3E\")",
      },
    },
  },
  plugins: [],
};

export default config;
