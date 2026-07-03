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
        // ink 系列：同色相加深，專供小字/金額文字達 WCAG 4.5:1（背景、邊框仍用原色）
        "gold-ink": "#8A671F",
        "mint-ink": "#3E7257",
        "coral-ink": "#A84437",
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
