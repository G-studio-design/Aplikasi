// public/sw.js
'use strict';

let userId = null;
let lastNotificationTimestamp = null;

self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SET_USER_ID') {
        userId = event.data.userId;
        console.log(`[SW] User ID set to: ${userId}`);
        lastNotificationTimestamp = new Date().toISOString(); // Reset timestamp when user is set
    }
});

async function fetchAndDisplayNotifications() {
    if (!userId) {
        console.log('[SW] User ID not set, skipping notification check.');
        return;
    }

    try {
        const response = await fetch(`/api/notifications?userId=${userId}`);
        if (!response.ok) {
            console.error('[SW] Failed to fetch notifications, status:', response.status);
            return;
        }

        const notifications = await response.json();

        if (notifications && notifications.length > 0) {
            const latestNotification = notifications[0]; // Assuming sorted by timestamp desc

            // Check if this is a new notification since the last check
            if (!latestNotification.isRead && (!lastNotificationTimestamp || new Date(latestNotification.timestamp) > new Date(lastNotificationTimestamp))) {
                
                lastNotificationTimestamp = latestNotification.timestamp;
                
                self.registration.showNotification('Msarch App Notification', {
                    body: latestNotification.message,
                    icon: '/msarch-logo.png', // Main app logo
                    badge: '/icon.png', // Smaller icon for notification bar
                    data: {
                        url: latestNotification.projectId 
                             ? `/dashboard/projects?projectId=${latestNotification.projectId}` 
                             : '/dashboard'
                    }
                });
            }
        }
    } catch (error) {
        console.error('[SW] Error fetching notifications:', error);
    }
}

// Check for notifications periodically
setInterval(fetchAndDisplayNotifications, 30000); // Check every 30 seconds

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const urlToOpen = event.notification.data.url || '/dashboard';
    
    event.waitUntil(
        clients.matchAll({
            type: 'window'
        }).then((clientList) => {
            for (const client of clientList) {
                if (client.url === urlToOpen && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});

// Basic install and activate listeners for PWA functionality
self.addEventListener('install', (event) => {
    console.log('[SW] Service worker installed');
    // self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    console.log('[SW] Service worker activated');
    // event.waitUntil(clients.claim());
});
