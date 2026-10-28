"use client";
import { createContext, useContext, useEffect, useState } from "react";
type Theme = "light" | "dark";
const ThemeContext = createContext<{ theme: Theme; toggle: () => void }>({
  theme: "light",
  toggle: () => {},
});
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");
  useEffect(() => {
    const saved = localStorage.getItem("pgfinder-theme") as Theme | null;
    const value = saved ?? (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    setTheme(value);
    document.documentElement.classList.toggle("dark", value === "dark");
  }, []);
  const toggle = () =>
    setTheme((current) => {
      const value = current === "light" ? "dark" : "light";
      localStorage.setItem("pgfinder-theme", value);
      document.documentElement.classList.toggle("dark", value === "dark");
      return value;
    });
  return <ThemeContext.Provider value={{ theme, toggle }}>{children}</ThemeContext.Provider>;
}
export const useTheme = () => useContext(ThemeContext);
