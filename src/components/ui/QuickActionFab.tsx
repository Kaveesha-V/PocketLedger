"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export function QuickActionFab() {
  const [open, setOpen] = useState(false);

  // Close on Escape key
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) {
      window.addEventListener("keydown", onKeyDown);
      return () => window.removeEventListener("keydown", onKeyDown);
    }
  }, [open]);

  const ACTIONS = [
    {
      label: "Lend Money (I Gave)",
      sub: "Record money you gave to a friend",
      href: "/ledger/new?direction=I_GAVE",
      icon: "💸",
      color: "var(--income)",
      bg: "color-mix(in srgb, var(--income) 15%, var(--surface))",
    },
    {
      label: "Borrow Money (I Borrowed)",
      sub: "Record money you borrowed from a friend",
      href: "/ledger/new?direction=I_BORROWED",
      icon: "🤲",
      color: "var(--expense)",
      bg: "color-mix(in srgb, var(--expense) 15%, var(--surface))",
    },
    {
      label: "Add Budget Expense",
      sub: "Log daily budget expense or income",
      href: "/budget",
      icon: "📊",
      color: "var(--primary)",
      bg: "color-mix(in srgb, var(--primary) 15%, var(--surface))",
    },
    {
      label: "Manage Friends",
      sub: "View friends and settled accounts",
      href: "/friends",
      icon: "👥",
      color: "var(--accent)",
      bg: "color-mix(in srgb, var(--accent) 15%, var(--surface))",
    },
  ];

  return (
    <>
      {/* Backdrop when FAB menu is open */}
      {open && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            backdropFilter: "blur(4px)",
            WebkitBackdropFilter: "blur(4px)",
            zIndex: 90,
            animation: "fadeIn 150ms ease-out",
          }}
          onClick={() => setOpen(false)}
        />
      )}

      {/* Speed Dial Menu Items */}
      {open && (
        <div
          className="fab-speed-dial-menu"
          style={{
            position: "fixed",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: "0.625rem",
            zIndex: 95,
            animation: "slideUp 180ms cubic-bezier(0.16, 1, 0.3, 1)",
            maxWidth: "calc(100vw - 2.5rem)",
          }}
        >
          {ACTIONS.map((action, i) => (
            <Link
              key={action.label}
              href={action.href}
              onClick={() => setOpen(false)}
              className="card card-interactive"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.875rem",
                padding: "0.75rem 1rem",
                background: "var(--surface)",
                border: "1px solid var(--border)",
                boxShadow: "var(--shadow-lg)",
                borderRadius: "var(--radius)",
                textDecoration: "none",
                color: "var(--text)",
                minWidth: "260px",
                transform: "translateY(0)",
                animation: `fadeIn ${120 + i * 35}ms ease-out`,
              }}
            >
              <div
                style={{
                  width: "38px",
                  height: "38px",
                  borderRadius: "50%",
                  background: action.bg,
                  color: action.color,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.2rem",
                  flexShrink: 0,
                }}
              >
                {action.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontWeight: 600, fontSize: "0.875rem", color: "var(--text)" }}>
                  {action.label}
                </p>
                <p style={{ margin: "0.1rem 0 0", fontSize: "0.72rem", color: "var(--muted)" }}>
                  {action.sub}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Floating Action Button */}
      <button
        type="button"
        className="fab fab-speed-dial-btn"
        aria-label={open ? "Close quick actions menu" : "Open quick actions menu"}
        title={open ? "Close" : "Quick Actions"}
        onClick={() => setOpen((prev) => !prev)}
        style={{
          zIndex: 96,
          transform: open ? "rotate(45deg)" : "none",
          transition: "transform 220ms cubic-bezier(0.16, 1, 0.3, 1), background var(--transition), box-shadow var(--transition)",
          background: open ? "var(--expense)" : "linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)",
          color: "#fff",
          boxShadow: open ? "0 4px 14px rgba(244, 63, 94, 0.4)" : "0 8px 24px color-mix(in srgb, var(--primary) 45%, transparent)",
        }}
      >
        <span
          style={{
            fontSize: "1.875rem",
            lineHeight: 1,
            display: "inline-block",
            transform: "translateY(-1px)",
          }}
        >
          +
        </span>
      </button>

      <style>{`
        @media (min-width: 1024px) {
          .fab-speed-dial-btn {
            bottom: 2rem !important;
            right: 2rem !important;
          }
          .fab-speed-dial-menu {
            bottom: calc(2rem + 3.5rem + 0.75rem) !important;
            right: 2rem !important;
          }
        }
        @media (max-width: 1023px) {
          .fab-speed-dial-btn {
            bottom: calc(4.75rem + env(safe-area-inset-bottom, 0px)) !important;
            right: 1.25rem !important;
          }
          .fab-speed-dial-menu {
            bottom: calc(4.75rem + 3.5rem + 0.75rem + env(safe-area-inset-bottom, 0px)) !important;
            right: 1.25rem !important;
          }
        }
      `}</style>
    </>
  );
}
