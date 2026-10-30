import { signOut } from "next-auth/react";

/**
 * Perform a clean, cross-platform sign out:
 * 1. Post message to Service Worker to purge any cached responses
 * 2. Purge window.caches (CacheStorage)
 * 3. Clear localStorage (preserving user's UI theme)
 * 4. Clear sessionStorage
 * 5. Invalidate NextAuth client-side session cookies
 * 6. Invoke next-auth signOut with redirect
 */
export async function handleAppSignOut(callbackUrl = "/auth/login") {
  if (typeof window !== "undefined") {
    // 1. Tell Service Worker to purge its cache
    try {
      if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: "CLEAR_USER_CACHE" });
      }
    } catch (e) {
      console.warn("Could not message service worker:", e);
    }

    // 2. Clear all entries in CacheStorage
    try {
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
    } catch (e) {
      console.warn("Could not clear CacheStorage:", e);
    }

    // 3. Clear localStorage, preserving only theme preference
    try {
      const savedTheme = localStorage.getItem("pl_theme");
      localStorage.clear();
      if (savedTheme) {
        localStorage.setItem("pl_theme", savedTheme);
      }
    } catch (e) {
      console.warn("Could not clear localStorage:", e);
    }

    // 4. Clear sessionStorage
    try {
      sessionStorage.clear();
    } catch (e) {
      console.warn("Could not clear sessionStorage:", e);
    }

    // 5. Invalidate client-side NextAuth cookies as defensive layer
    try {
      const cookieNames = [
        "next-auth.session-token",
        "__Secure-next-auth.session-token",
        "next-auth.csrf-token",
        "__Host-next-auth.csrf-token",
        "next-auth.callback-url",
        "__Secure-next-auth.callback-url",
        "authjs.session-token",
        "__Secure-authjs.session-token",
        "authjs.csrf-token",
        "authjs.callback-url",
      ];
      for (const name of cookieNames) {
        document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0;`;
      }
    } catch (e) {
      console.warn("Could not clear client cookies:", e);
    }
  }

  // 6. Execute NextAuth signOut redirect
  await signOut({ callbackUrl, redirect: true });
}
