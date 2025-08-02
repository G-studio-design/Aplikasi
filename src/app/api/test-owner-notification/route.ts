// src/app/api/test-owner-notification/route.ts
import { NextResponse } from 'next/server';
import { notifyUsersByRole, type NotificationPayload } from '@/services/notification-service';

export async function GET(request: Request) {
    try {
        console.log('[Test API] Triggering test notification for Owner role...');

        const payload: NotificationPayload = {
            title: 'Tes Notifikasi Owner',
            body: 'Ini adalah notifikasi tes untuk memastikan peran Owner menerima pemberitahuan.',
            url: '/dashboard/settings' // Arahkan ke halaman pengaturan sebagai contoh
        };

        await notifyUsersByRole('Owner', payload);

        const message = 'Test notification for Owner has been dispatched. Check server logs and the device.';
        console.log(`[Test API] ${message}`);

        return NextResponse.json({ 
            success: true, 
            message: message
        });

    } catch (error: any) {
        console.error('[Test API] Error sending test notification:', error);
        return NextResponse.json({ 
            success: false, 
            error: 'Failed to send test notification.',
            details: error.message 
        }, { status: 500 });
    }
}
