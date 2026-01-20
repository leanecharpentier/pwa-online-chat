"use client";

import { useEffect, useState } from "react";
import {
  getSubscriptions,
  sendNotification,
  subscribeUser,
  unsubscribeUser,
} from "./actions";
import { logger } from "@/lib/logger";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function PushNotificationManager() {
  const [isSupported, setIsSupported] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(
    null
  );
  const [message, setMessage] = useState("");
  const [userId, setUserId] = useState<string>("");

  useEffect(() => {
    if ("serviceWorker" in navigator && "PushManager" in window) {
      setIsSupported(true);
      registerServiceWorker();
    }

    // Générer ou récupérer l'ID utilisateur
    let storedUserId = localStorage.getItem("userId");
    if (!storedUserId) {
      storedUserId = crypto.randomUUID();
      localStorage.setItem("userId", storedUserId);
    }
    setUserId(storedUserId);
  }, []);

  async function registerServiceWorker() {
    const registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
      updateViaCache: "none",
    });
    const sub = await registration.pushManager.getSubscription();
    setSubscription(sub);
  }

  async function subscribeToPush() {
    if (!userId) return;

    const registration = await navigator.serviceWorker.ready;
    const sub = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
      ),
    });
    setSubscription(sub);

    // Convertir la subscription au bon format
    const subscriptionData = {
      endpoint: sub.endpoint,
      expirationTime: sub.expirationTime,
      keys: {
        p256dh: btoa(
          String.fromCharCode(...new Uint8Array(sub.getKey("p256dh")!))
        ),
        auth: btoa(String.fromCharCode(...new Uint8Array(sub.getKey("auth")!))),
      },
    };

    try {
      const result = await subscribeUser(userId, subscriptionData);
      if (!result.success) {
        logger.error("Error subscribing user:", result.error);
        alert(`Error subscribing: ${result.error}`);
      }
    } catch (error) {
      logger.error("Error subscribing user:", error);
      alert(`Error subscribing: ${error}`);
    }
  }

  async function unsubscribeFromPush() {
    if (!userId) return;

    await subscription?.unsubscribe();
    setSubscription(null);
    await unsubscribeUser(userId);
  }

  async function sendTestNotification() {
    if (subscription && userId && message) {
      try {
        const result = await sendNotification(userId, message);
        if (!result.success) {
          logger.error("Failed to send notification:", result.error);
          alert(`Failed to send notification: ${result.error}`);
        }
        setMessage("");
      } catch (error) {
        logger.error("Error sending notification:", error);
        alert(`Error: ${error}`);
      }
    }
  }

  async function checkSubscriptions() {
    try {
      const subs = await getSubscriptions();
      alert(
        `Active subscriptions: ${
          subs.count
        }\nUser IDs: ${subs.userIds.join(", ")}`
      );
    } catch (error) {
      logger.error("Error checking subscriptions:", error);
    }
  }

  if (!isSupported) {
    return <p>Push notifications are not supported in this browser.</p>;
  }

  if (!userId) {
    return <p>Loading...</p>;
  }

  return (
    <div>
      <h3>Push Notifications</h3>
      <p>
        <small>User ID: {userId}</small>
      </p>
      {subscription ? (
        <>
          <p>You are subscribed to push notifications.</p>
          <button onClick={unsubscribeFromPush}>Unsubscribe</button>
          <input
            type="text"
            placeholder="Enter notification message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <button onClick={sendTestNotification}>Send Test</button>
          <button onClick={checkSubscriptions}>Check Subscriptions</button>
        </>
      ) : (
        <>
          <p>You are not subscribed to push notifications.</p>
          <button onClick={subscribeToPush}>Subscribe</button>
        </>
      )}
    </div>
  );
}

function InstallPrompt() {
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    setIsIOS(
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !("MSStream" in window)
    );

    setIsStandalone(window.matchMedia("(display-mode: standalone)").matches);
  }, []);

  if (isStandalone) {
    return null; // Don't show install button if already installed
  }

  return (
    <div>
      <h3>Install App</h3>
      <button>Add to Home Screen</button>
      {isIOS && (
        <p>
          To install this app on your iOS device, tap the share button
          <span role="img" aria-label="share icon">
            {" "}
            ⎋{" "}
          </span>
          and then &quot;Add to Home Screen&quot;
          <span role="img" aria-label="plus icon">
            {" "}
            ➕{" "}
          </span>
          .
        </p>
      )}
    </div>
  );
}

export default function Page() {
  return (
    <div className="h-full p-4">
      <PushNotificationManager />
      <InstallPrompt />
    </div>
  );
}
