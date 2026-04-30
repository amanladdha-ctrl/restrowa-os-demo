import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1f2933",
        clay: "#9a5b3d",
        saffron: "#e6902e",
        mint: "#d9f2df",
        cream: "#fff7ed"
      },
      boxShadow: {
        soft: "0 18px 45px rgba(31, 41, 51, 0.10)"
      }
    }
  },
  plugins: []
};

export default config;
