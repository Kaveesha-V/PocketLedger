"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { initials, stringToHue } from "@/lib/format";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { QuickActionFab } from "@/components/ui/QuickActionFab";

interface NavItem {
  href: string;
  icon: string;
  label: string;
}

const NAV: NavItem[] = [
  { href: "/dashboard",  icon: "🏠", label: "Home"     },
  { href: "/budget",     icon: "📊", label: "Budget"   },
  { href: "/friends",    icon: "👥", label: "Friends"  },
  { href: "/reminders",  icon: "💬", label: "Remind"   },
  { href: "/reports",    icon: "📈", label: "Reports"  },
];

const DRAWER_NAV: NavItem[] = [
  { href: "/dashboard", icon: "🏠", label: "Dashboard / Home" },
  { href: "/budget",    icon: "📊", label: "Budget Sheet" },
  { href: "/friends",   icon: "👥", label: "Friends & Ledger" },
  { href: "/reminders", icon: "💬", label: "Reminders & WhatsApp" },
  { href: "/reports",   icon: "📈", label: "Reports & Insights" },
  { href: "/settings",  icon: "⚙️", label: "Settings & Categories" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const name = session?.user?.name ?? "User";
  const email = session?.user?.email ?? "";
  const hue = stringToHue(name);

  // Close drawer automatically on navigation route changes
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  // Handle escape key and lock body scroll when drawer is open
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setDrawerOpen(false);
    }
    if (drawerOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", onKeyDown);
      return () => {
        document.body.style.overflow = "";
        window.removeEventListener("keydown", onKeyDown);
      };
    }
  }, [drawerOpen]);

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "var(--bg)",
      }}
    >
      {/* ── Desktop Sidebar ─────────────────────────────────────────── */}
      <aside
        style={{
          width: "240px",
          flexShrink: 0,
          background: "var(--surface)",
          borderRight: "1px solid var(--border)",
          display: "flex",
          flexDirection: "column",
          position: "sticky",
          top: 0,
          height: "100vh",
          overflowY: "auto",
        }}
        className="desktop-sidebar"
      >
        {/* Logo */}
        <div
          style={{
            padding: "1.25rem 1.25rem 1rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontSize: "1.375rem" }}>💰</span>
            <span
              style={{
                fontFamily: "Poppins, sans-serif",
                fontWeight: 700,
                fontSize: "1.125rem",
                color: "var(--primary)",
              }}
            >
              PocketLedger
            </span>
          </div>
          <ThemeToggle />
        </div>

        {/* Nav links */}
        <nav style={{ padding: "0.75rem 0.75rem", flex: 1 }}>
          {NAV.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "0.625rem 0.875rem",
                  borderRadius: "var(--radius-sm)",
                  marginBottom: "0.25rem",
                  fontWeight: active ? 600 : 400,
                  color: active ? "var(--primary)" : "var(--text)",
                  background: active ? "color-mix(in srgb, var(--primary) 10%, transparent)" : "transparent",
                  textDecoration: "none",
                  fontSize: "0.9375rem",
                  transition: "all 200ms",
                }}
              >
                <span style={{ fontSize: "1.125rem", lineHeight: 1 }}>{item.icon}</span>
                {item.label}
                {active && (
                  <div
                    style={{
                      width: "5px",
                      height: "5px",
                      borderRadius: "50%",
                      background: "var(--primary)",
                      marginLeft: "auto",
                    }}
                  />
                )}
              </Link>
            );
          })}

          <div style={{ margin: "0.75rem 0", height: "1px", background: "var(--border)" }} />

          <Link
            href="/settings"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              padding: "0.625rem 0.875rem",
              borderRadius: "var(--radius-sm)",
              color: pathname.startsWith("/settings") ? "var(--primary)" : "var(--text)",
              background: pathname.startsWith("/settings")
                ? "color-mix(in srgb, var(--primary) 10%, transparent)"
                : "transparent",
              textDecoration: "none",
              fontSize: "0.9375rem",
              fontWeight: pathname.startsWith("/settings") ? 600 : 400,
              transition: "all 200ms",
            }}
          >
            <span style={{ fontSize: "1.125rem" }}>⚙️</span>
            Settings
          </Link>
        </nav>

        {/* User profile + sign out */}
        <div
          style={{
            padding: "1rem 1.25rem",
            borderTop: "1px solid var(--border)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "0.625rem" }}>
            <div
              style={{
                width: "34px",
                height: "34px",
                borderRadius: "50%",
                background: `hsl(${hue}, 60%, 50%)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontWeight: 700,
                fontSize: "0.8rem",
                flexShrink: 0,
              }}
            >
              {initials(name)}
            </div>
            <div style={{ overflow: "hidden" }}>
              <p style={{ fontWeight: 600, fontSize: "0.875rem", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{name}</p>
              <p style={{ color: "var(--muted)", fontSize: "0.75rem", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{email}</p>
            </div>
          </div>
          <button
            id="btn-signout"
            className="btn btn-ghost btn-sm"
            style={{ width: "100%" }}
            onClick={() => signOut({ callbackUrl: "/" })}
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────────────────── */}
      <main className="app-main" style={{ flex: 1, minWidth: 0 }}>
        {/* Mobile Top Header with Hamburger and Brand */}
        <header
          className="mobile-top-header"
          style={{
            display: "none",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0.625rem 1rem",
            background: "var(--surface)",
            borderBottom: "1px solid var(--border)",
            position: "sticky",
            top: 0,
            zIndex: 30,
            minHeight: "56px",
          }}
        >
          {/* Left: Hamburger menu button + Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open Navigation Drawer"
              className="btn btn-ghost btn-sm"
              style={{
                width: "38px",
                height: "38px",
                padding: 0,
                fontSize: "1.25rem",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "var(--radius-sm)",
                background: "color-mix(in srgb, var(--surface-2) 60%, transparent)",
                border: "1px solid var(--border)",
                cursor: "pointer",
              }}
            >
              ☰
            </button>
            <Link
              href="/dashboard"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                textDecoration: "none",
              }}
            >
              <span style={{ fontSize: "1.25rem" }}>💰</span>
              <span
                style={{
                  fontFamily: "Poppins, sans-serif",
                  fontWeight: 700,
                  fontSize: "1.0625rem",
                  color: "var(--primary)",
                }}
              >
                PocketLedger
              </span>
            </Link>
          </div>

          {/* Right: Theme Toggle + Profile Button */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
            <ThemeToggle />
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              title="Open profile menu"
              aria-label="User profile menu"
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                background: `hsl(${hue}, 60%, 50%)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontWeight: 700,
                fontSize: "0.75rem",
                border: "none",
                cursor: "pointer",
                padding: 0,
              }}
            >
              {initials(name)}
            </button>
          </div>
        </header>

        {children}
      </main>

      {/* ── Mobile Navigation Drawer Backdrop ────────────────────────── */}
      {drawerOpen && (
        <div
          onClick={() => setDrawerOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.55)",
            backdropFilter: "blur(4px)",
            WebkitBackdropFilter: "blur(4px)",
            zIndex: 100,
            animation: "fadeIn 180ms ease-out",
          }}
          aria-hidden="true"
        />
      )}

      {/* ── Mobile Navigation Drawer Panel ───────────────────────────── */}
      <aside
        className="mobile-nav-drawer"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          width: "min(320px, 86vw)",
          background: "var(--surface)",
          borderRight: "1px solid var(--border)",
          boxShadow: drawerOpen ? "var(--shadow-xl)" : "none",
          zIndex: 101,
          display: "flex",
          flexDirection: "column",
          transform: drawerOpen ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 260ms cubic-bezier(0.16, 1, 0.3, 1)",
          overflowY: "auto",
          paddingBottom: "env(safe-area-inset-bottom, 1rem)",
        }}
        aria-label="Mobile Navigation Drawer"
      >
        {/* Drawer Header */}
        <div
          style={{
            padding: "1.125rem 1.25rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontSize: "1.375rem" }}>💰</span>
            <span
              style={{
                fontFamily: "Poppins, sans-serif",
                fontWeight: 700,
                fontSize: "1.125rem",
                color: "var(--primary)",
              }}
            >
              PocketLedger
            </span>
          </div>
          <button
            type="button"
            onClick={() => setDrawerOpen(false)}
            aria-label="Close menu"
            className="btn btn-ghost btn-sm"
            style={{
              width: "34px",
              height: "34px",
              padding: 0,
              fontSize: "1.125rem",
              borderRadius: "var(--radius-sm)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ✕
          </button>
        </div>

        {/* User Card */}
        <div
          style={{
            padding: "1rem 1.25rem",
            background: "color-mix(in srgb, var(--surface-2) 40%, transparent)",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
          }}
        >
          <div
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "50%",
              background: `hsl(${hue}, 60%, 50%)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontWeight: 700,
              fontSize: "0.95rem",
              flexShrink: 0,
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            }}
          >
            {initials(name)}
          </div>
          <div style={{ overflow: "hidden", flex: 1, minWidth: 0 }}>
            <p style={{ fontWeight: 600, fontSize: "0.9375rem", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {name}
            </p>
            <p style={{ color: "var(--muted)", fontSize: "0.78rem", margin: "0.15rem 0 0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {email}
            </p>
          </div>
        </div>

        {/* Navigation Section */}
        <div style={{ padding: "0.875rem 0.75rem", flex: 1 }}>
          <p
            style={{
              fontSize: "0.6875rem",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "var(--muted)",
              fontWeight: 600,
              padding: "0.25rem 0.625rem 0.5rem",
              margin: 0,
            }}
          >
            Navigation
          </p>

          {DRAWER_NAV.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setDrawerOpen(false)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.875rem",
                  padding: "0.75rem 0.875rem",
                  borderRadius: "var(--radius-sm)",
                  marginBottom: "0.25rem",
                  fontWeight: active ? 600 : 500,
                  color: active ? "var(--primary)" : "var(--text)",
                  background: active ? "color-mix(in srgb, var(--primary) 12%, transparent)" : "transparent",
                  textDecoration: "none",
                  fontSize: "0.9375rem",
                  transition: "all 150ms",
                }}
              >
                <span style={{ fontSize: "1.25rem", lineHeight: 1 }}>{item.icon}</span>
                <span style={{ flex: 1 }}>{item.label}</span>
                {active && (
                  <div
                    style={{
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      background: "var(--primary)",
                    }}
                  />
                )}
              </Link>
            );
          })}

          <div style={{ margin: "0.875rem 0", height: "1px", background: "var(--border)" }} />

          {/* Quick Actions in Drawer */}
          <p
            style={{
              fontSize: "0.6875rem",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "var(--muted)",
              fontWeight: 600,
              padding: "0.25rem 0.625rem 0.5rem",
              margin: 0,
            }}
          >
            Quick Actions
          </p>

          <Link
            href="/ledger/new?direction=I_GAVE"
            onClick={() => setDrawerOpen(false)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              padding: "0.625rem 0.875rem",
              borderRadius: "var(--radius-sm)",
              marginBottom: "0.25rem",
              color: "var(--income)",
              textDecoration: "none",
              fontSize: "0.875rem",
              fontWeight: 500,
              background: "color-mix(in srgb, var(--income) 10%, transparent)",
            }}
          >
            <span>💸</span>
            <span>Lend Money (I Gave)</span>
          </Link>

          <Link
            href="/ledger/new?direction=I_BORROWED"
            onClick={() => setDrawerOpen(false)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              padding: "0.625rem 0.875rem",
              borderRadius: "var(--radius-sm)",
              marginBottom: "0.25rem",
              color: "var(--expense)",
              textDecoration: "none",
              fontSize: "0.875rem",
              fontWeight: 500,
              background: "color-mix(in srgb, var(--expense) 10%, transparent)",
            }}
          >
            <span>🤲</span>
            <span>Borrow Money (I Borrowed)</span>
          </Link>
        </div>

        {/* Drawer Footer: Theme switch & Sign out */}
        <div
          style={{
            padding: "1rem 1.25rem",
            borderTop: "1px solid var(--border)",
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0.375rem 0",
            }}
          >
            <span style={{ fontSize: "0.875rem", color: "var(--muted)" }}>Toggle Theme</span>
            <ThemeToggle />
          </div>

          <button
            type="button"
            className="btn btn-ghost btn-sm"
            style={{ width: "100%", justifyContent: "center", gap: "0.5rem", color: "var(--expense)" }}
            onClick={() => signOut({ callbackUrl: "/" })}
          >
            <span>🚪</span>
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Mobile Bottom Navigation Bar ─────────────────────────────── */}
      <nav
        className="mobile-bottom-nav"
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          background: "var(--surface)",
          borderTop: "1px solid var(--border)",
          display: "flex",
          zIndex: 40,
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
          boxShadow: "0 -2px 10px rgba(0, 0, 0, 0.05)",
        }}
      >
        {NAV.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "2px",
                padding: "0.625rem 0",
                textDecoration: "none",
                color: active ? "var(--primary)" : "var(--muted)",
                fontSize: "0.6875rem",
                fontWeight: active ? 600 : 400,
                transition: "color 150ms",
              }}
            >
              <span style={{ fontSize: "1.25rem", lineHeight: 1 }}>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Global Quick Action Floating Speed-Dial */}
      <QuickActionFab />

      <style>{`
        @media (min-width: 1024px) {
          .mobile-bottom-nav { display: none !important; }
          .mobile-top-header { display: none !important; }
          .mobile-nav-drawer { display: none !important; }
          .desktop-sidebar { display: flex !important; }
          .app-main { padding-bottom: 2rem !important; }
        }
        @media (max-width: 1023px) {
          .desktop-sidebar { display: none !important; }
          .mobile-top-header { display: flex !important; }
          .app-main { padding-bottom: 6rem !important; }
        }
      `}</style>
    </div>
  );
}
