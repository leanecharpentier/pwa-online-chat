"use server";

import webpush from "web-push";

// Stockage temporaire des subscriptions (en production, utilisez une base de données)
const subscriptions = new Map<string, webpush.PushSubscription>();

// Initialisation paresseuse de VAPID
let vapidInitialized = false;

function initializeVapid() {
    if (!vapidInitialized) {
        const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        const privateKey = process.env.VAPID_PRIVATE_KEY;
        const email =
            process.env.VAPID_EMAIL || "mailto:leanecharpentierpro@outlook.com";

        if (!publicKey || !privateKey) {
            console.warn("VAPID keys not found in environment variables");
            return false;
        }

        webpush.setVapidDetails(email, publicKey, privateKey);
        vapidInitialized = true;
    }
    return true;
}

export async function subscribeUser(
    userId: string,
    sub: {
        endpoint: string;
        expirationTime?: number | null;
        keys: {
            p256dh: string;
            auth: string;
        };
    }
) {
    if (!initializeVapid()) {
        return { success: false, error: "VAPID not configured" };
    }

    console.log(`Subscribing user ${userId}`, { endpoint: sub.endpoint });
    const subscription = {
        endpoint: sub.endpoint,
        expirationTime: sub.expirationTime,
        keys: {
            p256dh: sub.keys.p256dh,
            auth: sub.keys.auth,
        },
    };
    subscriptions.set(userId, subscription);
    console.log(`Total subscriptions: ${subscriptions.size}`);
    return { success: true };
}

export async function unsubscribeUser(userId: string) {
    subscriptions.delete(userId);
    return { success: true };
}

export async function sendNotification(userId: string, message: string) {
    if (!initializeVapid()) {
        return { success: false, error: "VAPID not configured" };
    }

    console.log(`Attempting to send notification to user ${userId}`);
    console.log(
        `Available subscriptions: ${Array.from(subscriptions.keys()).join(
            ", "
        )}`
    );

    const subscription = subscriptions.get(userId);
    if (!subscription) {
        console.error(`No subscription found for user ${userId}`);
        console.error(
            `Available users: [${Array.from(subscriptions.keys()).join(", ")}]`
        );
        return {
            success: false,
            error: `No subscription available for user ${userId}. Available users: [${Array.from(
                subscriptions.keys()
            ).join(", ")}]`,
        };
    }

    try {
        await webpush.sendNotification(
            subscription,
            JSON.stringify({
                title: "Test Notification",
                body: message,
                icon: "/next.svg",
            })
        );
        return { success: true };
    } catch (error) {
        console.error("Error sending push notification:", error);
        return { success: false, error: "Failed to send notification" };
    }
}

export async function sendNotificationToAll(message: string) {
    if (!initializeVapid()) {
        return { success: false, error: "VAPID not configured" };
    }

    const results: { userId: string; success: boolean; error?: string }[] = [];

    for (const [userId, subscription] of subscriptions.entries()) {
        try {
            await webpush.sendNotification(
                subscription,
                JSON.stringify({
                    title: "Chat Notification",
                    body: message,
                    icon: "/next.svg",
                })
            );
            results.push({ userId, success: true });
        } catch (error) {
            console.error(
                `Error sending push notification to ${userId}:`,
                error
            );
            results.push({
                userId,
                success: false,
                error: "Failed to send notification",
            });
        }
    }

    return { results, totalSent: results.filter((r) => r.success).length };
}

export async function getSubscriptions() {
    const activeSubscriptions = Array.from(subscriptions.keys());
    console.log(
        `Active subscriptions: ${activeSubscriptions.length}`,
        activeSubscriptions
    );
    return {
        count: activeSubscriptions.length,
        userIds: activeSubscriptions,
    };
}
