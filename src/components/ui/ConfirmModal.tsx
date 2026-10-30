"use client";

import { useEffect } from "react";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "primary" | "warning";
  icon?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
  icon = "⚠️",
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  useEffect(() => {
    function handleKeyDown(e: globalThis.KeyboardEvent) {
      if (e.key === "Escape" && isOpen && !loading) {
        onCancel();
      }
    }
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, loading, onCancel]);

  if (!isOpen) return null;

  const btnBg =
    variant === "danger"
      ? "var(--expense)"
      : variant === "warning"
      ? "var(--accent)"
      : "var(--primary)";

  const btnColor = variant === "warning" ? "#000" : "#fff";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.6)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "1rem",
        animation: "fadeIn 150ms ease-out",
      }}
      onClick={() => {
        if (!loading) onCancel();
      }}
    >
      <div
        className="card"
        style={{
          width: "100%",
          maxWidth: "420px",
          padding: "1.75rem",
          borderRadius: "var(--radius-lg)",
          boxShadow: "var(--shadow-lg)",
          background: "var(--surface)",
          border: "1px solid var(--border)",
          transform: "scale(1)",
          animation: "scaleUp 180ms cubic-bezier(0.16, 1, 0.3, 1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem", marginBottom: "1rem" }}>
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "50%",
              background: `color-mix(in srgb, ${btnBg} 15%, transparent)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.375rem",
              flexShrink: 0,
            }}
          >
            {icon}
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: "1.125rem", margin: "0 0 0.375rem", fontWeight: 600 }}>{title}</h3>
            <p style={{ color: "var(--muted)", fontSize: "0.875rem", margin: 0, lineHeight: 1.5 }}>
              {message}
            </p>
          </div>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", marginTop: "1.5rem" }}>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={onCancel}
            disabled={loading}
            style={{ minWidth: "80px" }}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className="btn"
            onClick={onConfirm}
            disabled={loading}
            style={{
              background: btnBg,
              color: btnColor,
              minWidth: "100px",
              fontWeight: 600,
            }}
          >
            {loading ? "Processing…" : confirmText}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleUp {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

