// src/app/api/send-notification/route.ts
import { NextResponse } from 'next/server';
import webPush, { type PushSubscription } from 'web-push';
import { readDb } from '@/lib/database-utils';
import * as path from 'path';

interface NotificationPayload {
  title: string;
  body: string;
  url?: string;
}

interface SubscriptionRecord {
    userId: string;
    subscription: PushSubscription;
}

const SUBSCRIPTION_DB_PATH = path.resolve(process.cwd(), 'src', 'database', 'subscriptions.json');

// Initialize VAPID keys within the API route to ensure they are loaded
if (process.env.VAPID_PRIVATE_KEY && process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
    try {
        webPush.setVapidDetails(
            process.env.VAPID_SUBJECT || 'mailto:admin@example.com',
            process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
            process.env.VAPID_PRIVATE_KEY
        );
        console.log("[API/SendNotification] VAPID keys loaded successfully.");
    } catch (error) {
        console.error("[API/SendNotification] CRITICAL: Failed to load VAPID keys. Push notifications will fail.", error);
    }
} else {
    console.error("[API/SendNotification] CRITICAL: VAPID keys are not configured in environment variables. Push notifications will fail.");
}


async function sendPushNotification(subscription: PushSubscription, payloadString: string) {
    try {
        await webPush.sendNotification(subscription, payloadString);
        console.log(`[API/SendNotification] Push notification sent successfully to endpoint: ${subscription.endpoint.slice(0, 50)}...`);
    } catch (error: any) {
        console.error(`[API/SendNotification] Failed to send push. Status: ${error.statusCode}, Message: ${error.message}`);
        if (error.statusCode === 410 || error.statusCode === 404) {
            console.log('[API/SendNotification] Subscription expired or invalid. It should be removed.');
            // In a real app, you would have a mechanism to remove this subscription
        }
    }
}


export async function POST(request: Request) {
    if (!process.env.VAPID_PRIVATE_KEY || !process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
        return NextResponse.json({ error: 'VAPID keys not configured on server.' }, { status: 500 });
    }

    try {
        const { userIds, payload } = await request.json() as { userIds: string[], payload: NotificationPayload };

        if (!userIds || !Array.isArray(userIds) || userIds.length === 0 || !payload) {
            return NextResponse.json({ error: 'Missing or invalid userIds/payload.' }, { status: 400 });
        }
        
        console.log(`[API/SendNotification] Received request to notify ${userIds.length} user(s). Title: "${payload.title}"`);

        const allSubscriptions = await readDb<SubscriptionRecord[]>(SUBSCRIPTION_DB_PATH, []);

        const targetSubscriptions = allSubscriptions.filter(sub => userIds.includes(sub.userId));

        if (targetSubscriptions.length === 0) {
            console.log(`[API/SendNotification] No push subscriptions found for the target user(s).`);
            return NextResponse.json({ success: true, message: 'No push subscriptions found for target users.' });
        }
        
        console.log(`[API/SendNotification] Found ${targetSubscriptions.length} subscription(s) to send to.`);

        // The payload for the Service Worker
        const pushPayload = JSON.stringify({
            notification: {
                title: payload.title,
                body: payload.body,
                data: {
                    url: payload.url || '/'
                }
            }
        });

        // Send all notifications in parallel
        await Promise.all(
            targetSubscriptions.map(subRecord => 
                sendPushNotification(subRecord.subscription, pushPayload)
            )
        );

        return NextResponse.json({ success: true, message: `Dispatched ${targetSubscriptions.length} push notifications.` });

    } catch (error: any) {
        console.error('[API/SendNotification] Unhandled error in POST handler:', error);
        return NextResponse.json({ error: 'Failed to send notifications.', details: error.message }, { status: 500 });
    }
}
