import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        plum: "#3E1F3D",
        blush: "#FBE9EE",
        cream: "#FFF8F0",
        gold: "#C79A3D",
        mint: "#5E9C7B",
        coral: "#C25B4E",
      },
      fontFamily: {
        sans: ['"Noto Sans TC"', "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 2px 12px rgba(62, 31, 61, 0.08)",
      },
    },
  },
  plugins: [],
};
export default config;
