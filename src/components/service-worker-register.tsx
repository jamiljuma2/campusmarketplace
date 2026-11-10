"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").then((registration) => {
        if (navigator.onLine) {
          void navigator.serviceWorker.ready.then((readyRegistration) => {
            readyRegistration.active?.postMessage({ type: "CACHE_PUBLIC_HOME" });
          });
        }
        return registration;
      }).catch(() => {
        // The site remains fully usable when service worker registration is unavailable.
      });
    }
  }, []);

  return null;
}
