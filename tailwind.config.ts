import type { Config } from "tailwindcss";
const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./frontend/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "hsl(var(--canvas))",
        surface: "hsl(var(--surface))",
        ink: "hsl(var(--ink))",
        muted: "hsl(var(--muted))",
        line: "hsl(var(--line))",
        brand: "hsl(var(--brand))",
        sand: "hsl(var(--sand))",
        sage: "hsl(var(--sage))",
        amber: "hsl(var(--amber))",
        brick: "hsl(var(--brick))",
      },
      fontFamily: {
        sans: ["Inter Variable", "Inter", "sans-serif"],
        display: ["Fraunces Variable", "Georgia", "serif"],
      },
      boxShadow: { soft: "0 14px 45px rgba(50, 36, 30, .06)" },
      borderRadius: { xl: "1rem", "2xl": "1.35rem" },
      keyframes: {
        rise: {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: { rise: "rise .35s ease-out both" },
    },
  },
  plugins: [],
};
export default config;
