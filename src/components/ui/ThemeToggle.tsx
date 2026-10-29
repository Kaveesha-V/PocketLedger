"use client";

import { useEffect, useState } from "react";

export function ThemeToggle({ className = "", style = {} }: { className?: string; style?: React.CSSProperties }) {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("pl_theme");
    if (saved === "dark" || (!saved && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
      setTheme("dark");
      document.documentElement.classList.add("dark");
    } else {
      setTheme("light");
      document.documentElement.classList.remove("dark");
    }
  }, []);

  function toggle() {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    localStorage.setItem("pl_theme", next);
    if (next === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }

  if (!mounted) {
    return (
      <button
        type="button"
        className={`btn btn-ghost btn-sm ${className}`}
        style={{ width: "36px", height: "36px", padding: 0, borderRadius: "50%", ...style }}
        aria-label="Toggle theme"
      >
        <span>☀️</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      className={`btn btn-ghost btn-sm ${className}`}
      onClick={toggle}
      style={{
        width: "36px",
        height: "36px",
        padding: 0,
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "1.1rem",
        transition: "transform 200ms ease, background 200ms ease",
        ...style,
      }}
      title={`Switch to ${theme === "light" ? "Dark" : "Light"} mode`}
      aria-label={`Switch to ${theme === "light" ? "Dark" : "Light"} mode`}
    >
      {theme === "light" ? "🌙" : "☀️"}
    </button>
  );
}
