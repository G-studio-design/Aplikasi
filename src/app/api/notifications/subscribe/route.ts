
// src/app/api/notifications/subscribe/route.ts
import { NextResponse } from 'next/server';
import { saveSubscription } from '@/services/notification-service';
import type { PushSubscription } from 'web-push';

interface SubscriptionRequest {
    userId: string;
    subscription: PushSubscription;
}

export async function POST(request: Request) {
    try {
        const body: SubscriptionRequest = await request.json();
        const { userId, subscription } = body;

        if (!userId || !subscription) {
            return NextResponse.json({ error: 'Missing userId or subscription object.' }, { status: 400 });
        }

        await saveSubscription(userId, subscription);
        
        return NextResponse.json({ success: true, message: 'Subscription saved.' });

    } catch (error: any) {
        console.error('[API/Subscribe] Error saving subscription:', error);
        return NextResponse.json({ error: 'Failed to save subscription.' }, { status: 500 });
    }
}
