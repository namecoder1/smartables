"use client";

import { useEffect } from "react";

const STORAGE_KEY = "smartables-push-registered";

/**
 * Silently subscribes the PWA to Web Push notifications using VAPID.
 * - Runs once per browser/device (tracked in localStorage).
 * - Only activates when the browser supports push AND the user has
 *   already granted (or not yet decided on) notification permission.
 * - Does NOT show a permission prompt itself — the browser will prompt
 *   the first time if permission is "default".
 */
export function PushSubscription() {
  useEffect(() => {
    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidPublicKey) return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

    // Skip if already registered on this device
    if (localStorage.getItem(STORAGE_KEY) === "1") return;

    // Don't ask if the user has explicitly denied
    if (Notification.permission === "denied") return;

    async function subscribe() {
      try {
        const registration = await navigator.serviceWorker.ready;

        // Request permission (browser shows native prompt if "default")
        const permission = await Notification.requestPermission();
        if (permission !== "granted") return;

        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey!),
        });

        const res = await fetch("/api/push/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            platform: "web",
            subscription: subscription.toJSON(),
          }),
        });

        if (res.ok) {
          localStorage.setItem(STORAGE_KEY, "1");
        }
      } catch {
        // Non-blocking — push is optional
      }
    }

    subscribe();
  }, []);

  return null;
}

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const arr = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) arr[i] = rawData.charCodeAt(i);
  return arr.buffer as ArrayBuffer;
}
