import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./promoSamsung/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./promoSamsung/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        samsungBlue: "#1428A0",
      },
      fontFamily: {
        sans: ['SamsungOne', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
