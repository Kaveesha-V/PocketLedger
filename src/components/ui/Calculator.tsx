"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Delete } from "lucide-react";

interface CalculatorProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Calculator({ isOpen, onClose }: CalculatorProps) {
  const [display, setDisplay] = useState("0");
  const [expression, setExpression] = useState("");
  const [prevResult, setPrevResult] = useState<string | null>(null);
  const [justEvaluated, setJustEvaluated] = useState(false);

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setDisplay("0");
      setExpression("");
      setPrevResult(null);
      setJustEvaluated(false);
    }
  }, [isOpen]);

  // Keyboard support
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape") { onClose(); return; }
      if ("0123456789".includes(e.key)) { handleInput(e.key); return; }
      if (["+", "-", "*", "/"].includes(e.key)) { handleInput(e.key); return; }
      if (e.key === "." || e.key === ",") { handleInput("."); return; }
      if (e.key === "Enter" || e.key === "=") { handleInput("="); return; }
      if (e.key === "Backspace") { handleInput("⌫"); return; }
      if (e.key === "Delete" || (e.key === "c" && !e.ctrlKey)) { handleInput("C"); return; }
      if (e.key === "%") { handleInput("%"); return; }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isOpen, display, expression, justEvaluated]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  function handleInput(value: string) {
    if (value === "C") {
      setDisplay("0");
      setExpression("");
      setPrevResult(null);
      setJustEvaluated(false);
      return;
    }

    if (value === "⌫") {
      if (justEvaluated) {
        setDisplay("0");
        setExpression("");
        setJustEvaluated(false);
        return;
      }
      setDisplay((prev) => {
        const next = prev.length > 1 ? prev.slice(0, -1) : "0";
        return next;
      });
      return;
    }

    const isOperator = ["+", "-", "×", "÷", "*", "/"].includes(value);
    const normalizedOp = value === "×" ? "*" : value === "÷" ? "/" : value;

    if (value === "=") {
      try {
        const exprToEval = (expression + display)
          .replace(/×/g, "*")
          .replace(/÷/g, "/");
        // Safe eval using Function
        // eslint-disable-next-line no-new-func
        const result = Function(`"use strict"; return (${exprToEval})`)() as number;
        const formatted = formatResult(result);
        setPrevResult(expression + display + " =");
        setDisplay(formatted);
        setExpression("");
        setJustEvaluated(true);
      } catch {
        setDisplay("Error");
        setExpression("");
        setJustEvaluated(true);
      }
      return;
    }

    if (value === "%") {
      try {
        const val = parseFloat(display);
        if (!isNaN(val)) {
          const result = val / 100;
          setDisplay(formatResult(result));
          setJustEvaluated(false);
        }
      } catch {
        // ignore
      }
      return;
    }

    if (value === "+/-") {
      const val = parseFloat(display);
      if (!isNaN(val) && val !== 0) {
        setDisplay(formatResult(-val));
      }
      return;
    }

    if (isOperator) {
      if (justEvaluated) {
        setExpression(display + normalizedOp);
        setDisplay("0");
        setJustEvaluated(false);
        return;
      }
      // Replace trailing operator
      if (expression && display === "0") {
        setExpression((prev) => prev.slice(0, -1) + normalizedOp);
        return;
      }
      setExpression((prev) => prev + display + normalizedOp);
      setDisplay("0");
      setPrevResult(null);
      return;
    }

    // Number or dot
    if (justEvaluated) {
      setDisplay(value === "." ? "0." : value);
      setExpression("");
      setJustEvaluated(false);
      return;
    }

    if (value === ".") {
      if (!display.includes(".")) {
        setDisplay((prev) => prev + ".");
      }
      return;
    }

    setDisplay((prev) => {
      if (prev === "0" || prev === "Error") return value;
      if (prev.length >= 12) return prev; // max digits
      return prev + value;
    });
  }

  function formatResult(num: number): string {
    if (isNaN(num) || !isFinite(num)) return "Error";
    // Avoid floating point weirdness
    const str = parseFloat(num.toPrecision(10)).toString();
    return str;
  }

  // Build display expression (for top bar)
  const topExpr = justEvaluated
    ? prevResult ?? ""
    : expression
      ? expression.replace(/\*/g, "×").replace(/\//g, "÷")
      : "";

  if (!isOpen) return null;

  const BUTTONS: Array<{ label: string; type: "num" | "op" | "action" | "equals" | "clear" }> = [
    { label: "C",    type: "clear" },
    { label: "+/-",  type: "action" },
    { label: "%",    type: "action" },
    { label: "÷",    type: "op" },
    { label: "7",    type: "num" },
    { label: "8",    type: "num" },
    { label: "9",    type: "num" },
    { label: "×",    type: "op" },
    { label: "4",    type: "num" },
    { label: "5",    type: "num" },
    { label: "6",    type: "num" },
    { label: "-",    type: "op" },
    { label: "1",    type: "num" },
    { label: "2",    type: "num" },
    { label: "3",    type: "num" },
    { label: "+",    type: "op" },
    { label: "0",    type: "num" },   // wide
    { label: ".",    type: "num" },
    { label: "=",    type: "equals" },
  ];

  function btnStyle(type: string, label: string): React.CSSProperties {
    const base: React.CSSProperties = {
      border: "none",
      cursor: "pointer",
      borderRadius: "14px",
      fontFamily: "Poppins, sans-serif",
      fontWeight: 600,
      fontSize: label === "0" ? "1.1rem" : "1.15rem",
      transition: "all 120ms ease",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      height: "60px",
      userSelect: "none",
      WebkitUserSelect: "none",
      outline: "none",
      boxSizing: "border-box",
    };
    if (type === "clear") {
      return { ...base, background: "color-mix(in srgb, var(--expense) 18%, var(--surface-2))", color: "var(--expense)", fontSize: "1rem", fontWeight: 700 };
    }
    if (type === "action") {
      return { ...base, background: "var(--surface-2)", color: "var(--muted)", fontSize: "1rem" };
    }
    if (type === "op") {
      return { ...base, background: "color-mix(in srgb, var(--primary) 16%, var(--surface))", color: "var(--primary)", fontSize: "1.3rem", fontWeight: 700 };
    }
    if (type === "equals") {
      return { ...base, background: "linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)", color: "#fff", fontSize: "1.4rem", boxShadow: "0 4px 14px color-mix(in srgb, var(--primary) 40%, transparent)" };
    }
    return { ...base, background: "var(--surface)", color: "var(--text)", border: "1px solid var(--border)" };
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(5px)",
          WebkitBackdropFilter: "blur(5px)",
          zIndex: 200,
          animation: "fadeIn 150ms ease-out",
        }}
      />

      {/* Calculator Panel */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 201,
          background: "var(--bg)",
          borderRadius: "24px 24px 0 0",
          padding: "0 0 env(safe-area-inset-bottom, 1rem)",
          boxShadow: "0 -12px 48px rgba(0,0,0,0.5)",
          maxWidth: "420px",
          margin: "0 auto",
          animation: "slideUp 240ms cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        {/* Handle bar */}
        <div style={{ display: "flex", justifyContent: "center", padding: "0.75rem 0 0" }}>
          <div style={{ width: "40px", height: "4px", borderRadius: "9999px", background: "var(--border)" }} />
        </div>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.5rem 1.25rem 0" }}>
          <div>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted)" }}>
              Calculator
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              width: "32px", height: "32px", borderRadius: "9999px",
              border: "none", cursor: "pointer",
              background: "var(--surface-2)",
              color: "var(--muted)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
            aria-label="Close calculator"
          >
            <X size={16} />
          </button>
        </div>

        {/* Display */}
        <div
          style={{
            padding: "0.5rem 1.25rem 1rem",
            textAlign: "right",
            minHeight: "90px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
          }}
        >
          <div
            style={{
              fontSize: "0.78rem",
              color: "var(--muted)",
              minHeight: "1.2em",
              marginBottom: "0.25rem",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {topExpr}
          </div>
          <div
            style={{
              fontSize: display.length > 10 ? "1.75rem" : display.length > 7 ? "2.25rem" : "3rem",
              fontWeight: 700,
              fontFamily: "Poppins, sans-serif",
              color: "var(--text)",
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              transition: "font-size 100ms ease",
            }}
          >
            {display}
          </div>
        </div>

        {/* Backspace row */}
        <div style={{ padding: "0 1rem", marginBottom: "0.25rem", display: "flex", justifyContent: "flex-end" }}>
          <button
            type="button"
            onPointerDown={() => handleInput("⌫")}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--muted)",
              padding: "0.35rem 0.5rem",
              borderRadius: "8px",
              display: "flex", alignItems: "center", gap: "0.25rem",
              fontSize: "0.78rem",
              fontWeight: 500,
            }}
            aria-label="Backspace"
          >
            <Delete size={18} style={{ color: "var(--expense)" }} />
          </button>
        </div>

        {/* Button Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "0.5rem",
            padding: "0 1rem 1.25rem",
          }}
        >
          {BUTTONS.map((btn) => {
            const isWide = btn.label === "0";
            return (
              <button
                key={btn.label}
                type="button"
                onPointerDown={() => handleInput(btn.label)}
                style={{
                  ...btnStyle(btn.type, btn.label),
                  gridColumn: isWide ? "span 2" : "span 1",
                }}
                aria-label={btn.label}
              >
                {btn.label}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
