"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { handleAppSignOut } from "@/lib/logout";
import { initials, stringToHue } from "@/lib/format";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { QuickActionFab } from "@/components/ui/QuickActionFab";
import {
  Home,
  BarChart3,
  Users,
  Bell,
  TrendingUp,
  Settings,
  Wallet,
  Menu,
  X,
  ArrowUpRight,
  ArrowDownLeft,
  LogOut,
  ChevronRight,
} from "lucide-react";

interface NavItem {
  href: string;
  icon: typeof Home;
  label: string;
}

const NAV: NavItem[] = [
  { href: "/dashboard",  icon: Home,        label: "Home"     },
  { href: "/budget",     icon: BarChart3,   label: "Budget"   },
  { href: "/friends",    icon: Users,       label: "Friends"  },
  { href: "/reminders",  icon: Bell,        label: "Remind"   },
  { href: "/reports",    icon: TrendingUp,  label: "Reports"  },
];

const DRAWER_NAV: NavItem[] = [
  { href: "/dashboard", icon: Home,        label: "Dashboard / Home" },
  { href: "/budget",    icon: BarChart3,   label: "Budget Sheet" },
  { href: "/friends",   icon: Users,       label: "Friends & Ledger" },
  { href: "/reminders", icon: Bell,        label: "Reminders & WhatsApp" },
  { href: "/reports",   icon: TrendingUp,  label: "Reports & Insights" },
  { href: "/settings",  icon: Settings,    label: "Settings & Categories" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);

  const name = session?.user?.name ?? "User";
  const email = session?.user?.email ?? "";
  const hue = stringToHue(name);

  // Account-switch safety: wipe stale caches if a different user logs in
  useEffect(() => {
    if (session?.user?.id) {
      try {
        const lastUserId = localStorage.getItem("pl_active_user_id");
        if (lastUserId && lastUserId !== session.user.id) {
          const theme = localStorage.getItem("pl_theme");
          localStorage.clear();
          sessionStorage.clear();
          if (theme) localStorage.setItem("pl_theme", theme);
        }
        localStorage.setItem("pl_active_user_id", session.user.id);
      } catch {}
    }
  }, [session?.user?.id]);

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
        flexDirection: "column",
        minHeight: "100vh",
        background: "var(--bg)",
      }}
    >
      {/* ── Top Bar (Both PC & Mobile with 3-Lines Navigation Menu) ─── */}
      <header
        className="app-top-header"
        style={{
          minHeight: "calc(58px + env(safe-area-inset-top, 0px))",
          position: "sticky",
          top: 0,
          zIndex: 40,
          background: "var(--surface)",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "env(safe-area-inset-top, 0px) 1rem 0",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
        }}
      >
        {/* Left: 3-Lines Navigation Button + Brand Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          {/* 3-Lines Menu Button for PC (collapses sidebar) and Mobile (opens drawer) */}
          <button
            type="button"
            onClick={() => {
              if (window.innerWidth >= 1024) {
                setDesktopSidebarOpen((prev) => !prev);
              } else {
                setDrawerOpen(true);
              }
            }}
            aria-label="Toggle navigation menu"
            title="Toggle Navigation (3 Lines)"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "40px",
              height: "40px",
              borderRadius: "var(--radius-sm)",
              background: "var(--surface-2)",
              border: "1px solid var(--border)",
              color: "var(--text)",
              cursor: "pointer",
              padding: 0,
              transition: "all var(--transition)",
            }}
          >
            <Menu size={20} />
          </button>

          {/* Brand Logo with vector Wallet icon */}
          <Link
            href="/dashboard"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.625rem",
              textDecoration: "none",
            }}
          >
            <div
              style={{
                width: "34px",
                height: "34px",
                borderRadius: "10px",
                background: "linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                boxShadow: "0 2px 8px color-mix(in srgb, var(--primary) 35%, transparent)",
              }}
            >
              <Wallet size={18} />
            </div>
            <span
              style={{
                fontFamily: "Poppins, sans-serif",
                fontWeight: 700,
                fontSize: "1.125rem",
                background: "linear-gradient(135deg, var(--text) 0%, var(--primary) 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                letterSpacing: "-0.01em",
              }}
            >
              PocketLedger
            </span>
          </Link>
        </div>

        {/* Right: Theme Toggle + User Profile */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            title="Open user menu"
            aria-label="User profile menu"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.625rem",
              background: "var(--surface-2)",
              border: "1px solid var(--border)",
              borderRadius: "9999px",
              padding: "0.25rem 0.625rem 0.25rem 0.25rem",
              cursor: "pointer",
              color: "var(--text)",
            }}
          >
            <div
              style={{
                width: "30px",
                height: "30px",
                borderRadius: "50%",
                background: `linear-gradient(135deg, hsl(${hue}, 65%, 55%), var(--primary))`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontWeight: 700,
                fontSize: "0.75rem",
              }}
            >
              {initials(name)}
            </div>
            <span className="desktop-only-name" style={{ fontSize: "0.85rem", fontWeight: 600 }}>
              {name.split(" ")[0]}
            </span>
          </button>
        </div>
      </header>

      {/* ── App Shell Body: Sidebar + Main Content ───────────────────── */}
      <div style={{ display: "flex", flex: 1, position: "relative" }}>
        {/* ── Desktop Collapsible Sidebar ───────────────────────────── */}
        <aside
          className={`desktop-sidebar ${desktopSidebarOpen ? "desktop-sidebar-expanded" : "desktop-sidebar-collapsed"}`}
          style={{
            width: desktopSidebarOpen ? "240px" : "0px",
            flexShrink: 0,
            background: "var(--surface)",
            borderRight: desktopSidebarOpen ? "1px solid var(--border)" : "none",
            display: "flex",
            flexDirection: "column",
            position: "sticky",
            top: "60px",
            height: "calc(100vh - 60px)",
            overflowY: "auto",
            overflowX: "hidden",
            transition: "width 240ms cubic-bezier(0.16, 1, 0.3, 1)",
            zIndex: 30,
          }}
        >
          {/* Nav links */}
          <nav style={{ padding: "1rem 0.75rem", flex: 1, minWidth: "240px" }}>
            <p
              style={{
                fontSize: "0.6875rem",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "var(--muted)",
                fontWeight: 600,
                padding: "0 0.75rem 0.5rem",
                margin: 0,
              }}
            >
              Menu
            </p>

            {NAV.map((item) => {
              const active = pathname.startsWith(item.href);
              const Icon = item.icon;
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
                    fontWeight: active ? 600 : 500,
                    color: active ? "var(--primary)" : "var(--text)",
                    background: active ? "color-mix(in srgb, var(--primary) 12%, transparent)" : "transparent",
                    textDecoration: "none",
                    fontSize: "0.9375rem",
                    transition: "all var(--transition)",
                  }}
                >
                  <Icon size={18} style={{ color: active ? "var(--primary)" : "var(--muted)" }} />
                  <span>{item.label}</span>
                  {active && (
                    <div
                      style={{
                        width: "6px",
                        height: "6px",
                        borderRadius: "50%",
                        background: "var(--primary)",
                        marginLeft: "auto",
                      }}
                    />
                  )}
                </Link>
              );
            })}

            <div style={{ margin: "0.875rem 0", height: "1px", background: "var(--border)" }} />

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
                  ? "color-mix(in srgb, var(--primary) 12%, transparent)"
                  : "transparent",
                textDecoration: "none",
                fontSize: "0.9375rem",
                fontWeight: pathname.startsWith("/settings") ? 600 : 500,
                transition: "all var(--transition)",
              }}
            >
              <Settings size={18} style={{ color: pathname.startsWith("/settings") ? "var(--primary)" : "var(--muted)" }} />
              <span>Settings</span>
            </Link>
          </nav>

          {/* User profile + sign out */}
          <div
            style={{
              padding: "1rem 1.25rem",
              borderTop: "1px solid var(--border)",
              minWidth: "240px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "0.75rem" }}>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  background: `linear-gradient(135deg, hsl(${hue}, 65%, 55%), var(--primary))`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: "0.85rem",
                  flexShrink: 0,
                }}
              >
                {initials(name)}
              </div>
              <div style={{ overflow: "hidden" }}>
                <p style={{ fontWeight: 600, fontSize: "0.875rem", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {name}
                </p>
                <p style={{ color: "var(--muted)", fontSize: "0.75rem", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {email}
                </p>
              </div>
            </div>
            <button
              id="btn-signout"
              className="btn btn-ghost btn-sm"
              style={{ width: "100%", justifyContent: "center", gap: "0.5rem" }}
              onClick={() => handleAppSignOut("/auth/login")}
            >
              <LogOut size={15} />
              Sign out
            </button>
          </div>
        </aside>

        {/* ── Main content view ──────────────────────────────────────── */}
        <main className="app-main" style={{ flex: 1, minWidth: 0 }}>
          {children}
        </main>
      </div>

      {/* ── Slide-Out Navigation Drawer ──────────────────────────────── */}
      {drawerOpen && (
        <div
          onClick={() => setDrawerOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            backdropFilter: "blur(4px)",
            WebkitBackdropFilter: "blur(4px)",
            zIndex: 100,
            animation: "fadeIn 180ms ease-out",
          }}
          aria-hidden="true"
        />
      )}

      <aside
        className="mobile-nav-drawer"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          height: "100dvh",
          maxHeight: "100dvh",
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
          WebkitOverflowScrolling: "touch",
          overscrollBehavior: "contain",
          paddingBottom: "env(safe-area-inset-bottom, 1rem)",
        }}
        aria-label="Navigation Drawer"
      >
        {/* Drawer Header (sticky at top of drawer) */}
        <div
          style={{
            position: "sticky",
            top: 0,
            background: "var(--surface)",
            zIndex: 2,
            padding: "1.125rem 1.25rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "10px",
                background: "linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
              }}
            >
              <Wallet size={16} />
            </div>
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
              borderRadius: "var(--radius-sm)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* User Card */}
        <div
          style={{
            padding: "1rem 1.25rem",
            background: "var(--surface-2)",
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
              background: `linear-gradient(135deg, hsl(${hue}, 65%, 55%), var(--primary))`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontWeight: 700,
              fontSize: "0.95rem",
              flexShrink: 0,
              boxShadow: "0 4px 12px rgba(139, 92, 246, 0.3)",
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
            const Icon = item.icon;
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
                <Icon size={18} style={{ color: active ? "var(--primary)" : "var(--muted)" }} />
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
            <ArrowUpRight size={16} />
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
            <ArrowDownLeft size={16} />
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
            onClick={() => handleAppSignOut("/auth/login")}
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Mobile Floating Dock Navigation Bar (Styles 03, 05, 11 from Image 4) ─── */}
      <nav
        className="mobile-floating-dock-nav"
        style={{
          position: "fixed",
          bottom: "calc(0.75rem + env(safe-area-inset-bottom, 0px))",
          left: "0.75rem",
          right: "0.75rem",
          maxWidth: "440px",
          margin: "0 auto",
          background: "color-mix(in srgb, var(--surface) 92%, var(--bg))",
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
          border: "1px solid var(--border)",
          borderRadius: "9999px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0.35rem 0.5rem",
          zIndex: 50,
          boxShadow: "0 12px 32px rgba(0, 0, 0, 0.45)",
        }}
        aria-label="Bottom Navigation"
      >
        {NAV.map((item) => {
          const active = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "2px",
                padding: active ? "0.45rem 0.5rem" : "0.45rem 0.25rem",
                textDecoration: "none",
                borderRadius: "9999px",
                color: active ? "var(--primary)" : "var(--muted)",
                background: active ? "color-mix(in srgb, var(--primary) 18%, transparent)" : "transparent",
                fontSize: "0.7rem",
                fontWeight: active ? 600 : 500,
                transition: "all 180ms ease",
              }}
            >
              <Icon size={18} strokeWidth={active ? 2.3 : 1.8} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Global Quick Action Floating Speed-Dial */}
      <QuickActionFab />

      <style>{`
        @media (min-width: 1024px) {
          .mobile-floating-dock-nav { display: none !important; }
          .mobile-nav-drawer { display: none !important; }
          .app-main { padding-bottom: 2rem !important; }
          .desktop-only-name { display: inline !important; }
        }
        @media (max-width: 1023px) {
          .desktop-sidebar { display: none !important; }
          .app-main { padding-bottom: calc(7.5rem + env(safe-area-inset-bottom, 0px)) !important; }
          .desktop-only-name { display: none !important; }
        }
      `}</style>
    </div>
  );
}
