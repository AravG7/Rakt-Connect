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
        raktred: {
          500: "#e63946",
          600: "#d90429",
          900: "#780000"
        }
      }
    },
  },
  plugins: [],
};
export default config;
