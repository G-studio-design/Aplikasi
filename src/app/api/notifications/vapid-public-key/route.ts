
// src/app/api/notifications/vapid-public-key/route.ts
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

    if (!publicKey) {
        console.error("VAPID public key is not set in environment variables.");
        return new NextResponse("VAPID public key not configured.", { status: 500 });
    }

    return new NextResponse(publicKey, {
        status: 200,
        headers: {
            'Content-Type': 'text/plain',
        },
    });
}
