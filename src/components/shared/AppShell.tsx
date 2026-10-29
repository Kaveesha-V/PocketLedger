"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { initials, stringToHue } from "@/lib/format";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

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

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const name = session?.user?.name ?? "User";
  const email = session?.user?.email ?? "";
  const hue = stringToHue(name);

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
      <main style={{ flex: 1, minWidth: 0, paddingBottom: "5rem" }}>
        {/* Mobile Top Header */}
        <header
          className="mobile-top-header"
          style={{
            display: "none",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0.875rem 1.25rem",
            background: "var(--surface)",
            borderBottom: "1px solid var(--border)",
            position: "sticky",
            top: 0,
            zIndex: 30,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
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
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <ThemeToggle />
          </div>
        </header>

        {children}
      </main>

      {/* ── Mobile Bottom Navigation ─────────────────────────────────── */}
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
                fontSize: "0.625rem",
                fontWeight: active ? 600 : 400,
                transition: "color 200ms",
              }}
            >
              <span style={{ fontSize: "1.25rem", lineHeight: 1 }}>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <style>{`
        @media (min-width: 1024px) {
          .mobile-bottom-nav { display: none !important; }
          .mobile-top-header { display: none !important; }
          .desktop-sidebar { display: flex !important; }
        }
        @media (max-width: 1023px) {
          .desktop-sidebar { display: none !important; }
          .mobile-top-header { display: flex !important; }
        }
      `}</style>
    </div>
  );
}
