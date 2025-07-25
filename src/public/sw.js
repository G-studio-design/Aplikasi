// public/sw.js

// This is the service worker file that handles background notifications.

let userId = null;
let notificationCheckInterval = null;

const CHECK_INTERVAL = 30000; // Check every 30 seconds

// Function to fetch notifications from the API
async function checkNotifications() {
  if (!userId) {
    // console.log('[SW] User ID not set, skipping notification check.');
    return;
  }

  try {
    const response = await fetch(`/api/notifications?userId=${userId}`);
    if (!response.ok) {
      console.error('[SW] Failed to fetch notifications, server responded with:', response.status);
      return;
    }

    const notifications = await response.json();
    const unreadNotifications = notifications.filter(n => !n.isRead);

    if (unreadNotifications.length > 0) {
      // Find the newest unread notification to display
      const latestNotification = unreadNotifications.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
      
      const notificationTitle = 'Msarch App Notification';
      const notificationOptions = {
        body: latestNotification.message,
        icon: '/msarch-logo.png', // Main app logo
        badge: '/icon.png', // A smaller badge icon
        data: {
          url: latestNotification.projectId 
            ? `/dashboard/projects?projectId=${latestNotification.projectId}`
            : '/dashboard'
        }
      };
      
      // Use the service worker's registration to show the notification
      await self.registration.showNotification(notificationTitle, notificationOptions);

      // Mark it as read via API so it doesn't show again
      // Note: This is a "fire-and-forget" call. We don't need to wait for the response.
      fetch(`/api/notifications/mark-as-read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId: latestNotification.id }),
      });
    }
  } catch (error) {
    console.error('[SW] Error checking notifications:', error);
  }
}

// Event listener for when the service worker is installed
self.addEventListener('install', (event) => {
  console.log('[SW] Service Worker installed.');
  // Force the waiting service worker to become the active service worker.
  event.waitUntil(self.skipWaiting());
});

// Event listener for when the service worker is activated
self.addEventListener('activate', (event) => {
  console.log('[SW] Service Worker activated.');
  // Take control of all clients as soon as the service worker is activated.
  event.waitUntil(self.clients.claim());
});

// Event listener for messages from the client (main application)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SET_USER_ID') {
    userId = event.data.userId;
    console.log(`[SW] User ID set to: ${userId}`);
    
    // Clear any existing interval to avoid multiple loops
    if (notificationCheckInterval) {
      clearInterval(notificationCheckInterval);
    }
    
    // Start checking for notifications immediately and then on an interval
    checkNotifications();
    notificationCheckInterval = setInterval(checkNotifications, CHECK_INTERVAL);
  }
});

// Event listener for when a notification is clicked
self.addEventListener('notificationclick', (event) => {
  event.notification.close(); // Close the notification

  const urlToOpen = new URL(event.notification.data.url || '/', self.location.origin).href;

  // This looks for an existing window/tab with the same URL and focuses it.
  // If not found, it opens a new one.
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});
