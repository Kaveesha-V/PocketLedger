"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Download, Share, PlusSquare, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [platform, setPlatform] = useState<"native" | "ios" | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [showIosSteps, setShowIosSteps] = useState(false);

  useEffect(() => {
    // 1. Register the service worker
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker.register("/sw.js").catch((err) => {
          console.warn("PWA ServiceWorker registration failed:", err);
        });
      });
    }

    // 2. Helper: Check if app is already running in standalone mode
    function isRunningStandalone(): boolean {
      if (typeof window === "undefined") return false;
      const isStandaloneMedia = window.matchMedia("(display-mode: standalone)").matches;
      const isStandaloneNavigator =
        (window.navigator as unknown as { standalone?: boolean }).standalone === true;
      const isAndroidApp = document.referrer.startsWith("android-app://");
      return isStandaloneMedia || isStandaloneNavigator || isAndroidApp;
    }

    // If already running standalone or installed, don't show the banner
    if (isRunningStandalone()) {
      return;
    }

    // 3. Helper: Check if user previously dismissed or installed
    const dismissed = localStorage.getItem("pl_pwa_install_dismissed");
    const alreadyInstalled = localStorage.getItem("pl_pwa_installed");
    if (dismissed === "true" || alreadyInstalled === "true") {
      return;
    }

    // 4. Capture native 'beforeinstallprompt' on Windows, Android, Chromium, Edge
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setPlatform("native");
      setShowPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // 5. Detect iOS Safari (does not fire 'beforeinstallprompt')
    const ua = window.navigator.userAgent;
    const isIos = /iPhone|iPad|iPod/i.test(ua) && !(window as unknown as { MSStream?: unknown }).MSStream;
    const isSafari = /Safari/i.test(ua) && !/Chrome|CriOS|FxiOS|EdgiOS/i.test(ua);

    if (isIos && isSafari && !isRunningStandalone()) {
      setPlatform("ios");
      setShowPrompt(true);
    }

    // 6. Listen for successful installation event
    const handleAppInstalled = () => {
      setShowPrompt(false);
      setDeferredPrompt(null);
      try {
        localStorage.setItem("pl_pwa_installed", "true");
      } catch {}
    };

    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleDismiss = () => {
    setShowPrompt(false);
    try {
      localStorage.setItem("pl_pwa_install_dismissed", "true");
    } catch {}
  };

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setShowPrompt(false);
        setDeferredPrompt(null);
        try {
          localStorage.setItem("pl_pwa_installed", "true");
        } catch {}
      }
    } catch (err) {
      console.error("Install prompt error:", err);
    }
  };

  if (!showPrompt || !platform) {
    return null;
  }

  return (
    <aside
      className="pwa-install-banner animate-slide-up"
      role="banner"
      aria-label="Install PocketLedger Application"
      style={{
        position: "fixed",
        zIndex: 85,
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius)",
        boxShadow: "0 12px 36px rgba(0, 0, 0, 0.45)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        color: "var(--text)",
        overflow: "hidden",
      }}
    >
      <div style={{ padding: "1rem 1.125rem", position: "relative" }}>
        {/* Close / Dismiss button */}
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss install prompt"
          title="Dismiss"
          style={{
            position: "absolute",
            top: "0.75rem",
            right: "0.75rem",
            background: "var(--surface-2)",
            border: "1px solid var(--border)",
            borderRadius: "50%",
            width: "28px",
            height: "28px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--muted)",
            cursor: "pointer",
            padding: 0,
            transition: "all var(--transition)",
          }}
        >
          <X size={15} />
        </button>

        {/* Header: App icon + App title & description */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: "0.875rem", paddingRight: "1.75rem" }}>
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "12px",
              overflow: "hidden",
              flexShrink: 0,
              boxShadow: "0 4px 12px color-mix(in srgb, var(--primary) 35%, transparent)",
              position: "relative",
            }}
          >
            <Image
              src="/icon-192.png"
              alt="PocketLedger App Icon"
              width={44}
              height={44}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>

          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
              <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, color: "var(--text)" }}>
                Install PocketLedger
              </h4>
            </div>
            <p style={{ margin: "0.2rem 0 0", fontSize: "0.78rem", color: "var(--muted)", lineHeight: 1.4 }}>
              Fast standalone app experience, offline access, and instant reminder notifications.
            </p>
          </div>
        </div>

        {/* Platform-Specific Actions */}
        {platform === "native" && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginTop: "0.875rem" }}>
            <button
              type="button"
              onClick={handleInstallClick}
              className="btn btn-primary btn-sm"
              style={{
                flex: 1,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.45rem",
                fontWeight: 600,
              }}
            >
              <Download size={15} />
              Install App
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              className="btn btn-ghost btn-sm"
              style={{ fontSize: "0.8125rem", color: "var(--muted)" }}
            >
              Not now
            </button>
          </div>
        )}

        {platform === "ios" && (
          <div style={{ marginTop: "0.875rem" }}>
            {!showIosSteps ? (
              <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                <button
                  type="button"
                  onClick={() => setShowIosSteps(true)}
                  className="btn btn-primary btn-sm"
                  style={{
                    flex: 1,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.45rem",
                    fontWeight: 600,
                  }}
                >
                  <Share size={15} />
                  See How to Install
                </button>
                <button
                  type="button"
                  onClick={handleDismiss}
                  className="btn btn-ghost btn-sm"
                  style={{ fontSize: "0.8125rem", color: "var(--muted)" }}
                >
                  Not now
                </button>
              </div>
            ) : (
              <div
                style={{
                  background: "var(--surface-2)",
                  padding: "0.75rem",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--border)",
                  fontSize: "0.8rem",
                  lineHeight: 1.5,
                }}
              >
                <p style={{ fontWeight: 600, margin: "0 0 0.5rem", color: "var(--primary)" }}>
                  Follow these 2 quick steps:
                </p>
                <ol style={{ margin: 0, paddingLeft: "1.25rem", display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                  <li>
                    Tap the <strong>Share</strong> button <Share size={13} style={{ display: "inline", verticalAlign: "-2px", color: "var(--primary)" }} /> in Safari&apos;s toolbar.
                  </li>
                  <li>
                    Scroll down and select <strong>&quot;Add to Home Screen&quot;</strong> <PlusSquare size={13} style={{ display: "inline", verticalAlign: "-2px", color: "var(--primary)" }} />.
                  </li>
                </ol>
                <div style={{ marginTop: "0.625rem", textAlign: "right" }}>
                  <button
                    type="button"
                    onClick={handleDismiss}
                    className="btn btn-ghost btn-sm"
                    style={{ fontSize: "0.75rem", padding: "0.2rem 0.5rem", minHeight: "28px" }}
                  >
                    Got it!
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        .pwa-install-banner {
          left: 0.875rem;
          right: 0.875rem;
          max-width: 440px;
          margin: 0 auto;
        }
        @media (min-width: 1024px) {
          .pwa-install-banner {
            left: auto;
            right: 1.5rem;
            bottom: 1.5rem;
            width: 380px;
          }
        }
        @media (max-width: 1023px) {
          .pwa-install-banner {
            bottom: calc(4.75rem + env(safe-area-inset-bottom, 0px));
          }
        }
      `}</style>
    </aside>
  );
}

